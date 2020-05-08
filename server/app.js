var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  db.run("CREATE TABLE lorem (info TEXT)");

  var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (var i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
      console.log(row.id + ": " + row.info);
  });
});

db.close();

var http = require('http');
const themes = ["itigo", "meronn", "mikann", "kyuuri"];

let theme = "itigo";
let answer = null;
let isPlayingGame = true;

let getRandom = n => { return Math.floor(Math.random() * n); };
let updateTheme = () => theme = themes[getRandom(themes.length)];
//let updateAnswers = () => answer = users[getRandom(users.length)];

//--http--//(共存テスト用)
var server = http.createServer(function(request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end("{'res':'data'}");
})

server.listen(8080);
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

// socketオブジェクト : userオブジェクト のハッシュテーブルでソケットとユーザを紐付け 
var connects = new Map([]);

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

            wss.broadcast(JSON.stringify({ "name": "サーバー", "text": `${data.user.name} が入室しました。` }));
            //新しくJOINしてきたユーザには部屋に存在するユーザ全ての情報を投げる 
            connects.forEach((value,key,map) => {
                wsgame.broadcast(JSON.stringify({
                    "state": "player",
                    "data": value
                }))
            })
        } /*else if (data.state == "leave-room") {
            const pos = users.findIndex(user => user.id == data.user.id);
            users = users.splice(pos, 1);
        }*/ else if (data.state == "select-game-mode") {
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
        //退室しやユーザをブロードキャスト
        wsgame.broadcast(JSON.stringify({
            "state": "leave-room",
            "data": leavingUser,
        }))

      });
});
//-----------------//