import React from 'react'
import Sound from 'react-sound'
import SE from '../../utils/SE_PATH'
import axios from '../../utils/API'
import './Game.scss'
import {ChatContainer} from '../Chat/ChatContainer'
import {AppBar} from '../AppBar/AppBar'
import {CanvasContainer} from '../Canvas/CanvasContainer'
import {ControlPanel} from '../ControlPanel/ControlPanel'
import SendIcon from '@material-ui/icons/Send';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import Icon from '@material-ui/core/Icon';

import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import Badge from '@material-ui/core/Badge';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';




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
async function countOekakiTheme(){
  //お絵かきテーマ総数のカウント
  var count;
  await axios
    .post( "/api/count/theme")
    .then(res => {
      console.log(res.data)
    })
    .catch(() => {
      console.log("エラー");
    }); 
    return count
}

//
//Lobby画面Container
//
export class LobbyScreen extends React.Component{
  
  constructor(props){
    super(props)

    this.state = {
      userName:"makutomoya",
      password:"0721",
      showPassword:false,
      errMsgUsername:"",
      errMsgPassword:"",
      themePosterOpen:false,    //お題箱のダイアログスイッチ
      themeName:"",             //お題箱テーマ名入力値
      themeLabels:[""],         //お題箱テーマ名正解ラベルの配列
      duplicationError:false,   //お題箱での重複エラーフラグ
      nullInputError:false,     //テーマが記入されていない
      priorTheme:null,          //お題箱、既存のテーマ表示用
      onPostSuccess:false,      //お題箱、投稿成功!
      themeBoxCount:0,          //お題箱に含まれるテーマの総数カウント
    }

  }

  componentDidMount(){
    var count = this.countOekakiTheme()
    this.setState({themeBoxCount:count})
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
    if(this.state.duplicationError && id === 'theme-input') return(
      <FormHelperText>{"すでに同名のテーマが存在します! :" + this.state.priorTheme.name +  '(' + this.state.priorTheme.labels_json + ')'}</FormHelperText>
    )
    else if(this.state.nullInputError && id === 'theme-input') return (
      <FormHelperText>{"テーマを入力してください!"}</FormHelperText>
    )
    else if(this.state.noAnswerError && id === 'theme-input') return (
      <FormHelperText>{"こたえを少なくとも１つは入力してください!"}</FormHelperText> 
    )

    }
  
  renderLabelInputs(){
    //お題箱ダイアログ中のラベル入力テキストを表示させる
    const inputs = this.state.themeLabels.map((label,i) =>  
      <li>
        <FormControl variant="outlined" style={{margin:"6px 0"}}>
          <InputLabel htmlFor="component-outlined">こたえ ({i+1})</InputLabel>
          <OutlinedInput id="component-outlined" value={label} onChange={(e) => this.handleLabelChange(e.target.value,i)} label="Name" />
        </FormControl> <IconButton onClick={() => this.handleRemoveLabel(i)} color="secondary" disabled={this.state.themeLabels.length===1}><RemoveIcon/></IconButton>
      </li>
    )
    return (
      <div>
      <ul>{inputs}</ul>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => this.handleAddLabel()}
      >
        こたえを増やす
      </Button>
      </div>
    )
  }


  handleLabelChange(val,i){
    //お題箱ダイアログ中のラベル入力時処理
    let labels = this.state.themeLabels.slice()
    labels[i] = val
    this.setState({themeLabels:labels}) 
  }

  async handlePostTheme(){
    //エラー内容の初期化
    this.setState({nullInputErrorn:false,duplicationError:false})

    if(this.state.themeName === "") {
      this.setState({nullInputError:true})
      return
    }
    //state.themeNameとstate.themeLabelsを元に投稿をリクエストする
    //メッセージフォームの構成
    var form = {
      theme:this.state.themeName,
      labels:this.state.themeLabels,
    }

    //POST
    await axios
    .post( "/api/post/theme",form)
    .then(async (res) => {
      //重複がある場合に知らせる
      if(res.data === 'DUPLICATE'){
        //すでに存在するテーマデータをとってくるよ
        var prior = await fetchOekakiTheme(form.theme) 
        this.setState({priorTheme:prior})

        //エラーメッセージの表示
        this.setState({duplicationError:true})
      }
      else if(res.data === 'OK'){
        //内容を初期化し、ダイアログを閉じる
        this.setState({themePosterOpen:false})
        this.clearThemeInput()

        //snackbar成功通知
        this.setState({onPostSuccess:true})
      }
    })
    .catch(() => {
      //サーバーエラー
      console.log("エラー");
    }); 

    
  }

  //お題箱ダイアログラベル入力欄の追加
  handleAddLabel(){
    var labels = this.state.themeLabels.slice()
    labels.push("")
    this.setState({themeLabels:labels})
  }

  //お題箱ダイアログラベル入力欄の削除
  handleRemoveLabel(index){
    var labels = this.state.themeLabels.slice()
    labels = labels.filter((label,i) => {
      return i !== index
    })

    this.setState({themeLabels:labels})
  }

  //お題箱ダイアログの入力情報の初期化
  clearThemeInput(){
    this.setState({themeName:"",themeLabels:[""]})
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
          <Button style={{height:'50px',margin:"2px"}} variant="contained" color="primary" onClick={() => this.verifyUser(this.state.userName,this.state.password)}>ゲームへ</Button>
          <Button style={{height:'50px',margin:"2px"}} variant="contained" 
          endIcon={
              <Badge badgeContent={this.state.themeBoxCount} max="99999999">
                <SendIcon />
              </Badge>
            }
             color="secondary" onClick={() => {this.setState({themePosterOpen:true})}}>お題箱</Button>
        </div>
        <div>
        <Dialog
        open={this.state.themePosterOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => this.setState({themePosterOpen:false})}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle id="alert-dialog-slide-title">{"お題の投稿"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            お題を投稿して、おえぽりライフを充実させよう！
          </DialogContentText>

          <FormControl variant="outlined" error={this.state.duplicationError || this.state.nullInputError}>
        <InputLabel htmlFor="component-outlined">テーマ</InputLabel>
          <OutlinedInput id="component-outlined" value={this.state.themeName} onChange={(e) => this.setState({themeName:e.target.value})} label="Name" />
          {this.renderErrorInput('theme-input')}
        </FormControl>
        {this.renderLabelInputs()}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => {this.clearThemeInput();this.setState({themePosterOpen:false})}} color="grey">
            キャンセル
          </Button>
          <Button onClick={() => {this.handlePostTheme()}} color="primary">
            送信  
          </Button>

        </DialogActions>
      </Dialog>
      </div>
        
      </div>
    )
  }
}
