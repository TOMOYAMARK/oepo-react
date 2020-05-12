import React from 'react'
import Sound from 'react-sound'
import SE from '../../utils/SE_PATH'
import axios from '../../utils/API'
import './Game.scss'
import {ChatContainer} from '../Chat/ChatContainer'
import {AppBar} from '../AppBar/AppBar'
import {CanvasContainer} from '../Canvas/CanvasContainer'
import {ControlPanel} from '../ControlPanel/ControlPanel'

import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';


//
//Lobby画面Container
//
class LobbyScreen extends React.Component{
  
  constructor(props){
    super(props)

    this.state = {
      userName:"",
      password:"",
      showPassword:false,
      errMsgUsername:"",
      errMsgPassword:"",
    }

  }

  async verifyUser(username,password){
    //パスワードのハッシュ値（SHA256）を生成、POST
    const crypto = require('crypto') 
    var passhash = crypto.createHash('sha256').update(password,'utf8').digest('hex')

    var form = {
      username:username,
      passhash:passhash,
    }

    //ログインリクエスト
    await axios
      .post( "/api/user/login",form)
      .then(res => {
        if(res.data.msg === "missing-username"){
          //ユーザ名が見つかりませんでした。
          this.setState({errMsgUsername:"ユーザ名が見つかりませんでした。",errMsgPassword:""})
        }else if(res.data.msg === "failed"){
          //パスワードが違います。
          this.setState({errMsgUsername:"",errMsgPassword:"パスワードが違います。"})
        }else if(res.data.msg === "success"){
          //認証成功 userオブジェクトを渡して状態変更
          this.props.goToGame(res.data.user)
        }
      })
      .catch(() => {
        //サーバーエラー
        console.log("エラー");
      }); 
      
    
  }

  renderErrorInput(id){
    if(id === 'username')return (
      <FormHelperText>{this.state.errMsgUsername}</FormHelperText>
    )
    else if(id === 'password') return(
      <FormHelperText>{this.state.errMsgPassword}</FormHelperText>
    )
  }

  render(){
    return (
      <div className="lobby-container">
        <div className="inputs">
          <div className="input-field">
          <p>This is LOBBY!</p>
          <FormControl className="txt-field" variant="outlined" error={this.state.errMsgUsername !== ""}>
          <InputLabel htmlFor="standard-adornment-username">Username</InputLabel>
              <Input
              style={{height:'50px',width:'300px'}}
              value={this.state.userName}
              onChange={event => this.setState({userName: event.target.value})}>
              </Input>
              {this.renderErrorInput('username')}
            </FormControl>
            </div>
            <div className="input-field">
          <FormControl variant="outlined" error={this.state.errMsgPassword !== ""}>
          <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
          <Input
            id="password"
            style={{height:'50px',width:'300px'}}
            type={this.state.showPassword ? 'text' : 'password'}
            value={this.state.password}
            onChange={event => this.setState({password: event.target.value})}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={event => this.setState({showPassword: !this.state.showPassword})}
                >
                  {this.state.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
          />
          {this.renderErrorInput('password')}
        </FormControl>
        </div>
          <Button style={{height:'50px'}} variant="contained" color="primary" onClick={() => this.verifyUser(this.state.userName,this.state.password)}>ゲームへ</Button>
        </div>
      </div>
    )
  }
}

//
//お絵かき画面（ゲーム画面)のcontainer
//
class OekakiScreen extends React.Component{
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
      onThemeUp:false                 //テーマ表示のトリガー    
    }
  }

  async fetchOekakiTheme(){
    //テーマ取得にもオプションがつくかもしれないのでpostです
    var theme = ""
    await axios
      .post( "/api/fetch/theme","{}")
      .then(res => {
        console.log(res.data)
        theme = res.data.theme.name
      })
      .catch(() => {
        console.log("エラー");
      }); 
      return theme
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
        if(msg.user_id === user.id) user.role = 'ready' //!!role...?
        return user
      })
      this.setState({users:users})
    }
    else if(msg.state === "game-start"){
      //ゲーム開始
      this.setState({gameState:this.gameStates.GAME})
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
      let theme = msg.theme.name
      //テーマの表示
      this.showOekakiTheme(theme)
    }
    else if(msg.state === "user-answered"){
      //ユーザが正解しました。正解者のuidも一緒。

      //効果音を鳴らします。
      this.props.makeSound(SE.CorrectAnswer)
      //正解アニメーションを起動します
      this.showCorrect()

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
      //**ゲーム終了。ゲームの履歴情報も一緒に送られてくる.**//
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

  async showOekakiTheme(theme){
    //取得
    if(theme === undefined)
      theme = await this.fetchOekakiTheme() //!!テスト用のボタン用処理
  
    this.setState({theme:theme})

    this.props.makeSound(SE.ThemeUp)
    this.setState({onThemeUp:true})
  }

  //テーマ初期化。コンポーネントを非表示に。
  initOekakiTheme(){
    this.setState({onThemeUp:false})
    this.setState({theme:null})
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
          mainUsrId={this.props.user.id}
          users={this.state.users}
        /> 
        <ChatContainer userName={this.props.userName}/>
        <CanvasContainer/> 
        <ChatContainer userName={this.props.user.name}/>

        <ControlPanel 
        startGame={() => this.startGame()}
        showOekakiTheme={() => this.showOekakiTheme()} users={this.state.users}
        turnNum = {this.state.turnNum}
        correct = {() => this.showCorrect()}
         />

      </div>
    )
  }
}


export class Game extends React.Component{
  constructor(props){
    super(props)

    this.screenStates = {
      'LOBBY':0,
      'GAME':1,
    }
    this.state = {
      //最初はロビー(名前入力)から
      screenState:this.screenStates.LOBBY,
      user:undefined,
      soundStates:{},                       //効果音の状態辞書 (path:true/false)
      soundVolume:50                        //効果音の音量
    }
  }

  //
  //ロビーからゲーム画面へ移行する。そのとき、ユーザ名を入力してもらう。
  //
  goToGame(user){
    this.setState({user:user})
    this.setState({screenState:this.screenStates.GAME})
  }

  setVolume(value){
    this.setState({soundVolume:value})
  }


  render(){
    var screen = undefined
    //ロビー画面
    if(this.state.screenState === this.screenStates.LOBBY){
      screen = <LobbyScreen goToGame={(name) => this.goToGame(name)}/>
    }
    //ゲーム画面
    else if(this.state.screenState === this.screenStates.GAME){
          screen = <OekakiScreen 
            makeSound = {(se) => this.makeSound(se)} 
            user = {this.state.user}
            setVolume = {(value) => this.setVolume(value)}
            volume={this.state.soundVolume}
            />
    }

    return (
      <div>
        {screen}
        {this.renderSounds()}
      </div>
    )

  }


  //効果音をトリガーするコンポーネントにpropsする。
  //require(utils.SE_PATH.js).SE.%鳴らす効果音の名前%をmakeSound()に渡すと、それが鳴ります。
  makeSound(se){
    let soundStates = Object.assign({}, this.state.soundStates)
    soundStates[se] = true

    this.setState({soundStates:soundStates})
  }

  handleSongFinishedPlaying(se){
    //Soundコンポーネントの描画をやめる 
    let soundStates = Object.assign({}, this.state.soundStates)
    soundStates[se] = false
    this.setState({soundStates:soundStates})
  }

  renderSounds(){
    const sounds = Object.keys(this.state.soundStates).filter(se => {
      return this.state.soundStates[se]
    })
    const playlists = sounds.map(sound => 
        <li>
          <Sound
            url={sound}
            playStatus={Sound.status.PLAYING}
            playFromPosition={300 /* in milliseconds */}
            onFinishedPlaying={() => this.handleSongFinishedPlaying(sound)}
            volume={this.state.soundVolume}
          /> 
        </li>
      )

      return (
        <ul>{playlists}</ul>
      )
    
  }
}

/*


container{
  Game 950 * 750
    → navbar Fluid * 130
    → canvas-container 8/10 * 7/10
      → canvas 1195 * 670
    →status-container 2/10 * 7/10
      →game-status 100% * 10%
      →chat-window 100% * 90%
    →control-pannel Fluid * 3/10
      →users-pannel 7/10 * 3/10
      →controlers 3/10 * 3/10
}



*/