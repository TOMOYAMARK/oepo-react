
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

app.post('/api/fetch/theme', function(req, res) {
  var db = new sqlite3.Database(dbname);
  var data = {}

  //データベースからランダムなお題を持ってきて返す。
  db.serialize(function() {  
    db.get("SELECT name FROM oekaki_theme ORDER BY RANDOM() LIMIT 1", function(err, row) {
      if(err){
        //**エラーレスポンス**/
      }
      data = row
      console.log("[THEME] responding:" + JSON.stringify(data))
      res.json(data);
    });
  });
  db.close();
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

const states = {
  //ゲーム内のユーザの状態enum
  IDLE:0,
  READY:1,
  DRAW:2,
  ANSWER:3,
}

// const themes = ["itigo", "meronn", "mikann", "kyuuri"];

// let theme = "itigo";
// let answer = null;
// let isPlayingGame = true;

// let getRandom = n => { return Math.floor(Math.random() * n); };
// let updateTheme = () => theme = themes[getRandom(themes.length)];
//let updateAnswers = () => answer = users[getRandom(users.length)];

//--------//

var ws = require('ws').Server;

//---websocket chat---//
var wss = new ws({ port: 3000 });

wss.broadcast = function(data) {
    wss.clients.forEach(function(client) {
        client.send(data);
    });
    console.log("send => " + data);
};

wss.systemShout = function(msg){
  var data = JSON.stringify({ "status": "サーバー", "body": msg }) 
  wss.broadcast(data)
}

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        var now = new Date();
        console.log(now.toLocaleString() + ' Received: %s', message);
        wss.broadcast(message);

        // ゲーム実行時の処理
        // const data = JSON.parse(message);
        // if (isPlayingGame) {
        //     // 答えが合っているかどうか
        //     if (data.text == theme) {
        //         wss.broadcast(JSON.stringify({ "name": "サーバー", "text": `${data.name} が正解しました。` }));
        //         wss.broadcast(JSON.stringify({ "name": "答え", "text": `${theme}` }));

        //         // 回答者とお題の更新
        //         updateAnswers();
        //         updateTheme();

        //         // 回答者の交代とお題の送信
        //         console.log(answer);
        //         console.log(users);
        //         const gameStateStr = JSON.stringify({ "theme": theme, "answer": answer });
        //         const json = JSON.stringify({ state: "game-data", data: gameStateStr });
        //         console.log(json);
        //         wsgame.broadcast(json);
        //     }
        // }
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
    console.log("reached-connection wscanvas")
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


wsgame.on('connection', function(ws) {
  connects.set(ws,undefined); // userMapにキーのみ装填 (user情報はまだ送信されていない。)
    ws.on('message', function(message) {
        let data = JSON.parse(message);
        let now = new Date();

        console.log(now.toLocaleString() + ' Received: %s', JSON.stringify(message));

        if (data.state == "join-room") {
            //用意していた辞書にuser情報を付与
            connects.set(ws,data.user);
            userIDMap[data.user.id] = data.user;
            userStates[data.user.id] = states.IDLE
            console.log("room:" + JSON.stringify(userIDMap))

            wss.systemShout(`${data.user.name} が入室しました。` )
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
          //ユーザの準備完了
          userStates[data.user_id] = states.READY
          wsgame.broadcast(JSON.stringify({
            state:"game-ready",
            user_id:data.user_id
          }))
          //全員そろったらゲーム開始
          if(Object.values(userStates).filter((state) => {
            return state === states.READY
          }).length === Object.values(userStates).length){
            wsgame.broadcast(JSON.stringify({
              state:"game-start",
            }))
          }
        }
        else if (data.state == "select-game-mode") {
            let sendData = JSON.stringify({ "state": "game-data", "data": data.data });
            let gameMode = "";
            if (data.data.gameMode == "egokoro") gameMode = "エゴコロクイズ";

            wss.broadcast(JSON.stringify({ "name": "サーバー", "text": `ゲームモードが ${gameMode} に変更されました。` }));
        }
    });

      // 接続が切れた場合
      ws.on('close', () => {
        //対応したwsをkeyにもつユーザ情報を削除
        var leavingUser = connects.get(ws)
        connects.delete(ws)
        delete userIDMap[leavingUser.id]
        delete userStates[leavingUser.id]
        console.log("room:" + JSON.stringify(userIDMap))
        //退室しやユーザをブロードキャスト
        wsgame.broadcast(JSON.stringify({
            "state": "leave-room",
            "data": leavingUser,
        }))

      });
});
//-----------------//