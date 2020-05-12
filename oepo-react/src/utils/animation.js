import React from 'react'
import style from  '../components/_variables.scss'
import Grow from '@material-ui/core/Grow';

export const Correct = "img/Correct.svg"


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