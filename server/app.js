
const GameObject = require('./gameObject.js')
const roomStates = {
  IDLE:"idle",              //ゲーム開始待機状態
  GAME:"game",              //ゲーム中
  DURATION:"duration",      //アニメーションの待ち時間とか。端的に言ってGAME中の無意味な時間。
}

//SQLiteをインポート。所定のディレクトリにdbファイルをつくる。
const sqlite3 = require('sqlite3').verbose();
const dbname = './database/app.db'
//!!sqlite標準の関数群が非同期処理(コールバック)なのでPromise化した関数でラッピングしたもの（動作未確認）!!//
/*function get(sql, params) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			resolve(row);
		});
	});
}

function run(sql, params) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, (err) => {
			if (err) reject(err);
			resolve();
		});
	});
}
*/

//テーマをランダムに返す(promise) awaitしてね⭐︎
function fetchOekakiTheme(){
  return new Promise ((resolve,reject) => {
    var db = new sqlite3.Database(dbname);
    var data = {}

    //データベースからランダムなお題を持ってきて返す。
    db.serialize(function() {  
      db.get("SELECT name,labels_json FROM oekaki_theme ORDER BY RANDOM() LIMIT 1", function(err, row) {
        if(err){
          //**エラーレスポンス**/
          reject(err)
        }
        data = row
        var now = new Date();
        console.log(now.toLocaleString() + "[THEME]" + JSON.stringify(data))
      });
    });
    db.close(() => {
      //成功のコールバック
      resolve(data) 
    });  
  })
}

//expressオブジェクトの生成とCORS設定
const express = require("express");
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// CORSを許可する
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//httpリクエストをポート8080で待ち受け
app.post('/api/user/login', (req,res) => {
  const crypto = require('crypto')
  var hash = req.body.passhash
  var username = req.body.username
  var db = new sqlite3.Database(dbname);
  
  //dbから該当ユーザID取得（ユーザ名はunique）
  db.serialize(function() {
    var stmt = db.prepare("SELECT id,hashkey FROM users WHERE name = ?")
    stmt.get(username, function(err,row) {
      if (err){
        console.log("err")
      }
      //ユーザ名が存在しない
      if(row === undefined) {
        res.json({msg:"missing-username"})
        stmt.finalize()
        return
      }
      //取得したユーザIDをsaltとして検証
      var ans = row.hashkey
      var id = row.id

      if(crypto.createHash('sha256').update(hash + id,'utf8').digest('hex') === ans){
        //認証成功 ユーザ情報を返す
        res.json({msg:"success",user:{
          id:id,
          name:username,
        }})
      }else{
        //認証失敗
        res.json({msg:"failed"})
      }
      stmt.finalize()
    })

  })
  db.close()

})

app.post('/api/fetch/theme', async function(req, res) {
  res.json({theme:await fetchOekakiTheme()})
})

var server = app.listen(8080, function(){
  console.log("Node.js is listening to PORT:" + server.address().port);
});

app.post('/game/change/state',(req,res) => {
  
})
//ここまでhttpレスポンス処理//

// socketオブジェクト : userオブジェクト のハッシュテーブルでソケットとユーザを紐付け 
var connects = new Map([])
// {userID(サーバ内で生成→userオブジェクトに注入):wsオブジェクト}でユーザのHTTPリクエストを判別
var userIDMap = {}
//{userID : ユーザの状態}
var userStates = {}
//部屋の状態
var roomState = roomStates.IDLE

const states = {
  //ゲーム内のユーザの状態enum
  IDLE:0,
  READY:1,
  DRAW:2,
  ANSWER:3,
}

//--------//

var ws = require('ws').Server;

//---websocket chat---//
var wschat = new ws({ port: 3000 });

wschat.broadcast = function(data) {
    wschat.clients.forEach(function(client) {
        client.send(data);
    });
    console.log(now() + "[send]: => " + data);
};

wschat.systemShout = function(msg){
  var data = JSON.stringify({ "status":{
    name:"サーバー"
  }, "body": msg }) 
  wschat.broadcast(data)
}

wschat.on('connection', function(ws) {
    ws.on('message', async function(message) {
        var now = new Date();
        console.log(now.toLocaleString() + ' Received: %s', message);
        wschat.broadcast(message);

        //ゲーム中でとみなす回答者のチャットは回答とみなす
        if(roomState === roomStates.GAME){
          let data = JSON.parse(message)
          let user = data.status

          if(game.isAnswerer(user.id)){
            //回答者であれば、チャット本文を回答
            if(game.answer(user,data.body)){
              //正解。この直後回答は受け付けません.
              roomState = roomStates.DURATION
              //次ターンの (!!もしまだ続くのなら!!)
              game.generateNextTurn(await fetchOekakiTheme())
              wschat.systemShout(`${user.name}が正解しました! (答え:${data.body})`)
              wsgame.broadcast(JSON.stringify({
                "state":"user-answered",
                "params":{
                  "user_id":user.id
                }
              }))
              // // 画像を保存したりキャンバスを消去したりするイベントを発生
              wscanvas.broadcast(JSON.stringify({
                "state":"turn-end",
              }))

            }
          }
        }
    });
});
//-----------------//

//---websocket canvas---//
var wscanvas = new ws({ port: 3001 });

wscanvas.broadcast = function(data) {
    wscanvas.clients.forEach(function(client) {
        client.send(data);
    });
};

wscanvas.on('connection', function(ws) {
    ws.on('message', function(message) {
        var now = new Date();
        console.log(now.toLocaleString() + ' Received: %s', JSON.stringify(message));
        wscanvas.broadcast(message);
    });

    // 接続が切れた場合
    ws.on('close', () => {
        console.log('I lost a client');
    });

    ws.on('error', (event) => {
        console.log(event);
    });
});
//-----------------//

//---websocket game---//
var wsgame = new ws({ port: 3002 });

wsgame.broadcast = function(data) {
    connects.forEach((value,client,map) =>  {
        client.send(data);
    });
};

//現在時刻を返す
now = function(){
  return new Date().toLocaleString()
}

//** 部屋の状態をlogする関数 **//
logRoomState = function(){
  console.log(now() + "[ROOM]:" + JSON.stringify(userStates))
}
//****//



//ゲームオブジェクト.ゲームの進行状態を管理
let game = undefined

wsgame.on('connection', function(ws) {
  connects.set(ws,undefined); // userMapにキーのみ装填 (user情報はまだ送信されていない。)
    ws.on('message', async function(message) {
        let data = JSON.parse(message);
        let now = new Date();

        console.log(now.toLocaleString() + '[Received]: %s', JSON.stringify(message));

        if (data.state == "join-room") {
            //用意していた辞書にuser情報を付与
            connects.set(ws,data.user)
            userIDMap[data.user.id] = data.user
            userStates[data.user.id] = states.IDLE
            logRoomState()

            wschat.systemShout(`${data.user.name} が入室しました。` )
            //新しくJOINしてきたユーザには部屋に存在するユーザ全ての情報を投げる 
            connects.forEach((value,key,map) => {
                wsgame.broadcast(JSON.stringify({
                    "state": "player",
                    "data": value
                }))
                wscanvas.broadcast(JSON.stringify({
                    state: "join",
                    data: value,
                }));
            })
        }
        else if(data.state == "game-ready"){
          //ユーザの (!!もしまだ続くのなら!!)完了
          userStates[data.user_id] = states.READY
          logRoomState()
          wsgame.broadcast(JSON.stringify({
            state:"game-ready",
            user_id:data.user_id
          }))
          //全員そろったらゲーム開始
          if(Object.values(userStates).filter((state) => {
            return state === states.READY
          }).length === Object.values(userStates).length){
            //userStatesをすべてゲーム中に//
            Object.keys(userStates).forEach(id => {
              userStates[id] = states.GAME
            }) 

            wsgame.broadcast(JSON.stringify({
              state:"game-start",
            }))
            wschat.systemShout("ゲームが開始しました。")
            roomState = roomStates.GAME

            //ゲームの準備　ゲームオブジェクトの生成など
            game = new GameObject.Game(userIDMap,connects,"test",wschat)
            game.generateNextTurn(await fetchOekakiTheme())
            game.next()//!!genだけにとどめて、次のユーザーの準備を待つのも可（voteで）!!//
            logRoomState()
            //!!もしくはgen + nextのstartGame関数を用意する
          }
        }
        else if(data.state == "req-next"){
          let pid = data.user_id
          if(game.vote(pid)){
            //全員揃ったら次のターン/ゲーム終了
            if(!game.next()){
              //次がなかったらゲーム終了
              game.terminate()
              Object.keys(userStates).forEach(id => {
                userStates[id] = states.IDLE
              }) 
              logRoomState()
            }else{
              //次のターン開始
              roomState = roomStates.GAME
              logRoomState()
            }
          }
        }
        else if (data.state == "select-game-mode") {
            let sendData = JSON.stringify({ "state": "game-data", "data": data.data });
            let gameMode = "";
            if (data.data.gameMode == "egokoro") gameMode = "エゴコロクイズ";

            wschat.broadcast(JSON.stringify({ "name": "サーバー", "text": `ゲームモードが ${gameMode} に変更されました。` }));
        }
    });

      // 接続が切れた場合
      ws.on('close', () => {
        //対応したwsをkeyにもつユーザ情報を削除
        var leavingUser = connects.get(ws)
        connects.delete(ws)
        delete userIDMap[leavingUser.id]
        delete userStates[leavingUser.id]
        logRoomState()
        //退室しやユーザをブロードキャスト
        wsgame.broadcast(JSON.stringify({
            "state": "leave-room",
            "data": leavingUser,
        }))

      });
});
//-----------------//

