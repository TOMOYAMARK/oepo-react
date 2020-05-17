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
    return queue.filter(obj => obj.id == this.props.mainUsrId && !obj.hidden).length > 0;
  }

  forwardable(queue) {
    return queue.filter(obj => obj.id == this.props.mainUsrId && obj.hidden).length > 0; 
  }

  async componentDidMount() {
    console.log('component did mount');
    // ソケット
    const address = require('../../env.js').CANVASWS();
    this.webSocket = new WebSocket(address);
    this.webSocket.onmessage = (e => this.handleMessage(e));
    this.webSocket.onopen = (e => this.handleOpen(e));
    // 描画状態を同期する
    let canvasData;
    await axios.post("/api/canvas/join")
      .then(res => {
        console.log(res.data);
        canvasData = {
          base64Img: res.data.base64Img,
          strokes: JSON.parse(res.data.strokes),
        }
      })
      .catch(() => console.log("エラー"));

    // baseに描画する
    const ctx = this.state.baseLayerRef.current.getContext('2d');
    var img = new Image();
    img.src = canvasData.base64Img;
    img.onload = function(){
      ctx.drawImage(img, 0, 0, 600, 500);
    }

    // ストロークキューに挿入する
    // ストロークの変換
    const strokes = canvasData.strokes.map(stroke => {
      console.log(stroke);
      const usrAct = JSON.parse(stroke.lastAct);
      
      if(usrAct){
        if(usrAct.state === "move"){
          const usrActJoin = {id:usrAct.id, state: "join"};
          const usrActDown = {...usrAct, state: "down", base64Img: stroke.base64Img};
          this.handleMessage(JSON.stringify(usrActJoin));
          this.handleMessage(JSON.stringify(usrActDown));
        }
      }

      return {
        id: stroke.id,
        palette: stroke.palette,
        hidden: stroke.hidden,
        base64Img: stroke.base64Img,
        lastAct: JSON.parse(stroke.lastAct),
      };
    });

     // midの再描画
     this.clearCanvas(this.state.midLayerRef, 600, 500);
     strokes.map(stroke => {if(!stroke.hidden) this.drawing(this.state.midLayerRef, stroke);});
     this.setState({
       strokeQueue: strokes,
     });
  }

  componentDidUpdate() {
    // console.log('component did update');
    // console.log(this.props.palette.buttonState);
    if(this.props.palette.buttonState === "reset"){
      this.handleReset();
      this.props.onResetInCv();
    }

    if(this.props.palette.buttonState === "back"){
      this.handleBack();
      this.props.onResetInCv();
    }

    if(this.props.palette.buttonState === "forward"){
      this.handleForward();
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
    ctx.strokeStyle = stroke.palette.state == "erase" ? "white" : stroke.palette.color;
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
  }

  handleMessage(e) {
    const usrAct = JSON.parse(e.data);
    let layers = [...this.state.layers];
    let users = [...this.state.users];
    let imageQueue = [...this.state.imageQueue];
    let strokeQueue = [...this.state.strokeQueue];
    const midLayerRef = this.state.midLayerRef;
    const baseLayerRef = this.state.baseLayerRef;
    const containerRef = this.state.containerRef;

    // ユーザーが 参加した とき
    if(usrAct.state == "join"){
      console.log('handle message : join');
      // usersの追加
      const user = {id: usrAct.data.id, layer: null, stroke: null, position: null};
      users = users.some(usr => usr.id == user.id) ? [...users] : [...users, user];
    }

    // ユーザーが 退室した とき
    if(usrAct.state == "leave"){
      console.log('handle message : leave');
      // usersの削除
      users = users.filter(user => user.id != usrAct.id);
    }

    // ペンが 置かれた とき
    if(usrAct.state == "down"){
      console.log('handle message : down');
      // false の layer を取得
      const prevLayer = layers.find(layer => !layer.isDrawing);
      // 新しい stroke を定義
      const stroke = {id: usrAct.id, path: new Path2D(), palette: usrAct.palette, hidden: false};
      // refにストロークの情報をセット
      this.setContextPreference(prevLayer.ref, stroke);
      // ストロークにbase64Imgがあったら描画する
      if(usrAct.base64Img){
        const base64Stroke = {...stroke, base64Img: usrAct.base64Img};
        this.drawing(prevLayer.ref, base64Stroke);  
      }
      // 新しい layer と user の状態を定義
      const newLayer = {isDrawing: true, ref: prevLayer.ref};
      const newUser = {id: usrAct.id, layer: newLayer, stroke: stroke, position: usrAct.position};
      // hidden な stroke を消去した新しい strokeQueue の状態を定義
      const newStrokeQueue = strokeQueue.filter(stroke => stroke.id != usrAct.id || (stroke.id == usrAct.id && !stroke.hidden));
      // layers と users と imageQueue の更新
      layers = layers.map(layer => layer.id == usrAct.id ? newLayer : layer);
      users = users.map(user => user.id == usrAct.id ? newUser : user);
      // strokeQueue の更新
      strokeQueue = newStrokeQueue;
    }

    // ペンが 移動した とき
    if(usrAct.state == "move"){
      console.log('handle message : move');
      // ユーザーを取得 => 中のlayer.ref, position, とstroke.pathだけは変更あり
      const user = users.find(user => user.id == usrAct.id);
      // ユーザーのストロークに線分を追加
      const path = user.stroke.path;
      path.moveTo(user.position.x, user.position.y);
      path.lineTo(usrAct.position.x, usrAct.position.y);
      // user の ref へ描画
      this.clearCanvas(user.layer.ref, 600, 500);
      this.drawingWithoutSetting(user.layer.ref, user.stroke);
      // 新しいuserの状態を定義
      const newUser = {id: usrAct.id, layer: user.layer, stroke: user.stroke, position: usrAct.position};
      // users の更新
      users = users.map(user => user.id == usrAct.id ? newUser : user);
    }

    // ペンが 離された とき
    if(usrAct.state == "up"){
      console.log('handle message : up');
      // ユーザーを取得
      const user = users.find(user => user.id == usrAct.id);
      // userのストロークを更新する => 破壊的方法をしている??
      const path = user.stroke.path;
      path.moveTo(user.position.x, user.position.y);
      path.lineTo(usrAct.position.x, usrAct.position.y);
      // ドローする
      this.clearCanvas(user.layer.ref);
      this.drawingWithoutSetting(user.layer.ref, user.stroke);
      // userのlayerのcontextを初期化する
      this.clearCanvas(user.layer.ref, 600, 500);
      // strokeQueue の処理
      if(strokeQueue.length < 5){
        // キューに追加
        strokeQueue = [...strokeQueue, user.stroke];
        // midCtxに描画
        strokeQueue.map(stroke => {
          if(!stroke.hidden) this.drawing(midLayerRef, stroke);
        })
      }else{
        // キューに追加
        strokeQueue = [...strokeQueue, user.stroke];
        // baseの描画
        if(!strokeQueue[0].hidden)
          this.drawing(baseLayerRef, strokeQueue[0]);
        // midの再描画
        this.clearCanvas(midLayerRef, 600, 500);
        const newStrokeQueue = strokeQueue.filter(stroke => stroke !== strokeQueue[0]);
        newStrokeQueue.map(stroke => {if(!stroke.hidden) this.drawing(midLayerRef, stroke);});
        // strokeQueue の更新
        strokeQueue = newStrokeQueue;
      }
      // 新しい layer と user の状態を定義
      const newLayer = {isDrawing: false, ref: user.layer.ref};
      const newUser = {id: usrAct.id, layer: null, stroke: null, position: usrAct.position};
      // layers と users の更新 (layer.isDrawing=false, user.layer=null)
      layers = layers.map(layer => layer == user.layer ? newLayer : layer);
      users = users.map(user => user.id == usrAct.id ? newUser : user);
      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(strokeQueue));
      this.props.onChangeForwardable(this.forwardable(strokeQueue));
    }

    // ユーザーが 戻るボタンを押した とき
    if(usrAct.state == "back"){
      if(strokeQueue.filter(stroke => stroke.id == usrAct.id && !stroke.hidden).length > 0){
        console.log('handle message : back');
        const containerCtx = containerRef.current.getContext('2d');
        const midCtx = midLayerRef.current.getContext('2d');
        // imageQueueの要素を更新する
        let idx;
        for(let i=strokeQueue.length-1; i>=0; i--)
          if(strokeQueue[i].id == usrAct.id && !strokeQueue[i].hidden){
            idx = i;
            break;
          }
        const newStroke = {...strokeQueue[idx], hidden: true};
        const newStrokeQueue = strokeQueue.map(stroke => stroke === strokeQueue[idx] ? newStroke : stroke);
        // midの再描画
        this.clearCanvas(midLayerRef, 600, 500);
        newStrokeQueue.map(stroke => { if(!stroke.hidden) this.drawing(midLayerRef, stroke);});
        strokeQueue = newStrokeQueue;
      } else {
        console.log('debug')
      }

      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(strokeQueue));
      this.props.onChangeForwardable(this.forwardable(strokeQueue));
    }

    // ユーザーが 進むボタンを押した とき
    if(usrAct.state == "forward"){
      console.log('handle message : forward');

      if(strokeQueue.filter(stroke => stroke.id == usrAct.id && stroke.hidden).length > 0){
        console.log('handle message : back');
        // imageQueueの要素を更新する
        let idx;
        for(let i=0; i<strokeQueue.length; i++)
          if(strokeQueue[i].id == usrAct.id && strokeQueue[i].hidden){
            idx = i;
            break;
          }
          const newStroke = {...strokeQueue[idx], hidden: false};
          const newStrokeQueue = strokeQueue.map(stroke => stroke === strokeQueue[idx] ? newStroke : stroke);
        // midの再描画
        this.clearCanvas(midLayerRef, 600, 500);
        newStrokeQueue.map(stroke => { if(!stroke.hidden) this.drawing(midLayerRef, stroke);});
        strokeQueue = newStrokeQueue;
      } else {
        console.log('debug')
      }

      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(strokeQueue));
      this.props.onChangeForwardable(this.forwardable(strokeQueue));
    }

    // ユーザーが 全消しボタンを押した とき
    if(usrAct.state == 'reset'){
      console.log('handle message : reset');
      // キャンバスの状態を全てリセットする
      this.resetCanvas();
      // キューを消去する
      imageQueue = [];
      // マウス動いてる途中で全消しした場合
      this.onMouseMove = () => {};
      this.onMouseUp = () => {};
      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(strokeQueue));
      this.props.onChangeForwardable(this.forwardable(strokeQueue));
      // リレンダー
      this.props.onResetInCv();
    }

    // ターンが終了したとき
    if(usrAct.state == 'turn-end'){
      // ctx の取得
      const baseCtx = baseLayerRef.current.getContext('2d');
      //// キャンバスの画像を取得する
      // imgQueueをベースに描画する
      strokeQueue.map(stroke => { if(!stroke.hidden) this.drawing(baseLayerRef, stroke); });
      // 描画中のレイヤーをベースに描画する
      this.state.layers.map(layer => baseCtx.drawImage(containerRef.current, 0, 0));
      // 画像を保存する
      const baseImage = baseCtx.getImageData(0, 0, 600, 500);
      this.props.onTurnEnd(baseImage);
      // キャンバスをリセットする
      this.resetCanvas();
      // キューを消去する
      strokeQueue = [];
      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(strokeQueue));
      this.props.onChangeForwardable(this.forwardable(strokeQueue));
    }

    this.setState({
      layers: layers,
      users: users,
      imageQueue: imageQueue,
      strokeQueue: strokeQueue,
      midLayerRef: midLayerRef,
      baseLayerRef: baseLayerRef,
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

  handleBack() {
    console.log('handle back');

    const json = {
      id: this.props.mainUsrId,
      state: "back",
    };
    this.webSocket.send(JSON.stringify(json));
  }

  handleForward() {
    console.log('handle forward');

    const json = {
      id: this.props.mainUsrId,
      state: "forward",
    };
    this.webSocket.send(JSON.stringify(json));
  }

  handleReset() {
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