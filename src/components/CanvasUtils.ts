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

  render (elems = this.elements) {
    if(!(this.ctx&&this.canvas))
      return;
    this.clear();
    this.ctx.strokeStyle = "black";
    elems.forEach(elem=>{
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

  private getXY(e:React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if(!(this.ctx&&this.canvas))
      return [0,0];
    return [e.clientX-this.canvas.offsetLeft, e.clientY-this.canvas.offsetTop];
  }

  private getLocation(x:number,y:number) {
    if(!(this.ctx&&this.canvas))
      return 4;
    return Math.max(0,Math.ceil(x/this.canvas.width*3)+3*(Math.ceil(y/this.canvas.height*3)-1)-1);
  }

  private detectCollisions(location:number) {
    const vals = {
      collisions:[] as CanvasElement[],
      theRest:[] as CanvasElement[]
    };
    [...this.elements].forEach(e=>{
      const start = this.getLocation(e.x,e.y);
      const end = this.getLocation(e.x+e.width,e.y+e.height);
      let locations = [start,end];
      let [i,j] = [start%3,end%3];
      let[ii,jj] = [Math.floor(start/3)*3,Math.floor(end/3)*3]
      if(ii!=jj)
        while (i<end%3) {
          i++;
          locations.push(i+ii);
        }
      while (j>start%3) {
        j--;
        locations.push(j+jj);
      }
      console.log(start,end,locations,location);
      if(locations.includes(location))
        vals.collisions.push(e);
      else
        vals.theRest.push(e);
    });
    return vals;
  }

  private squishElements(location:number, elements:CanvasElement[]) {
    const newElements:CanvasElement[] = [];
    elements.forEach(elem=>{
      if(!(this.ctx&&this.canvas))
        return;
      switch (location) {
        case 0:
        case 1:
        case 2:
          newElements.push({
            ...elem, 
            y:this.canvas.height/3,
            height:elem.height-this.canvas.height/3
          });
          break;
        
        case 3:
          newElements.push({
            ...elem, 
            x:this.canvas.width/3,
            width:elem.width-this.canvas.width/3
          });
          break;
        
        case 5:
          newElements.push({
            ...elem, 
            width:elem.width-this.canvas.width/3
          });
          break;
        
        case 6:
        case 7:
        case 8:
          newElements.push({
            ...elem, 
            height:elem.height-this.canvas.height/3
          });
          break;

        default:
          newElements.push({...elem});
          break;
      }
    });
    return newElements;
  }

  drawCreationRect(e:React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if(!(this.ctx&&this.canvas))
      return;
    const [x,y] = this.getXY(e);
    const loc = this.getLocation(x,y);
    const {collisions,theRest} = this.detectCollisions(loc);
    this.render([...this.squishElements(loc,collisions), ...theRest]);

    let [newX,newY,newWidth,newHeight] = [0,0,this.canvas.width,this.canvas.height];
    if(collisions.length)
      switch (loc) {
        case 0:
        case 1:
        case 2:
          newHeight = this.canvas.height/3;
          break;
        
        case 3:
          newWidth = this.canvas.width/3;
          break;
        
        case 5:
          newX = this.canvas.width*2/3
          newWidth = this.canvas.width/3;
          break;
        
        case 6:
        case 7:
        case 8:
          newY = this.canvas.height*2/3
          newHeight = this.canvas.height/3;
          break;

        default:
          break;
      }
    this.drawRect("rgba(33, 125, 255, 0.231)", newHeight, newWidth, newX, newY);
    this.canvas.onclick = () => {
      this.elements = [...this.squishElements(loc,collisions), ...theRest];
      this.elements.push({
        x:Math.max(newX,4),
        y:Math.max(newY,4),
        width:Math.min(newWidth,(this.canvas?.width||8)-8),
        height:Math.min(newHeight,(this.canvas?.height||8)-8)
      });
      this.render();
    };
  }
}