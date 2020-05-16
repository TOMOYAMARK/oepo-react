import React from 'react'
import './ControlPanel.scss'
import style from '../_variables.scss'
import Grid from '@material-ui/core/Grid';
import Sound from 'react-sound'
import SE from '../../utils/SE_PATH'
import Chip from '@material-ui/core/Chip';
import FaceIcon from '@material-ui/icons/Face';
import DoneIcon from '@material-ui/icons/Done';
import EditIcon from '@material-ui/icons/Edit';
import ChatBubbleIcon from '@material-ui/icons/ChatBubble';
import Paper from '@material-ui/core/Paper';


class StatusChip extends React.Component{
  constructor(props){
    super(props)
  }

  render(){
    //条件に合わせた状態表示
    if(this.props.status === 'READY'){
      return (                
        <Chip
          icon={<DoneIcon />}
          label="準備完了"
          color="primary"
          style={{margin:"5px 0"}}
        />
      )}

    else if(this.props.status === 'DRAW'){
      return (
        <Chip
          icon={<EditIcon />}
          label="書き手"
          color="secondary"
          style={{margin:"5px 0"}}
        /> 
      )
    }
    else if(this.props.status === 'ANSWER'){
      return (
        <Chip
        icon={<ChatBubbleIcon />}
        label="回答者"
        style={{margin:"5px 0"}}
      />  
      )
    }else return null
  }
}

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
              <Paper key={i} className="user-panel" >

                <div className="status-container">
                  <StatusChip status={user.role}/>
                </div>

                <div className="score-board">
                  256
                </div>

                <div className="username">
                  {user.name}
                </div>

              </Paper>
            ))}
          </div>
          <div className="controller">
            <button onClick={() => this.props.showOekakiTheme()}>テーマを表示</button>
            <button onClick={() => this.props.startGame()}>準備完了</button>
            <button onClick={() => this.props.correct()}>正解する</button>
            <button onClick={() => this.props.showResult()}>リザルトを表示する</button>
            <p>ターン:{this.props.turnNum}</p>
            
          </div>
        </Grid>
      </div>
    )
  }
}