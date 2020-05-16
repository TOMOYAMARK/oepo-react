import React from 'react'
import Sound from 'react-sound'
import SE from '../../utils/SE_PATH'
import axios from '../../utils/API'
import './Game.scss'
import {ChatContainer} from '../Chat/ChatContainer'
import {AppBar} from '../AppBar/AppBar'
import {CanvasContainer} from '../Canvas/CanvasContainer'
import {ControlPanel} from '../ControlPanel/ControlPanel'
import Slide from '@material-ui/core/Slide';

import resultData from '../../utils/result.json'




const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});



async function fetchOekakiTheme(name){
  //特定のテーマをfetchしたい場合は、引数nameに渡しましょう
  var theme = ""
  await axios
    .post( "/api/fetch/theme",{name})
    .then(res => {
      theme = res.data.theme
    })
    .catch(() => {
      console.log("エラー");
    }); 
    return theme
}

//
//お絵かき画面（ゲーム画面)のcontainer
//
export class OekakiScreen extends React.Component{
  constructor(props){
    super(props)
    this.gameStates = {
      'IDLE':0,
      'GAME':1,
    }

    this.userMap = new Map([])
    this.state = {
      users:[],                       //ユーザオブジェクト(id,名前,役割,ステータス)の配列
      gameState:this.gameStates.IDLE, //ゲームの状態
      turnNum:0,                      //何ターン目        
      theme:null,                     //テーマ  
      onCorrect:false,                //正解アニメーションのトリガー  
      onGameFinished:false,           //リザルト表示のトリガー
      onThemeUp:false,                 //テーマ表示のトリガー    
      imageResults: [],                //リザルトに表示する画像
      gameHistory:{                   //リザルトに表示するゲーム履歴
        turns:[],
        idMap:{},
      },                  
    }
  }



  async requestGameStart(){
    //ゲーム開始ボタンの押下をサーバに伝える
    await axios
    .post( "/game/change/state","{state:game}")
    .then(res => {
      console.log(res.data)
    })
    .catch(() => {
      console.log("エラー");
    }); 
  }

  componentDidMount(){ 
    // websocketの準備
    let address = require('../../env.js').GAMEWS()
    this.webSocket = new WebSocket(address);
    this.webSocket.onopen = (e => this.handleOnOpen(e));
    this.webSocket.onmessage = (e => this.handleOnMessage(e));

    //!! constructorに接続の処理を書こうと思ったが、コンソールを見ると、処理が二回連続で実行されるため、 !!//
    //!! とりあえず違うライフサイクルフックに移動 !!//
  }



  handleOnMessage(e){
    const json = e.data;
    const msg = JSON.parse(json);

    var users = this.state.users.slice()
    const user = msg.data

    if(msg.state === "player"){
      //部屋に参加しているプレイヤーの情報を順次反映
      if(!this.userMap.has(user.id)){
        //新規ユーザならば、users(UI表示)に名前追加
        this.userMap.set(user.id,user)
        users.push(user)
      }
      this.setState({users:users})
    }
    else if(msg.state === "leave-room"){
      var leavingUser = this.userMap.get(user.id)
      this.userMap.delete(user.id)

      const newUsers = users.filter(u => u !== leavingUser);

      this.setState({users:newUsers})
    }
    else if(msg.state === "game-ready"){
      users.map(user => {
        if(msg.user_id === user.id) user.role = 'READY' //!!role...?
        return user
      })
      this.setState({users:users})
    }
    else if(msg.state === "game-start"){
      //ゲーム開始
      this.setState({gameState:this.gameStates.GAME})
      //スコアの初期化
      users = users.map(user => {
        user.score = 0
        return user
      })
      this.setState({users:users})
      //効果音
      this.props.makeSound(SE.Hajime)
    }
    else if(msg.state === "begin-turn"){
      //ターンの開始。各ユーザの役割とターン情報を反映。
      this.setState({turnNum:msg.turn.num})
      let role = msg.turn.role

      users = users.map(user => {
        user.role = role[user.id]
        return user
      })

      this.setState({users:users})
    }
    else if(msg.state === "theme-up"){
      //テーマを受け取る
      let theme = msg.theme
      //テーマの表示
      this.showOekakiTheme(theme)
    }
    else if(msg.state === "user-answered"){
      //ユーザが正解しました。正解者のuidも一緒。

      //正解アニメーションを起動します
      this.showCorrect()

      //スコアの加点処理
      var additional_score = msg.params.additional_score
      users = users.map(user => {
        user.score += additional_score[user.id]
        return user
      })


      //!! すぐに次のターン/ゲーム終了を要請(アニメーション流すなら以降の処理のタイミングをずらす)  !!//
      var msgSending = {
        state:"req-next",
        user_id:this.props.user.id
      } 
      
      console.log(msgSending)
      const json = JSON.stringify(msgSending)

      //テーマをクリアして、準備完了！
      this.initOekakiTheme()
      this.webSocket.send(json)
    }
    else if(msg.state === "game-finished"){
      //ゲームが終了しました。

      //ゲーム履歴のデータを取得
      //ゲーム終了アニメーションを起動します。(リザルトウィンドウの表示)
      this.showResult(msg.historyPayload)

      users = users.map(user => {
        user.role = 'drawer'      //!!キャンバスにかけるようにdrawerをデフォルトにするか
        return user
      })

      //状態初期化
      this.setState({turnNum:0,gameState:this.gameStates.IDLE,users:users})

    }
    

    console.log(msg)

  }

  handleOnOpen(e){
    //ソケットの接続が確立したらjoin-roomの信号を出し、ルーム情報を受け取る。
    this.joinGame()
  }

  joinGame(){
    //部屋に参加したフラグをサーバーに送信(join-room)
    var msg = {
      state:"join-room",
      user:{
        id:this.props.user.id,
        name:this.props.user.name,
      }
    }

    console.log(msg)
    const json = JSON.stringify(msg);
    this.webSocket.send(json); // websocketに送信!
  }

  startGame(){
    var msg = {
      state:"game-ready",
      user_id:this.props.user.id
    } 

    console.log(msg)
    const json = JSON.stringify(msg)
    this.webSocket.send(json)
  }

  showCorrect(){
    this.props.makeSound(SE.CorrectAnswer)
    this.setState({onCorrect:true})
    setTimeout(() => this.setState({onCorrect:false}),1000)
  }

  showResult(historyPayload){
    this.setState({gameHistory:historyPayload})
    this.props.makeSound(SE.GameFinished)
    this.setState({onGameFinished:true})
  }


  async showOekakiTheme(theme){
    //取得
    if(theme === undefined)
      theme = await fetchOekakiTheme() //!!テスト用のボタン用処理
  
    this.setState({theme:theme.name})

    this.props.makeSound(SE.ThemeUp)
    this.setState({onThemeUp:true})
  }

  //テーマ初期化。コンポーネントを非表示に。
  initOekakiTheme(){
    this.setState({onThemeUp:false})
    this.setState({theme:null})
  }

  handleTurnEnd(img) {
    console.log('handle turn end');
    const imageResults = [...this.state.imageResults, img];
    this.setState({
      imageResults: imageResults,
    });
    console.log(imageResults);
  }

  addPoints(point){
    //テスト用ポイント加算処理
    var users = this.state.users.slice()
    users = users.map(user => {
      if(user.score === undefined) user.score = 0
      user.score += point
      return user
    })

    this.setState({users:users})

  }

  render(){
    return (
      <div className="game-container">
        <AppBar 
          theme={this.state.theme} 
          onThemeUp={this.state.onThemeUp}
          setVolume={(value) => this.props.setVolume(value)}
          volume={this.props.volume}
           />
    
        <CanvasContainer
          onCorrect={this.state.onCorrect}
          onGameFinished={this.state.onGameFinished}
          gameHistory={this.state.gameHistory}
          mainUsrId={this.props.user.id}
          users={this.state.users}
          onTurnEnd={img => this.handleTurnEnd(img)}
          closeResultWindow={() => {
            this.setState({onGameFinished:false})
          }}
          imageResults={this.state.imageResults}
        /> 
        <ChatContainer user={this.props.user}/>

        <ControlPanel 
        startGame={() => this.startGame()}
        showOekakiTheme={() => this.showOekakiTheme()} users={this.state.users}
        turnNum = {this.state.turnNum}
        correct = {() => this.showCorrect()}
        showResult = {() => this.showResult(resultData)}
        addPoints = {() => this.addPoints(10)}
         />

      </div>
    )
  }
}

