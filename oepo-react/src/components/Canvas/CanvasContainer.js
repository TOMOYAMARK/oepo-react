import React from 'react'
import './Canvas.scss'
import Canvas from './Canvas';

export class CanvasContainer extends React.Component{

  render(){
    return(
      <div className="canvas-container">
        <Canvas mainUsrId={this.props.mainUsrId}/>
      </div>
    )
  }
}