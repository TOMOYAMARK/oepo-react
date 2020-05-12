import React from 'react'
import './AppBar.scss'
import Paper from '@material-ui/core/Paper';
import {ShowTheme} from '../../utils/animation'

//ゲームの最上部に表示されるヘッダーバーの領域
//例えばお題の表示とか、音量調節とかするとこ 各種機能のショートカットをおくのもアリ

export class AppBar extends React.Component{

  constructor(props){
    super(props)

    this.state = {
      //ゲームの状態　(待機/対戦部屋)
    }
  }

  render(){
    return(
      <Paper>
        <div className="app-bar">
          {ShowTheme(this.props.onThemeUp,this.props.theme)}
        </div>
      </Paper>
    )
  }
}