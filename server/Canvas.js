const { createCanvas } = require('canvas');
require('canvas-5-polyfill');

class Canvas {
  constructor(){
    this.usrActs = [];
    this.strokeQueue = [];
    this.baseLayerRef = createCanvas(600, 500);
  }

  get base64Img() {
    return this.baseLayerRef.toDataURL('image/png');
  }

  get strokesWithoutPath() {
    const strokes = this.strokeQueue.map(stroke => {
      const usrActs = this.usrActs.filter(act => act.id === stroke.id);
      console.log(usrActs);
      const canvas = createCanvas(600, 500);
      this.drawing(canvas, stroke);
      return {
        id: stroke.id,
        hidden: stroke.hidden,
        base64Img: canvas.toDataURL('image/png'),
        palette: stroke.palette,
        lastAct: (usrActs.length > 0 ? usrActs[usrActs.length-1] : null),
      }
    });
    return strokes;
  }

  drawing(ref, stroke){
    this.setContextPreference(ref, stroke);
    this.drawingWithoutSetting(ref, stroke);
  }

  setContextPreference(ref, stroke){
    const ctx = ref.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = stroke.palette.weight;
    ctx.strokeStyle = stroke.palette.state == "erase" ? "white" : stroke.palette.color;
    ctx.globalAlpha = stroke.palette.opacity;
  }

  drawingWithoutSetting(ref, stroke){
    const ctx = ref.getContext('2d');
    ctx.stroke(stroke.path);
  }

  reset(){
    const ctx = this.baseLayerRef.getContext('2d');
    ctx.clearRect(0, 0, 600, 500);
  }

  addUsrAct(usrAct){
    if(usrAct.state === 'join') this.handleJoin(usrAct);
    if(usrAct.state === 'leave') this.handleLeave(usrAct);
    if(usrAct.state === 'down') this.handleDown(usrAct);
    if(usrAct.state === 'move') this.handleMove(usrAct);
    if(usrAct.state === 'up') this.handleUp(usrAct);
    if(usrAct.state === 'back') this.handleBack(usrAct);
    if(usrAct.state === 'forward') this.handleForward(usrAct);
    if(usrAct.state === 'reset') this.handleReset();
    if(usrAct.state === 'turn-end') this.handleTurnEnd();
  }

  handleJoin(usrAct){
    console.log('handle join');
  }

  handleLeave(usrAct){
    console.log('handle leave');
  }

  handleDown(usrAct){
    console.log('handle down');
    const usrActs = [...this.usrActs, usrAct];
    this.usrActs = usrActs;
  }

  handleMove(usrAct){
    console.log('handle move');
    const usrActs = [...this.usrActs, usrAct];
    this.usrActs = usrActs;
  }

  handleUp(usrAct){
    console.log('handle up');
    const usrActs = this.usrActs.filter(act => act.id === usrAct.id);
    const path = new Path2D();
    usrActs.map((act, idx) => {
      if(idx > 0){
        const prePos = usrActs[idx-1].position;
        path.moveTo(prePos.x, prePos.y);
        path.lineTo(act.position.x, act.position.y);
      }
    });
    const stroke = {
      id: usrAct.id,
      path: path,
      hidden: false,
      palette: usrAct.palette,
    };
    let strokeQueue = [...this.strokeQueue, stroke];
    if(strokeQueue.length > 5){
      if(!strokeQueue[0].hidden) this.drawing(this.baseLayerRef, strokeQueue[0]);
      strokeQueue = strokeQueue.filter(stroke => stroke !== strokeQueue[0]);
    }
    this.usrActs = this.usrActs.filter(act => act.id !== usrAct.id);
    this.strokeQueue = strokeQueue;
  }

  handleBack(usrAct){
    console.log(this.strokeQueue.filter(stroke => stroke.id === usrAct.id && !stroke.hidden).length);
    if(this.strokeQueue.filter(stroke => stroke.id === usrAct.id && !stroke.hidden).length > 0){
      console.log('handle back');
      let idx;
      for(let i=this.strokeQueue.length-1; i>=0; i--)
        if(this.strokeQueue[i].id == usrAct.id && !this.strokeQueue[i].hidden){
          idx = i;
          break;
        }
      const newStroke = {...this.strokeQueue[idx], hidden: true};
      this.strokeQueue = this.strokeQueue.map(stroke => stroke === this.strokeQueue[idx] ? newStroke: stroke);
    }else{
      console.log('debug');
    }
  }

  handleForward(usrAct){
    console.log(this.strokeQueue.filter(stroke => stroke.id === usrAct.id && stroke.hidden).length);
    if(this.strokeQueue.filter(stroke => stroke.id === usrAct.id && stroke.hidden).length > 0){
      console.log('handle back');
      let idx;
      for(let i=0; i<this.strokeQueue.length; i++)
        if(this.strokeQueue[i].id == usrAct.id && this.strokeQueue[i].hidden){
          idx = i;
          break;
        }
      const newStroke = {...this.strokeQueue[idx], hidden: false};
      this.strokeQueue = this.strokeQueue.map(stroke => stroke === this.strokeQueue[idx] ? newStroke: stroke);
    }else{
      console.log('debug');
    }
  }

  handleReset(){
    console.log('handle reset');
    this.reset();
    this.strokeQueue = [];
  }

  handleTurnEnd(){
    console.log('handle turn end');
    this.reset();
    this.strokeQueue = [];
  }
}


exports.Canvas = Canvas;