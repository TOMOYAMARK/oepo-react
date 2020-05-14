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
import {OekakiScreen} from './Oekaki'
import {LobbyScreen} from './Lobby'




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