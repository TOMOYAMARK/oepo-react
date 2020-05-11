import React from 'react'
import './ControlPanel.scss'
import '../_variables.scss'
import Grid from '@material-ui/core/Grid';

export class ControlPanel extends React.Component{

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
            
          </div>
        </Grid>
      </div>
    )
  }
}