import React from 'react';
import './Canvas.scss';
import axios from '../../utils/API';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    // 送信用のdraw処理
    this.mainCvRef = React.createRef();
    this.onMouseMove = () => {};
    this.onMouseUp = () => {};

    this.state = {
      layers: [
        {isDrawing: false, ref: React.createRef()},
        {isDrawing: false, ref: React.createRef()},
        {isDrawing: false, ref: React.createRef()},
        {isDrawing: false, ref: React.createRef()},
        {isDrawing: false, ref: React.createRef()},
        {isDrawing: false, ref: React.createRef()},
      ],
      users: [],
      imageQueue: [],
      strokeQueue: [],
      imageStack: [],
      containerRef: React.createRef(),
      midLayerRef: React.createRef(),
      baseLayerRef: React.createRef(),
      onPointer: false,
      pointerPos: {x: 0, y:0,},
    }
  }

  backable(queue) {
    return queue.filter(obj => obj.id === this.props.mainUsrId && !obj.hidden).length > 0;
  }

  forwardable(queue) {
    return queue.filter(obj => obj.id === this.props.mainUsrId && obj.hidden).length > 0; 
  }

  async componentDidMount() {
    console.log('component did mount');
    // 部屋の状態と描画状態を同期する
    let canvasData;
    await axios.post("/api/canvas/join")
      .then(res => {
        console.log(res.data);
        canvasData = {
          base64Img: res.data.base64Img,
          strokes: res.data.strokes,
          users: res.data.users,
        }
      })
      .catch(() => console.log("エラー"));

    // 既存のユーザーのデータを登録
    canvasData.users.map(id => {
      const usrAct = {
        state: "join",
        id: id,
      };
      this.handleJoin(usrAct);
    });

    // baseの描画
    const ctx = this.state.baseLayerRef.current.getContext('2d');
    var img = new Image();
    img.src = canvasData.base64Img;
    img.onload = function(){
      ctx.drawImage(img, 0, 0, 600, 500);
    }

    // ソケット
    const address = require('../../env.js').CANVASWS();
    this.webSocket = new WebSocket(address);
    this.webSocket.onmessage = (e => this.handleMessage(e));
    this.webSocket.onopen = (e => this.handleOpen(e));

    // midの再描画
    this.clearCanvas(this.state.midLayerRef, 600, 500);
    canvasData.strokes.map(stroke => {
      if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);
      return stroke;
    });

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(canvasData.strokes));
    this.props.onChangeForwardable(this.forwardable(canvasData.strokes));

    this.setState({
      strokeQueue: canvasData.strokes,
    });
  }

  componentDidUpdate() {
    // console.log('component did update');
    // console.log(this.props.palette.buttonState);
    if(this.props.palette.buttonState === "reset"){
      this.handleResetButton();
      this.props.onResetInCv();
    }

    if(this.props.palette.buttonState === "back"){
      this.handleBackButton();
      this.props.onResetInCv();
    }

    if(this.props.palette.buttonState === "forward"){
      this.handleForwardButton();
      this.props.onResetInCv();
    }
  }

  drawing(ref, stroke){
    this.setContextPreference(ref, stroke);
    this.drawingWithoutSetting(ref, stroke);
  }

  drawingWithoutSetting(ref, stroke){
    const ctx = ref.current.getContext('2d');
    if(stroke.base64Img){
      var img = new Image();
      img.src = stroke.base64Img;
      img.onload = function(){
        ctx.drawImage(img, 0, 0, 600, 500);
      }
    }else{
      ctx.stroke(stroke.path);
    }
  }

  setContextPreference(ref, stroke){
    const ctx = ref.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = stroke.palette.weight;
    ctx.strokeStyle = stroke.palette.state === "erase" ? "white" : stroke.palette.color;
    ctx.globalAlpha = stroke.palette.opacity;
  }

  clearCanvas(ref, width, height) {
    const ctx = ref.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
  }

  resetCanvas() {
    this.clearCanvas(this.state.midLayerRef, 600, 500);
    this.clearCanvas(this.state.baseLayerRef, 600, 500);
    this.state.layers.map(layer => this.clearCanvas(layer.ref, 600, 500));
  }

  handlePointerEnter() {
    this.setState({
      onPointer: true,
    });
  }

  handlePointerLeave() {
    this.setState({
      onPointer: false,
    });
  }

  handlePointerMove(e) {
    this.setState({
      onPointer: this.state.onPointer ? this.state.onPointer : true,
      pointerPos: {x: e.clientX, y:e.clientY,}
    });
  }

  handleOpen(e) {
    console.log('handle open');

    this.webSocket.send(JSON.stringify({state: "join", id: this.props.mainUsrId}));
  }

  handleMessage(e) {
    const usrAct = JSON.parse(e.data);
    console.log(usrAct);
    // ユーザーが 参加した とき
    if(usrAct.state === "join") this.handleJoin(usrAct);
    // ユーザーが 退室した とき
    if(usrAct.state === "leave") this.handleLeave(usrAct);
    // ペンが 置かれた とき
    if(usrAct.state === "down") this.handleDown(usrAct);
    // ペンが 移動した とき
    if(usrAct.state === "move") this.handleMove(usrAct);
    // ペンが 離された とき
    if(usrAct.state === "up") this.handleUp(usrAct);
    // ユーザーが 戻るボタンを押した とき
    if(usrAct.state === "back") this.handleBack(usrAct);
    // ユーザーが 進むボタンを押した とき
    if(usrAct.state === "forward") this.handleForward(usrAct);
    // ユーザーが 全消しボタンを押した とき
    if(usrAct.state === 'reset') this.handleReset(usrAct);
    // ターンが終了したとき
    if(usrAct.state === 'turn-end') this.handleTurnEnd(usrAct);
  }

  handleJoin(usrAct) {
    console.log('handle join');

    // usersにユーザーが存在する場合
    if(this.state.users.some(user => user.id === usrAct.id)) return;

    // usersの追加
    const user = {id: usrAct.id, layer: null, stroke: null, position: null};
    const users =  [...this.state.users, user];

    this.setState({
      users: users,
    });
  }

  handleLeave(usrAct) {
    console.log('handle leave');

    // usersの削除
    const users = this.state.users.filter(user => user.id !== usrAct.id);

    this.setState({
      users: users,
    });
  }
  
  handleDown(usrAct) {
    console.log('handle down');

    // false の layer を取得
    const layerFalse = this.state.layers.find(layer => !layer.isDrawing);

    // 新しい stroke を定義
    const stroke = {id: usrAct.id, path: new Path2D(), palette: usrAct.palette, hidden: false};

    // refにストロークの情報をセット
    this.setContextPreference(layerFalse.ref, stroke);

    // ストロークにbase64Imgがあったら描画する
    if(usrAct.base64Img){
      const base64Stroke = {...stroke, base64Img: usrAct.base64Img};
      this.drawing(layerFalse.ref, base64Stroke);
    }

    // 新しい layer と user の状態を定義
    const layerNew = {isDrawing: true, ref: layerFalse.ref};
    const userNew = {id: usrAct.id, layer: layerNew, stroke: stroke, position: usrAct.position};

    // 更新した layers と users と hidden を消去した strokeQueue 
    const strokeQueue = this.state.strokeQueue.filter(stroke => 
      stroke.id !== usrAct.id || (stroke.id === usrAct.id && !stroke.hidden));
    const layers = this.state.layers.map(layer => layer.id === usrAct.id ? layerNew : layer);
    const users = this.state.users.map(user => user.id === usrAct.id ? userNew : user);

    this.setState({
      strokeQueue: strokeQueue,
      layers: layers,
      users: users,
    });
  }

  handleMove(usrAct) {
    console.log('handle move');

    // ユーザーを取得 => ストローク中のlayer.ref, position, とstroke.pathだけは変更あり
    let user = this.state.users.find(user => user.id === usrAct.id);

    // ユーザーのストロークに線分を追加
    if(!user.stroke){
      // 新しい stroke を定義
      const stroke = this.strokeQueue.find(stroke => !stroke.lastAct && stroke.id === user.id);

      user = {
        id: user.id,
        layer: this.state.layers.find(layer => !layer.isDrawing),
        stroke: {id: usrAct.id, path: new Path2D(), palette: usrAct.palette, hidden: false},
        position: stroke.lastAct.position,
      }
    }

    user.stroke.path.moveTo(user.position.x, user.position.y);
    user.stroke.path.lineTo(usrAct.position.x, usrAct.position.y);

    // user の ref へ描画
    this.clearCanvas(user.layer.ref, 600, 500);
    this.drawingWithoutSetting(user.layer.ref, user.stroke);

    // 新しいuserの状態を定義
    const newUser = {id: usrAct.id, layer: user.layer, stroke: user.stroke, position: usrAct.position};

    // users の更新
    const users = this.state.users.map(user => user.id === usrAct.id ? newUser : user);

    this.setState({
      users: users,
    })
  }

  handleUp(usrAct) {
    console.log('handle up');

    // ユーザーを取得
    let user = this.state.users.find(user => user.id === usrAct.id);

    // ユーザーのストロークに線分を追加
    if(!user.stroke){
      // 新しい stroke を定義
      const stroke = this.strokeQueue.find(stroke => !stroke.lastAct && stroke.id === user.id);

      user = {
        id: user.id,
        layer: this.state.layers.find(layer => !layer.isDrawing),
        stroke: {id: usrAct.id, path: new Path2D(), palette: usrAct.palette, hidden: false},
        position: stroke.lastAct.position,
      }
    }

    // ユーザーのストロークに線分を追加
    user.stroke.path.moveTo(user.position.x, user.position.y);
    user.stroke.path.lineTo(usrAct.position.x, usrAct.position.y);

    // ドローする
    this.clearCanvas(user.layer.ref);
    this.drawingWithoutSetting(user.layer.ref, user.stroke);

    // userのlayerのcontextを初期化する
    this.clearCanvas(user.layer.ref, 600, 500);

    // キューに追加
    let strokeQueue = [...this.state.strokeQueue, user.stroke];

    // strokeQueue の処理
    if(strokeQueue.length <= 5){
      // midCtxに描画
      strokeQueue.map(stroke => {
        if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);
        return stroke;
      });
    }else{
      // baseの描画
      if(!strokeQueue[0].hidden) this.drawing(this.state.baseLayerRef, strokeQueue[0]);
      // midの再描画
      this.clearCanvas(this.state.midLayerRef, 600, 500);
      const newStrokeQueue = strokeQueue.filter(stroke => stroke !== strokeQueue[0]);
      newStrokeQueue.map(stroke => {
        if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);
        return stroke;
      });
      // strokeQueue の更新
      strokeQueue = newStrokeQueue;
    }

    // 新しい layer と user の状態を定義
    const newLayer = {isDrawing: false, ref: user.layer.ref};
    const newUser = {id: usrAct.id, layer: null, stroke: null, position: usrAct.position};

    // layers と users の更新 (layer.isDrawing=false, user.layer=null)
    const layers = this.state.layers.map(layer => layer === user.layer ? newLayer : layer);
    const users = this.state.users.map(user => user.id === usrAct.id ? newUser : user);

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(strokeQueue));
    this.props.onChangeForwardable(this.forwardable(strokeQueue));

    this.setState({
      strokeQueue: strokeQueue,
      layers: layers,
      users: users,
    })
  }

  handleBack(usrAct) {
    console.log('handle back');

    // デバッグ用
    if(this.state.strokeQueue.filter(strk => strk.id === usrAct.id && !strk.hidden).length === 0){
      console.log('debug');
      return;
    }

    // 条件を満たす imageQueue の最大の番号を取得
    let idx;
    for(let i=0; i<this.state.strokeQueue.length; i++)
      if(this.state.strokeQueue[i].id === usrAct.id && !this.state.strokeQueue[i].hidden)
        idx = i;

    // 状態を変更
    const strokeNew = {...this.state.strokeQueue[idx], hidden: true};
    const strokeQueue = this.state.strokeQueue.map(stroke =>
      stroke === this.state.strokeQueue[idx] ? strokeNew : stroke);

    // midの再描画
    this.clearCanvas(this.state.midLayerRef, 600, 500);
    strokeQueue.map(stroke => {
      if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);
      return stroke;
    });

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(strokeQueue));
    this.props.onChangeForwardable(this.forwardable(strokeQueue));

    this.setState({
      strokeQueue: strokeQueue,
    })
  }

  handleForward(usrAct) {
    console.log('handle forward');

    if(this.state.strokeQueue.filter(stroke => stroke.id === usrAct.id && stroke.hidden).length === 0){
      console.log('debug');
      return;
    }
    
    // imageQueueの要素を更新する
    let idx;
    for(let i=this.state.strokeQueue.length-1; i>=0; i--)
      if(this.state.strokeQueue[i].id === usrAct.id && this.state.strokeQueue[i].hidden) idx = i;

    const strokeNew = {...this.state.strokeQueue[idx], hidden: false};
    const strokeQueue = this.state.strokeQueue.map(stroke =>
      stroke === this.state.strokeQueue[idx] ? strokeNew : stroke);

    // midの再描画
    this.clearCanvas(this.state.midLayerRef, 600, 500);
    strokeQueue.map(stroke => {
      if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);
      return stroke;
    });

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(strokeQueue));
    this.props.onChangeForwardable(this.forwardable(strokeQueue));

    this.setState({
      strokeQueue: strokeQueue,
    });
  }

  handleReset() {
    console.log('handle reset');

    // キャンバスの状態を全てリセットする
    this.resetCanvas();

    // キューを消去する
    const strokeQueue = [];

    // マウス動いてる途中で全消しした場合
    this.onMouseMove = () => {};
    this.onMouseUp = () => {};

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(strokeQueue));
    this.props.onChangeForwardable(this.forwardable(strokeQueue));

    // リレンダー
    this.props.onResetInCv();

    this.setState({
      strokeQueue: strokeQueue,
    })
  }

  handleTurnEnd() {
    console.log('handle turn end');

    // ctx の取得
    const baseCtx = this.state.baseLayerRef.current.getContext('2d');

    /// キャンバスの画像を取得する ///
    // imgQueueをベースに描画する
    this.state.strokeQueue.map(stroke => {
      if(!stroke.hidden) this.drawing(this.state.baseLayerRef, stroke);
      return stroke;
    });

    // 描画中のレイヤーをベースに描画する
    this.state.layers.map(layer => baseCtx.drawImage(this.state.containerRef.current, 0, 0));

    // 画像を保存する
    const baseImage = baseCtx.getImageData(0, 0, 600, 500);
    this.props.onTurnEnd(baseImage);

    // キャンバスをリセットする
    this.resetCanvas();

    // キューを消去する
    const strokeQueue = [];

    // 戻る・進むボタンの処理
    this.props.onChangeBackable(this.backable(strokeQueue));
    this.props.onChangeForwardable(this.forwardable(strokeQueue));

    this.setState({
      strokeQueue: strokeQueue,
    });
  }

  // 自分の描画操作をサーバーに送信する
  handleMouseDown(e) {
    // console.log('handle mosue down');

    const json = {
      id: this.props.mainUsrId,
      state: "down",
      position: {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      palette: this.props.palette,
    }

    this.onMouseMove = this.handleMouseMove;
    this.onMouseUp = this.handleMouseUp;

    // console.log(json);
    this.webSocket.send(JSON.stringify(json));
  }

  handleMouseMove(e) {
    // console.log('handle mouse move');

    const json = {
      id: this.props.mainUsrId,
      state: "move",
      position: {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      palette: this.props.palette,
    }

    // console.log(json);
    this.webSocket.send(JSON.stringify(json));
  }

  handleMouseUp(e) {
    // console.log('handle mouse up');
    
    const json = {
      id: this.props.mainUsrId,
      state: "up",
      position: {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      palette: this.props.palette,
    }
    // console.log(json);

    this.onMouseMove = () => {};
    this.onMouseUp = () => {};

    this.webSocket.send(JSON.stringify(json));
  }

  handleBackButton() {
    console.log('handle back');

    const json = {
      id: this.props.mainUsrId,
      state: "back",
    };
    this.webSocket.send(JSON.stringify(json));
  }

  handleForwardButton() {
    console.log('handle forward');

    const json = {
      id: this.props.mainUsrId,
      state: "forward",
    };
    this.webSocket.send(JSON.stringify(json));
  }

  handleResetButton() {
    console.log('handle reset');

    const json = {
      id: this.props.mainUsrId,
      state: "reset",
    };
    this.webSocket.send(JSON.stringify(json));
  }

  render() {
    const ref = this.mainCvRef.current;
    const rect = ref ? ref.getBoundingClientRect() : null;
    const pos = {
      x: this.state.pointerPos.x - (ref ? rect.left : 0),
      y: this.state.pointerPos.y - (ref ? rect.top : 0),
    };
    const layers = this.state.layers.map((layer, idx) => {
      return (
        <canvas
          ref={layer.ref}
          key={idx}
          style={{position: 'absolute', top: 0, left: 0, zIndex: idx+2}}
          width="600px"
          height="500px"
        />
      )
    });

    return(
      <div className='canvas'>
        <canvas
          width='600px'
          height='500px'
          style={{position: 'absolute', top: 0, left: 0, zIndex: 0, display: 'none'}}
          ref={this.state.containerRef}
        />
        <canvas
          width='600px'
          height='500px'
          style={{position: 'absolute', top: 0, left: 0, zIndex: 0}}
          ref={this.state.baseLayerRef}
        />
        <canvas
          width='600px'
          height='500px'
          style={{position: 'absolute', top: 0, left: 0, zIndex: 1}}
          ref={this.state.midLayerRef}
        />
        {layers}
        <canvas
          width="600px"
          height="500px"
          style={{position: 'absolute', top: 0, left: 0, zIndex: 9, cursor: "none"}}
          onMouseMove={(e)=>this.onMouseMove(e)}
          onMouseDown={(e)=>this.handleMouseDown(e)}
          onMouseUp={(e)=>this.onMouseUp(e)}
          onPointerEnter={() => this.handlePointerEnter()}
          onPointerMove={e => this.handlePointerMove(e)}
          onPointerLeave={() => this.handlePointerLeave()}
          ref={this.mainCvRef}
        />
        {
          this.state.onPointer　&&
          <div className='pointer' style={{
            position: "absolute",
            top: pos.y - this.props.palette.weight/2,
            left: pos.x - this.props.palette.weight/2,
            width: this.props.palette.weight,
            height: this.props.palette.weight,
            backgroundColor: this.props.palette.color,
            opacity: this.props.palette.opacity,
          }}/>
        } 
      </div>
    )
  }
}