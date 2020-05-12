import React from 'react'
import './AppBar.scss'

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
      <div className="app-bar">
        <p>{this.props.theme}</p>
      </div>
    )
  }
}