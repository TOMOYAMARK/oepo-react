import React from 'react';
import './Chat.scss'
import style from '../_variables.scss'
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';


class ChatDisplay extends React.Component{
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div className="chat-disp">
        {this.props.msgQueue.map((item) => (
          <p><span className="status-txt">{item.status}</span>:<span className="msg-txt">{item.body}</span> </p>
        ))}
      </div>
    )
  }
}

export class ChatContainer extends React.Component{

  constructor(props){
    super(props);

    // websocketの準備
    this.webSocket = new WebSocket("ws://34.85.36.109:3000");
    this.webSocket.onmessage = (e => this.handleOnMessage(e));

    this.state = {
      msgValue:"",
      msgQueue:[],
    }
  }

  handleSubmit(msg){
    // メッセージ本文と送信主のステータスをサーバーに送信

    console.log(msg)
    const json = JSON.stringify(msg);
    this.webSocket.send(json); // websocketに送信!
  }

  handleOnMessage(e){
    //メッセージ本文と送信主のステータスをサーバーから受け取り
    //メッセージキューに追加

    const json = e.data;
    const msg = JSON.parse(json);

    var msgQueue = this.state.msgQueue.slice();
    msgQueue.push(msg);

    this.setState({
      msgQueue:msgQueue
    });
  }

  render() {
    return (
      <div className="chat-container">

        <ChatDisplay msgQueue={this.state.msgQueue}/>
        <Grid xs="12" container>
          <FormControl className="txt-field" variant="outlined" style={{width:`calc(${style.chatWidth} - 50px)`}} defaultValue="">
            <Input
            style={{height:'50px'}}
            value={this.state.msgValue}
            onChange={event => this.setState({msgValue: event.target.value})}>
            </Input>
          </FormControl>
          <button className="submit-btn"
            style={{width:'50px'}} 
            onClick={ () => this.handleSubmit({
              status:this.props.userName,
              body:this.state.msgValue
            })}
          >
              送信
          </button>
        </Grid>
      </div>
    )
  }
}

class Message {
  constructor(msg){
    this.status = msg.status;
    this.body = msg.body;
  }

  get obj() {
    return {
      status: this.status,
      body: this.body,
    };
  }

  get json() {
    return JSON.stringify(this.obj);
  }
}