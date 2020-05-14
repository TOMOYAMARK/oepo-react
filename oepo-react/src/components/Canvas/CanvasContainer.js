import React from 'react'
import './Canvas.scss'
import style from '../_variables.scss'
import Canvas from './Canvas';
import Palette from '../Palette/Palette';
import {CorrectAnimation, ShowTheme,ShowResult} from '../../utils/animation'


export class CanvasContainer extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      state: "draw",
      weight: 15,
      opacity: 1,
      color: "black",
      colors: ["blue", "red", "yellow", "green", "black", "white"],
      isBackable: false,
      isForwardable: false,
      buttonState: "",
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
      weight: parseInt(e.target.value),
    });
  }

  handleChangeOpacity(e) {
    console.log('handle change opacity : ' + e.target.value);
    this.setState({
      opacity: parseFloat(e.target.value),
    });
  }

  handleClickColor(color) {
    console.log('handle click color : ' + color);
    this.setState({
      color: color,
    });
  }

  handleClickReset() {
    this.setState({
      buttonState: "reset",
    })
  }

  handleResetInCv() {
    this.setState({
      buttonState: "",
    })
  }

  handleChangeBackable(isBackable) {
    console.log('handle change backable : ' + isBackable);
    this.setState({
      isBackable: isBackable,
    })
  }

  handleChangeForwardable(isForwardable) {
    console.log('handle change forwardable : ' + isForwardable);
    this.setState({
      isForwardable: isForwardable,
    })
  }

  handleBack() {
    console.log('handle back');
    this.setState({
      buttonState: "back",
    })
  }

  handleForward() {
    console.log('handle forward');
    this.setState({
      buttonState: "forward",
    })
  }

  render(){

    return(
      <div className="canvas-container">
        <Canvas 
          mainUsrId={this.props.mainUsrId}
          palette={this.state}
          onChangeBackable={isAble => this.handleChangeBackable(isAble)}
          onChangeForwardable={isAble => this.handleChangeForwardable(isAble)}
          onResetInCv={e => this.handleResetInCv()}
          onTurnEnd={img => this.props.onTurnEnd(img)}
        />
        <Palette

          state={this.state.state}
          weight={this.state.weight}
          opacity={this.state.opacity}
          color={this.state.color}
          colors={this.state.colors}
          backable={this.state.isBackable}
          forwardable={this.state.isForwardable}
          onClickColor={color => this.handleClickColor(color)}
          onChangeWeight={e => this.handleChangeWeight(e)}
          onChangeOpacity={e => this.handleChangeOpacity(e)}
          onChangeState={state => this.handleChangeState(state)}
          onBack={e => this.handleBack()}
          onForward={e => this.handleForward()}
          onClickReset={e => this.handleClickReset(e)}
        />

        {CorrectAnimation(this.props.onCorrect)}
        {ShowResult(this.props.onGameFinished,() => this.props.closeResultWindow(),this.props.gameHistory)}
      </div>
    )
  }
}