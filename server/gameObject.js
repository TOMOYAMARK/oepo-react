
const roles = {
  IDLE:"idle",
  ANSWER:"answer",
  DRAW:"draw",
}

class Turn {
  constructor(playerRole,theme){
    this.playerRole = playerRole      //プレイヤーの役割 : dict {playerID:ROLE}
    this.theme = theme                //テーマ
    this.correctPlayer = undefined    //正解者
  }
}

class Game {

  //**ゲームモードに応じたオブジェクトを生成する静的関数
  static generateGame(playerIDs,connects,mode,wschat){
    //**モードに応じたターン回しを記述**//
  }

  constructor(playerIDs,connects,mode,wschat){
    this.wschat = wschat              //システムメッセージ用ws
    this.playerIDs = playerIDs
    this.connects = connects
    this.mode = mode //!!for now

    this.track = []                   //ターンの履歴→turnの配列
    this.waiting = []                 //準備ができているユーザ
    this.currentTurn = undefined      //現在のターン情報
    this.turnLength = 4               //!! for now
  }

  isAnswerer(pid){
    //渡されたidが回答者かどうか
    return this.currentTurn.playerRole[pid] === roles.ANSWER
  }

  answer(player,ans){
    //回答の照合
    let isCorrect = (ans === this.currentTurn.theme.name)        //!!ただし、省略記法などの判定も今後必要。これは簡略化
    if(isCorrect) this.currentTurn.correctPlayer = player
    return  isCorrect
  }

  startNextTurn(){
    //ユーザ全員の準備が完了次第、ターンオブジェクトの内容をbroadcastしてターンを開始する。
    if(this.track.length > 0) this.track.push(this.currentTurn)

    this.currentTurn = this.nextTurn
    let roleMap = this.currentTurn.playerRole

    //ターン情報をブロードキャスト
    const msg = {
      state:"begin-turn",
      turn:{
        num:this.track.length+1,          //何ターン目
        role:this.currentTurn.playerRole  //各プレイヤーの役割
      }
    }

    broadcast(this.connects,JSON.stringify(msg))

    //テーマを書き手にだけ伝えてみる。
    let connectWS =  Array.from(this.connects.keys())

    let drawerWS = connectWS.filter((ws)=>{
      //送信すべきwsオブジェクトがほしい
      console.log(JSON.stringify(this.connects.get(ws)))
      let userid = this.connects.get(ws).id
      if(roleMap[userid] === roles.DRAW) return true
      else return false
    })

    //書き手にのみテーマを送信
    drawerWS.forEach((ws) => {
      ws.send(JSON.stringify({theme:this.currentTurn.theme}))
      this.wschat.systemShout(`${this.connects.get(ws).name}さんが書き手です。`)
    })

  }

  generateNextTurn(theme){
    //ユーザの状態を生成し、ターンオブジェクトを作成する。
    this.nextTurn = new Turn(this.generateCombination(),theme)
  }

  generateCombination(){
    //ユーザのターンに置ける役割の組み合わせ生成。モードによって固有の役割があるので要オーバーライド
    //roleMap {userid:role(enum)}
    let roleMap = {}
    let count = 0

    //!! ホストの人を書き手にしてみる !!//
    for (let pid in this.playerIDs){
      roleMap[pid] = roles.ANSWER                 //!! for now
      if(count === 0) roleMap[pid] = roles.DRAW   //!! for now
      count++
    }
    return roleMap
  }
}

//wsマップを元にbroadcast
broadcast = function(connects,data) {
  connects.forEach((value,client,map) =>  {
      client.send(data);
  });
};



exports.Game = Game