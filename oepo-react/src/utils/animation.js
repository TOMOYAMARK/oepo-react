import React from 'react'
import style from  '../components/_variables.scss'
import Grow from '@material-ui/core/Grow';
import { Chip } from '@material-ui/core';
import { Zoom } from '@material-ui/core';


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