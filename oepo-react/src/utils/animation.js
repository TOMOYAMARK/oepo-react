//
//途中で出現したり隠れるUIを描画する関数をここにまとめます
//
import React from 'react'
import style from  '../components/_variables.scss'
import '../components/Canvas/Canvas.scss'
import Grow from '@material-ui/core/Grow';
import { Chip } from '@material-ui/core';
import { Zoom } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import './animation.scss'

export const Correct = "img/Correct.svg"

//正解アニメーション
export function CorrectAnimation(trigger,params) { 
  return (
    <Grow
    in={trigger}
    style={{ transformOrigin: '50% 50% 0' }}
    {...(trigger ? { timeout: 100 } : {})}
    >
      <div style={{
       zIndex:20,
       position:"absolute",
       top:0,
       left:0,
       right:0,
       bottom:0,
       margin:"auto", 
       width:`${style.canvasWidth}`,
       height:`${style.canvasHeight}`,
      }}>
        <img style={{
          position:"absolute",
          top:0,
          left:0,
          right:0,
          bottom:0,
          margin:"auto",
          }} src={Correct} width={`${style.canvasWidth}`} height={`${style.canvasHeight}`} />
          <div className="answer-txt">
            {`答え:${params.answer} (回答者:${params.answerer})`}
          </div>
      </div>
    </Grow>
  )
}

//テーマ表示
export function ShowTheme(trigger,theme) {
  return (
  <Zoom in={trigger}>
    <div style={{padding:"10px"}}>
      <Chip variant='outlined' color='secondary' label={theme} />
    </div>
  </Zoom>
  )
}

//リザルト用のお絵かき画像表示
class ImageFrame extends React.Component {

  constructor(props){
    super(props)

    this.canvas = React.createRef()

    this.state={
      image:{},
    }
  }


  componentDidMount() {

    if(this.props.image!== undefined){
    
    const canvasInvisible=document.createElement('canvas');
    canvasInvisible.width=this.props.image.width;
    canvasInvisible.height=this.props.image.height

    const scaleVal = this.props.width/this.props.image.width
    const v_context = canvasInvisible.getContext('2d');
    v_context.putImageData(this.props.image, 0, 0);
    const context = this.canvas.current.getContext('2d');
    context.scale(scaleVal, scaleVal);
    context.drawImage(canvasInvisible, 0, 0);
    }else {
      this.canvas.current.width = this.props.width
      this.canvas.current.height = this.props.height
      const context = this.canvas.current.getContext('2d');
      context.rect(0,0,this.props.width,this.props.height);
      context.stroke();
    }
  }
  render() {
    return <canvas ref={this.canvas} />
  }
}

//リザルトウィンドウを表示する
export function ShowResult(trigger,onClickClose,historyPayload,images) {

  const turns = historyPayload.turns
  const idMap = historyPayload.idMap

  const renderDrawer = function(roles){
    const drawerID = Object.keys(roles).filter((id) => {
      return roles[id] === 'draw'
    })

    const drawer = drawerID.map(id => {
      return idMap[id].name
    })

    return (
    <span>{Object.values(drawer)}</span>
    )
  }

  const turnComponents = turns.map((turn,i) => 
    <div style={{float:"left"}}>
      <p style={{fontSize:"10px",marginBottom:"-2px"}}>
        お題:{turn.theme.name}
        <span style={{marginLeft:"10px"}}>書き手:{renderDrawer(turn.playerRole)}</span>
      </p>
    <div style={{height:"170px",width:"200px",margin:"5px 65px"}}>

        <ImageFrame width={200} height={167} image={images[i]}/>
    </div> 
    </div>
  )
  return (
  <Zoom in={trigger}>
    <div style={{
        width:"650px",
        height:"450px",
        position:"absolute",
        top:0,
        bottom:0,
        left:0,
        right:0,
        margin : "auto",
    }}>
      <Card style={{height:"500px",width:"700px"}}>
        <CardContent>
          <Typography gutterBottom>
            結果発表
          </Typography>

          <div style={{
            width:"700px",height:"350px",position:"relative"
            }}>
              {turnComponents}
          </div>

        </CardContent>
        <CardActions style={{clear:"left"}}>
          <Button size="small" onClick={() => onClickClose()}>閉じる</Button>
        </CardActions>
      </Card>
      
    </div>
  </Zoom>
  )
}


// //React Componentとして
// export const Correct = () =>{
//   return <img style={{
//     zIndex:20,
//     position:"absolute",
//     top:0,
//     left:0,
//     right:0,
//     bottom:0,
//     margin:"auto",
//   }} src={correct} width={`${styleVar.canvasWidth}`} height={`${styleVar.canvasHeight}`} />
// }