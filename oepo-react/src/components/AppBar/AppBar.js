import React from 'react'
import './AppBar.scss'
import Paper from '@material-ui/core/Paper';
import {ShowTheme} from '../../utils/animation'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import Slider from '@material-ui/core/Slider';
import VolumeDown from '@material-ui/icons/VolumeDown';
import VolumeUp from '@material-ui/icons/VolumeUp';

//ゲームの最上部に表示されるヘッダーバーの領域
//例えばお題の表示とか、音量調節とかするとこ 各種機能のショートカットをおくのもアリ

export class AppBar extends React.Component{

  constructor(props){
    super(props)

    this.state = {
      //ゲームの状態　(待機/対戦部屋)

      volume:50     //音量調整
    }
  }

  render(){
    return(
      
      <Paper>
        <div className="app-bar">
          <div className="theme-container">
            {ShowTheme(this.props.onThemeUp,this.props.theme)}
          </div>

          <div className="icon">
            <VolumeDown className="centerize icon"/>
          </div>
          <div style={{width:"100px"}}>
            <Slider value={this.props.volume} 
            onChange={(event, newValue) => {
              this.props.setVolume(newValue)
            }} 
            aria-labelledby="continuous-slider" 
            className="centerize"
            />
          </div>
          <div className="icon">
            <VolumeUp className="centerize"/>
          </div>
        </div>

      </Paper>
    )
  }
}