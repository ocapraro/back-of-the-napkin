import type { RefObject } from "react";

export type CanvasElement = {
    width:number,
    height:number,
    x:number,
    y:number
  };


export default class CanvasUtils {
  canvas:HTMLCanvasElement | undefined;
  ctx:CanvasRenderingContext2D | undefined;
  elements:CanvasElement[];
  constructor (canvasRef:RefObject<HTMLCanvasElement | null>) {
    this.elements = [];
    if(!canvasRef.current)
      return;
    this.canvas = canvasRef.current;
    const ctx = this.canvas.getContext("2d");
    if(ctx)
      this.ctx = ctx;
  }

  clear () {
    if(!(this.ctx&&this.canvas))
      return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render () {
    if(!(this.ctx&&this.canvas))
      return;
    this.clear();
    this.ctx.strokeStyle = "black";
    this.elements.forEach(elem=>{
      if(!(this.ctx&&this.canvas))
        return;
      this.ctx?.strokeRect(elem.x,elem.y,elem.width, elem.height);
    });
  }

  drawRect(color:string, height:number|"full", width:number|"full", x=0, y=0) {
    if(!(this.ctx&&this.canvas))
      return;
    this.ctx.fillStyle = color;
    if(height == "full")
      height = this.canvas.height;
    if(width == "full")
      width = this.canvas.width;
    this.ctx.fillRect(x, y, width, height);
  }

  drawCreationRect(_:React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if(!(this.ctx&&this.canvas))
      return;
    this.drawRect("rgba(33, 125, 255, 0.231)","full","full");
    this.canvas.onclick = () => {
      this.elements.push({
        x:4,
        y:4,
        width:(this.canvas?.width||8)-8,
        height:(this.canvas?.height||8)-8
      });
      this.render();
    };
  }
}