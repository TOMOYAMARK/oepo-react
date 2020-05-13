

const debug = false                //true -> wsをすべてlocalhostに

const IPAddres = "34.85.36.109"
const localhost = "localhost"

const chatws = "3000"
const canvasws = "3001"
const gamews = "3002"


exports.CHATWS = () => {
    if(debug) return "ws://" + localhost + ":" + chatws
    else      return "ws://" + IPAddres + ":" + chatws
  }
exports.GAMEWS = () => {
    if(debug) return "ws://" + localhost + ":" + gamews
    else      return "ws://" + IPAddres + ":" + gamews 
  }
exports.CANVASWS = () => {
  if(debug) return "ws://" + localhost + ":" + canvasws
  else      return "ws://" + IPAddres + ":" + canvasws 
}
