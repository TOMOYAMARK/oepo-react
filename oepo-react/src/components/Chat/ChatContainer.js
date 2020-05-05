import React from 'react';
import './Chat.scss'
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';


class ChatDisplay extends React.Component{
  constructor(props){
    super(props)
  }

  render() {
    return (
      <div className="chat-disp">
        {this.props.msgQueue.map((item) => (
          <p><span class="status-txt">{item.status}</span>:<span class="msg-txt">{item.body}</span> </p>
        ))}
      </div>
    )
  }
}

export class ChatContainer extends React.Component{

  constructor(props){
    super(props)

    this.state = {
      msgValue:"",
      msgQueue:[],
      userName:"",//おそらくpropsになるが
    }
  }

  handleSubmit(msg){
    //メッセージ本文と送信主のステータスを受け取り
    //メッセージキューに追加

    msg.status = "JKニキ"; //!TEST!

    var msgQueue = this.state.msgQueue.slice()
    msgQueue.push(msg)
    this.setState({
      msgQueue:msgQueue
    })
  }

  render() {
    return (
      <div className="chat-container">

        <ChatDisplay msgQueue={this.state.msgQueue}/>
        <Grid xs="12" container>
          <FormControl className="txt-field" variant="outlined" style={{width:'430px'}} defaultValue="">
            <Input
            style={{height:'50px'}}
            value={this.state.msgValue}
            onChange={event => this.setState({msgValue: event.target.value})}>
            </Input>
          </FormControl>
          <Button className="submit-btn" variant="contained" 
            style={{width:'70px'}} disableElevation
            onClick={ () => this.handleSubmit({
              status:this.state.userName,
              body:this.state.msgValue
            })}
          >
              送信
          </Button>
        </Grid>
      </div>
    )
  }
}

