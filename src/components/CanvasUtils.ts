import type { RefObject } from "react";

export type CanvasElement = {
  start:number,
  end:number
};

const PADDING = 8;


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
    elems.forEach(elem=>{
      if(!(this.ctx&&this.canvas))
        return;
      this.drawOutlinedRect(elem.start, elem.end);
    });
  }

  drawRect(startLoc:number, endLoc:number) {
    if(!(this.ctx&&this.canvas))
      return;
    this.ctx.fillStyle = "rgba(33, 125, 255, 0.231)";
    const startingX = this.canvas.width*(startLoc%3)/3+PADDING;
    const startingY = this.canvas.height*(Math.floor(startLoc/3))/(3)+PADDING;
    const width = this.canvas.width*(1+(endLoc%3))/3 -PADDING-startingX;
    const height = this.canvas.height*(1+Math.floor(endLoc/3))/3 -PADDING-startingY;
    this.ctx.fillRect(
      startingX, 
      startingY,
      width, 
      height
    );
  }

  drawOutlinedRect(startLoc:number, endLoc:number) {
    if(!(this.ctx&&this.canvas))
      return;
    this.ctx.strokeStyle = "black";
    const startingX = this.canvas.width*(startLoc%3)/3+PADDING;
    const startingY = this.canvas.height*(Math.floor(startLoc/3))/(3)+PADDING;
    const width = this.canvas.width*(1+(endLoc%3))/3 -PADDING-startingX;
    const height = this.canvas.height*(1+Math.floor(endLoc/3))/3 -PADDING-startingY;
    this.ctx.strokeRect(
      startingX, 
      startingY,
      width, 
      height
    );
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

  private generateMatrix(start:number, end:number) {
    let matrix = [start];
    let i = start;
    while(i<end) {
      if(i%3>=end%3)
        i = (Math.floor(i/3)+1)*3+(start%3);
      else
        i++;
      matrix.push(i);
    }
    return matrix;
  }

  private detectCollisions(location:number, elems = this.elements) {
    const vals = {
      collisions:[] as CanvasElement[],
      theRest:[] as CanvasElement[]
    };
    [...elems].forEach(e=>{
      const matrix = this.generateMatrix(e.start, e.end);
      if(matrix.includes(location)) 
        vals.collisions.push({...e});
      else
        vals.theRest.push({...e});
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
            start:(1+Math.floor(elem.start/3))*3 + (elem.start%3)
          });
          break;
        
        case 3:
          newElements.push({
            ...elem, 
            start:elem.start+1
          });
          break;
        
        case 5:
          newElements.push({
            ...elem, 
            end:elem.end -1
          });
          break;
        
        case 6:
        case 7:
        case 8:
          newElements.push({
            ...elem, 
            end:(Math.floor(elem.end/3)-1)*3 + (elem.end%3)
          });
          break;

        default:
          newElements.push({...elem});
          break;
      }
    });
    return newElements;
  }

  private boxExpansion(loc:number, elems:CanvasElement[]) {
    let holoMatrix = [loc];
    // Check adjacents
    if(((loc%3)-1)>=0 && this.detectCollisions(loc-1,elems).collisions.length<1){
      holoMatrix.push(loc-1);
    }
    if(((loc%3)+1)<=2 && this.detectCollisions(loc+1,elems).collisions.length<1){
      holoMatrix.push(loc+1);
    }
    if(((loc%3)-2)>=0 && this.detectCollisions(loc-2,elems).collisions.length<1){
      holoMatrix.push(loc-2);
    }
    if(((loc%3)+2)<=2 && this.detectCollisions(loc+2,elems).collisions.length<1){
      holoMatrix.push(loc+2);
    }

    // Check above & below
    const rowAbove1 = Math.floor(loc/3)+1;
    const above1 = holoMatrix.map(l=>3*rowAbove1+l%3);
    const rowBelow1 = Math.floor(loc/3)-1;
    const below1 = holoMatrix.map(l=>3*rowBelow1+l%3);
    const rowAbove2 = Math.floor(loc/3)+2;
    const above2 = holoMatrix.map(l=>3*rowAbove2+l%3);
    const rowBelow2 = Math.floor(loc/3)-2;
    const below2 = holoMatrix.map(l=>3*rowBelow2+l%3);

    if(rowAbove1<=2){
      if(above1.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
        holoMatrix = holoMatrix.concat(above1);
      }
    }
    if(rowBelow1>=0){
      if(below1.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
        holoMatrix = holoMatrix.concat(below1);
      }
    }
    if(rowAbove2<=2){
      if(above2.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
        holoMatrix = holoMatrix.concat(above2);
      }
    }
    if(rowBelow2>=0){
      if(below2.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
        holoMatrix = holoMatrix.concat(below2);
      }
    }

    return holoMatrix;
  }

  drawCreationRect(e:React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if(!(this.ctx&&this.canvas))
      return;
    const [x,y] = this.getXY(e);
    const loc = this.getLocation(x,y);
    const {collisions,theRest} = this.detectCollisions(loc);
    const newElements = [...this.squishElements(loc,collisions), ...theRest];
    const holoMatrix = this.boxExpansion(loc, newElements);
    
    this.render(newElements);
    this.drawRect(Math.min(...holoMatrix),Math.max(...holoMatrix));
    this.canvas.onclick = () => {
      this.elements = [...this.squishElements(loc,collisions), ...theRest];
      this.elements.push({
        start:Math.min(...holoMatrix),
        end:Math.max(...holoMatrix)
      });
      this.render();
    };
  }
}