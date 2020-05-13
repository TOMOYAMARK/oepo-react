import React from 'react';
import './Canvas.scss';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    // 送信用のdraw処理
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
      imageStack: [],
      containerRef: React.createRef(),
      midLayerRef: React.createRef(),
      baseLayerRef: React.createRef(),
    }
  }

  backable(imageQueue) {
    return imageQueue.filter(img => img.id == this.props.mainUsrId && !img.hidden).length > 0;
  }

  forwardable(imageQueue) {
    return imageQueue.filter(img => img.id == this.props.mainUsrId && img.hidden).length > 0; 
  }

  componentDidMount() {
    console.log('component did mount');
    // ソケット
    const address = require('../../env.js').CANVASWS();
    this.webSocket = new WebSocket(address);
    this.webSocket.onmessage = (e => this.handleMessage(e));
    this.webSocket.onopen = (e => this.handleOpen(e));
  }

  componentDidUpdate() {
    console.log('component did update');
    console.log(this.props.palette.buttonState);
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

  drawing(ref, start, end, palette){
    const ctx = ref.current.getContext('2d');
    ctx.lineWidth = palette.weight;
    ctx.lineCap = 'round';
    ctx.strokeStyle = palette.state == "erase" ? "white" : palette.color;
    ctx.globalAlpha = palette.opacity;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
  }

  resetCanvas() {
    const midCtx = this.state.midLayerRef.current.getContext('2d');
    const baseCtx = this.state.baseLayerRef.current.getContext('2d');
    // mid,baseLayer,layersの消去
    this.clearCanvas(baseCtx, 600, 500);
    this.clearCanvas(midCtx, 600, 500);
    this.state.layers.map(layer => {
      const ctx = layer.ref.current.getContext('2d');
      this.clearCanvas(ctx, 600, 500);
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
    const midLayerRef = this.state.midLayerRef;
    const baseLayerRef = this.state.baseLayerRef;
    const containerRef = this.state.containerRef;

    // ユーザーが 参加した とき
    if(usrAct.state == "join"){
      console.log('handle message : join');
      console.log(usrAct);
      // usersの追加
      const user = {id: usrAct.data.id, layer: null, position: null};
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
      // 新しい layer と user の状態を定義
      const newLayer = {isDrawing: true, ref: prevLayer.ref};
      const newUser = {id: usrAct.id, layer: newLayer, position: usrAct.position};
      // hidden な image を消去した新しい imageQueue の状態を定義
      const newImageQueue = imageQueue.filter(img => img.id != usrAct.id || (img.id == usrAct.id && !img.hidden));
      // layers と users と imageQueue の更新
      layers = layers.map(layer => layer.id == usrAct.id ? newLayer : layer);
      users = users.map(user => user.id == usrAct.id ? newUser : user);
      imageQueue = newImageQueue;
    }
    // ペンが 移動した とき
    if(usrAct.state == "move"){
      console.log('handle message : move');
      console.log(usrAct.id);
      // ユーザーを取得
      const user = users.find(user => user.id == usrAct.id);
      // user の ref へ描画
      this.drawing(user.layer.ref, user.position, usrAct.position, usrAct.palette);
      // 新しいuserの状態を定義
      const newUser = {id: usrAct.id, layer: user.layer, position: usrAct.position};
      // users の更新
      users = users.map(user => user.id == usrAct.id ? newUser : user);
    }
    // ペンが 離された とき
    if(usrAct.state == "up"){
      console.log('handle message : up');
      // ユーザーを取得
      const user = users.find(user => user.id == usrAct.id);
      // mid context, base context を取得
      const midCtx = midLayerRef.current.getContext('2d');
      const baseCtx = baseLayerRef.current.getContext('2d');
      const containerCtx = containerRef.current.getContext('2d');
      // ドローする
      this.drawing(user.layer.ref, user.position, usrAct.position, usrAct.palette);
      // 画像を取得する
      const ctx = user.layer.ref.current.getContext('2d');
      const image = ctx.getImageData(0, 0, 600, 500);
      const imageData = {
        id: user.id,
        image: new ImageData(Uint8ClampedArray.from(image.data), 600, 500),
        hidden: false,
      };
      // userのlayerのcontextを初期化する
      this.clearCanvas(ctx, 600, 500);
      // キューの処理をする
      if(imageQueue.length < 5){
        // imageQueueを追加する
        imageQueue = [...imageQueue, imageData];
        // midCtxに描画
        imageQueue.map(image => {
          if(image.hidden) return;
          containerCtx.putImageData(image.image, 0, 0);
          midCtx.drawImage(containerRef.current, 0, 0);
        });
      }else{
        // imageQueueを追加する
        imageQueue = [...imageQueue, imageData];
        // baseの描画
        if(!imageQueue[0].hidden){
          containerCtx.putImageData(imageQueue[0].image, 0, 0);
          baseCtx.drawImage(containerRef.current, 0, 0);
        }
        // midの再描画
        this.clearCanvas(midCtx, 600, 500);
        const newImageQueue = imageQueue.filter(image => image !== imageQueue[0]);
        newImageQueue.map(image => {
          if(image.hidden) return;
          containerCtx.putImageData(image.image, 0, 0);
          midCtx.drawImage(containerRef.current, 0, 0);
        });
        // imageQueue の更新
        imageQueue = newImageQueue;
      }
      // 新しい layer と user の状態を定義
      const newLayer = {isDrawing: false, ref: user.layer.ref};
      const newUser = {id: usrAct.id, layer: null, position: usrAct.position};
      // layers と users の更新 (layer.isDrawing=false, user.layer=null)
      layers = layers.map(layer => layer == user.layer ? newLayer : layer);
      users = users.map(user => user.id == usrAct.id ? newUser : user);
      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(imageQueue));
      this.props.onChangeForwardable(this.forwardable(imageQueue));
    }
    // ユーザーが 戻るボタンを押した とき
    if(usrAct.state == "back"){
      if(imageQueue.filter(img => img.id == usrAct.id && !img.hidden).length > 0){
        console.log('handle message : back');
        const containerCtx = containerRef.current.getContext('2d');
        const midCtx = midLayerRef.current.getContext('2d');
        // imageQueueの要素を更新する
        let idx;
        for(let i=imageQueue.length-1; i>=0; i--)
          if(imageQueue[i].id == usrAct.id && !imageQueue[i].hidden){
            idx = i;
            break;
          }
        const newImage = {id: imageQueue[idx].id, image: imageQueue[idx].image, hidden: true};
        const newImageQueue = imageQueue.map(image => image === imageQueue[idx] ? newImage : image);
        // midの再描画
        this.clearCanvas(midCtx, 600, 500);
        newImageQueue.map(image => {
          if(image.hidden) return;
          containerCtx.putImageData(image.image, 0, 0);
          midCtx.drawImage(containerRef.current, 0, 0);
        });
        console.log(newImageQueue)
        imageQueue = newImageQueue;
      } else {
        console.log('debug')
      }

      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(imageQueue));
      this.props.onChangeForwardable(this.forwardable(imageQueue));
    }
    // ユーザーが 進むボタンを押した とき
    if(usrAct.state == "forward"){
      console.log('handle message : forward');

      if(imageQueue.filter(img => img.id == usrAct.id && img.hidden).length > 0){
        console.log('handle message : back');
        const containerCtx = containerRef.current.getContext('2d');
        const midCtx = midLayerRef.current.getContext('2d');
        // imageQueueの要素を更新する
        let idx;
        for(let i=0; i<imageQueue.length; i++)
          if(imageQueue[i].id == usrAct.id && imageQueue[i].hidden){
            idx = i;
            break;
          }
        const newImage = {id: imageQueue[idx].id, image: imageQueue[idx].image, hidden: false};
        const newImageQueue = imageQueue.map(image => image === imageQueue[idx] ? newImage : image);
        // midの再描画
        this.clearCanvas(midCtx, 600, 500);
        newImageQueue.map(image => {
          if(image.hidden) return;
          containerCtx.putImageData(image.image, 0, 0);
          midCtx.drawImage(containerRef.current, 0, 0);
        });
        console.log(newImageQueue)
        imageQueue = newImageQueue;
      } else {
        console.log('debug')
      }

      // 戻る・進むボタンの処理
      this.props.onChangeBackable(this.backable(imageQueue));
      this.props.onChangeForwardable(this.forwardable(imageQueue));
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
    }
    // ターンが終了したとき
    if(usrAct.state == 'turn-end'){
      // ctx の取得
      const containerCtx = containerRef.current.getContext('2d');
      const baseCtx = baseLayerRef.current.getContext('2d');
      //// キャンバスの画像を取得する
      // imgQueueをベースに描画する
      imageQueue.map(image => {
        if(image.hidden) return;
        containerCtx.putImageData(image.image, 0, 0);
        baseCtx.drawImage(containerRef.current, 0, 0);
      });
      // 描画中のレイヤーをベースに描画する
      this.state.layers.map(layer => {
        const ctx = layer.ref.current.getContext('2d');
        baseCtx.drawImage(containerRef.current, 0, 0);
      })
      // 画像を保存する
      const baseImage = baseCtx.getImageData(0, 0, 600, 500);
      this.props.onTurnEnd(baseImage);
      // キャンバスをリセットする
      this.resetCanvas();
      // キューを消去する
      imageQueue = [];
    }

    this.setState({
      layers: layers,
      users: users,
      imageQueue: imageQueue,
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
          style={{position: 'absolute', top: 0, left: 0, zIndex: 8}}
          onMouseMove={(e)=>this.onMouseMove(e)}
          onMouseDown={(e)=>this.handleMouseDown(e)}
          onMouseUp={(e)=>this.onMouseUp(e)}
        />
      </div>
    )
  }
}