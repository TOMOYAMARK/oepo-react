import React from 'react'
import './ControlPanel.scss'
import '../_variables.scss'
import Grid from '@material-ui/core/Grid';
import Sound from 'react-sound'
import SE from '../../utils/SE_PATH'

export class ControlPanel extends React.Component{

  constructor(props){
    super(props)

    this.state = {
    }
  }

  render(){
    return (
      <div className="control-panel">
        <Grid container>
          <div className="users-container">
            {this.props.users.map((user,i) => (
              <div key={i} className="user-panel" >
                {user.name + " " + "(" + user.role + ")"}
              </div>
            ))}
          </div>
          <div className="controller">
            <button onClick={() => this.props.fetchOekakiTheme()}>テーマを取得</button>
            <button onClick={() => this.props.startGame()}>準備完了</button>
            <button onClick={() => {this.props.makeSound(SE.CorrectAnswer)}}>正解音を鳴らす</button>
            <p>ターン:{this.props.turnNum}</p>
            
          </div>
        </Grid>
      </div>
    )
  }
}