import React from 'react'
import './ControlPanel.scss'
import '../_variables.scss'
import Grid from '@material-ui/core/Grid';

export class ControlPanel extends React.Component{

  render(){
    return (
      <div className="control-panel">
        <Grid container>
          {this.props.users.map((user) => (
            <div className="user-container" >
              {user}
            </div>
          ))}
        </Grid>
      </div>
    )
  }
}