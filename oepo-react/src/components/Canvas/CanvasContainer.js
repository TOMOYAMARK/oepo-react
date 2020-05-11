import React from 'react'
import './Canvas.scss'
import Canvas from './Canvas';
import Palette from '../Palette/Palette';

export class CanvasContainer extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      state: "draw",
      weight: 15,
      opacity: 1,
      color: "black",
      colors: ["blue", "red", "yellow", "green", "black", "white"],
    };
  }

  handleChangeState(state) {
    console.log('handle change state : ' + state);
    this.setState({
      state: state,
    });
  }

  handleChangeWeight(e) {
    console.log('handle change weight : ' + e.target.value);
    this.setState({
      weight: e.target.value,
    });
  }

  handleChangeOpacity(e) {
    console.log('handle change opacity : ' + e.target.value);
    this.setState({
      opacity: e.target.value,
    });
  }

  handleClickColor(color) {
    console.log('handle click color : ' + color);
    this.setState({
      color: color,
    });
  }

  render(){
    return(
      <div className="canvas-container">
        <Canvas 
          mainUsrId={this.props.mainUsrId}
          palette={this.state}
        />
        <Palette
          state={this.state.state}
          weight={this.state.weight}
          opacity={this.state.opacity}
          color={this.state.color}
          colors={this.state.colors}
          onClickColor={color => this.handleClickColor(color)}
          onChangeWeight={e => this.handleChangeWeight(e)}
          onChangeOpacity={e => this.handleChangeOpacity(e)}
          onChangeState={state => this.handleChangeState(state)}
        />
      </div>
    )
  }
}