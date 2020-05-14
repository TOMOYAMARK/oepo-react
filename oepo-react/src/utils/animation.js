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


export const Correct = "img/Correct.svg"

//正解アニメーション
export function CorrectAnimation(trigger) { 
  return (
    <Grow
    in={trigger}
    style={{ transformOrigin: '50% 50% 0' }}
    {...(trigger ? { timeout: 100 } : {})}
    >
    <img style={{
      zIndex:20,
      position:"absolute",
      top:0,
      left:0,
      right:0,
      bottom:0,
      margin:"auto",
      }} src={Correct} width={`${style.canvasWidth}`} height={`${style.canvasHeight}`} />
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

//リザルトウィンドウを表示する
export function ShowResult(trigger,onClickClose,historyPayload) {

  console.log(historyPayload)

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
    <p>{Object.values(drawer)}</p>
    )
  }

  const turnComponents = turns.map(turn => 
    <div style={{float:"left"}}>
    <Card style={{height:"150px",width:"200px",margin:"10px 50px"}}>
      <CardContent >
        <Typography gutterBottom>
          お題:{turn.theme.name}
        </Typography>
        書き手:{renderDrawer(turn.playerRole)}

      </CardContent>
      <CardActions>
        <Button size="small" >拍手を送る</Button>
      </CardActions>
    </Card> 
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
      <Card style={{height:"450px",width:"650px"}}>
        <CardContent>
          <Typography gutterBottom>
            結果発表
          </Typography>

          <div style={{
            width:"620px",height:"350px",position:"relative"
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