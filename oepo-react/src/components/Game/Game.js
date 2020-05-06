import React from 'react'
import './Game.scss'
import {ChatContainer} from '../Chat/ChatContainer'
import {AppBar} from '../AppBar/AppBar'
import {CanvasContainer} from '../Canvas/CanvasContainer'
import {ControlPanel} from '../ControlPanel/ControlPanel'

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';

//
//Lobby画面Container
//
class LobbyScreen extends React.Component{
  
  constructor(props){
    super(props)

    this.state = {
      userName:"Anonymous",
    }

  }
  render(){
    return (
      <div className="lobby-container">
        <div className="inputs">
          <p>This is LOBBY!</p>
          <FormControl className="txt-field" variant="outlined" >
              <Input
              style={{height:'50px'}}
              value={this.state.userName}
              onChange={event => this.setState({userName: event.target.value})}>
              </Input>
            </FormControl>
          <Button style={{height:'50px'}} variant="contained" color="primary" onClick={() => this.props.goToGame(this.state.userName)}>ゲームへ</Button>
        </div>
      </div>
    )
  }
}

//
//お絵かき画面（ゲーム画面)のcontainer
//
class OekakiScreen extends React.Component{
  render(){
    return (
      <div className="game-container">
        <AppBar />
    
        <CanvasContainer/> 
        <ChatContainer userName={this.props.userName}/>

        <ControlPanel />
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
      userName:undefined,
    }
  }

  //
  //ロビーからゲーム画面へ移行する。そのとき、ユーザ名を入力してもらう。
  //
  goToGame(userName){
    this.setState({userName:userName})
    this.setState({screenState:this.screenStates.GAME})
  }


  render(){
    //ロビー画面
    if(this.state.screenState === this.screenStates.LOBBY){
      return (
        <LobbyScreen goToGame={(name) => this.goToGame(name)}/>
      )
    }
    //ゲーム画面
    else if(this.state.screenState === this.screenStates.GAME){
      return (
        <OekakiScreen userName = {this.state.userName}/>
      )
    }

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