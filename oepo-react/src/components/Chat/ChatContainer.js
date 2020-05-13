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
    this.ref = React.createRef();
  }

  componentDidUpdate() {
    this.ref.current.scrollTop = this.ref.current.scrollHeight;
  }

  render() {
    return (
      <div className="chat-disp" ref={this.ref}>
        {this.props.msgQueue.map((item,i) => {
          const style = {
            color: item.status.id === '0721721' ? "darkcyan" : "black",
          }
          return (
            <p key={i} style={style}>
              <span className="status-txt">
                {item.status.name}
              </span>:
              <span className="msg-txt">
                {item.body}
              </span>
            </p>
          )
          })}
      </div>
    )
  }
}

export class ChatContainer extends React.Component{

  constructor(props){
    super(props);

    // websocketの準備
    let address = require('../../env.js').CHATWS()
    this.webSocket = new WebSocket(address);
    this.ref = React.createRef();

    this.state = {
      msgValue:"",
      msgQueue:[],
    }
  }

  componentDidMount() {
    document.addEventListener('keypress', e => this.handleKeyDown(e));
    this.webSocket.onmessage = (e => this.handleOnMessage(e));
  }

  componentWillUnmount() {
    document.removeEventListener('keypress', e => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    if(e.key === 'Enter') {
      console.log('handle key down enter');
      this.ref.current.focus();
    }
  }

  handleSubmit(msg){
    // メッセージ本文と送信主のステータスをサーバーに送信
    const json = JSON.stringify(msg);
    this.webSocket.send(json); // websocketに送信!
  }

  handleOnMessage(e){
    //メッセージ本文と送信主のステータスをサーバーから受け取り
    //メッセージキューに追加


    const json = e.data;
    const msg = JSON.parse(json);
    console.log(msg);

    var msgQueue = this.state.msgQueue.slice();
    msgQueue.push(msg);

    this.setState({
      msgQueue:msgQueue,
    });
  }

  render() {
    return (
      <div className="chat-container">

        <ChatDisplay msgQueue={this.state.msgQueue}/>
        <Grid container>
          <FormControl
            className="txt-field"
            variant="outlined"
            style={{width:`calc(${style.chatWidth} - 50px)`}}
            defaultValue=""
          >
            <Input
              inputRef={this.ref}
              style={{height:'50px'}}
              value={this.state.msgValue}
              onChange={e => this.setState({msgValue: e.target.value})}
              onKeyPress={e => {
                if (e.key == 'Enter' && this.state.msgValue != "") {
                  e.preventDefault();
                  this.handleSubmit({
                    status: this.props.user,
                    body:this.state.msgValue,
                  });
                  this.setState({
                    msgValue: "",
                  });
                }
              }}
              onFocus={e => console.log('on focus')}
            >
            </Input>
          </FormControl>
          <button
            className="submit-btn"
            style={{width:'50px'}} 
            onClick={ () => this.handleSubmit({
              status:this.props.user,
              body:this.state.msgValue,
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