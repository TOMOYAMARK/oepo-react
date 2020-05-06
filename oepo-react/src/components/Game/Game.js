import React from 'react'
import './Game.scss'
import {ChatContainer} from '../Chat/ChatContainer'
import {AppBar} from '../AppBar/AppBar'
import {CanvasContainer} from '../Canvas/CanvasContainer'
import {ControlPanel} from '../ControlPanel/ControlPanel'
export class Game extends React.Component{


  render(){
    return (
      <div className="game-container">
        <AppBar />

        <CanvasContainer/> 
        <ChatContainer />

        <ControlPanel />

      </div>
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