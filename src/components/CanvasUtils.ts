import type { RefObject } from "react";

export type CanvasElement = {
  start:number,
  end:number
};

const PADDING = 8;
const DIMENSIONS = 3;


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
    const startingX = this.canvas.width*(startLoc%DIMENSIONS)/DIMENSIONS+PADDING;
    const startingY = this.canvas.height*(Math.floor(startLoc/DIMENSIONS))/(DIMENSIONS)+PADDING;
    const width = this.canvas.width*(1+(endLoc%DIMENSIONS))/DIMENSIONS -PADDING-startingX;
    const height = this.canvas.height*(1+Math.floor(endLoc/DIMENSIONS))/DIMENSIONS -PADDING-startingY;
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
    const startingX = this.canvas.width*(startLoc%DIMENSIONS)/DIMENSIONS+PADDING;
    const startingY = this.canvas.height*(Math.floor(startLoc/DIMENSIONS))/(DIMENSIONS)+PADDING;
    const width = this.canvas.width*(1+(endLoc%DIMENSIONS))/DIMENSIONS -PADDING-startingX;
    const height = this.canvas.height*(1+Math.floor(endLoc/DIMENSIONS))/DIMENSIONS -PADDING-startingY;
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
      return DIMENSIONS+1;
    return Math.max(0,Math.ceil(x/this.canvas.width*DIMENSIONS)+DIMENSIONS*(Math.ceil(y/this.canvas.height*DIMENSIONS)-1)-1);
  }

  private generateMatrix(start:number, end:number) {
    let matrix = [start];
    let i = start;
    while(i<end) {
      if(i%DIMENSIONS>=end%DIMENSIONS)
        i = (Math.floor(i/DIMENSIONS)+1)*DIMENSIONS+(start%DIMENSIONS);
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
      const matrix = this.generateMatrix(elem.start, elem.end);
      const max = Math.max(...matrix);
      const min = Math.min(...matrix);

      // Handle x edges
      if(location%DIMENSIONS==max%DIMENSIONS || location%DIMENSIONS == min%DIMENSIONS) {
        const edgeMatrix = matrix.filter(cell=>cell%DIMENSIONS!=location%DIMENSIONS);
        if(edgeMatrix.length>0){
          newElements.push({
            start:Math.min(...edgeMatrix),
            end:Math.max(...edgeMatrix)
          });
          return;
        }
      }

      // Handle y edges
      if(Math.floor(location/DIMENSIONS) == Math.floor(min/DIMENSIONS) || Math.floor(location/DIMENSIONS) == Math.floor(max/DIMENSIONS)){
        const edgeMatrix = matrix.filter(cell=>Math.floor(cell/DIMENSIONS)!=Math.floor(location/DIMENSIONS));
        if(edgeMatrix.length>0){
          newElements.push({
            start:Math.min(...edgeMatrix),
            end:Math.max(...edgeMatrix)
          });
          return;
        }
      }

      newElements.push({...elem});
    });
    return newElements;
  }

  private boxExpansion(loc:number, elems:CanvasElement[]) {
    let holoMatrix = [loc];
    // Check adjacents
    for (let i = 1; i < DIMENSIONS; i++) {
      if(((loc%DIMENSIONS)-i)>=0 && this.detectCollisions(loc-i,elems).collisions.length<1){
      holoMatrix.push(loc-i);
      }
      if(((loc%DIMENSIONS)+i)<=2 && this.detectCollisions(loc+i,elems).collisions.length<1){
        holoMatrix.push(loc+i);
      }
    }

    // Check above & below
    for (let i = 1; i < DIMENSIONS; i++) {
      const rowAbove = Math.floor(loc/DIMENSIONS)+i;
      const above = holoMatrix.map(l=>DIMENSIONS*rowAbove+l%DIMENSIONS);
      const rowBelow = Math.floor(loc/DIMENSIONS)-i;
      const below = holoMatrix.map(l=>DIMENSIONS*rowBelow+l%DIMENSIONS);
      if(rowAbove<DIMENSIONS){
        if(above.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
          holoMatrix = holoMatrix.concat(above);
        }
      }
      if(rowBelow>=0){
        if(below.reduce((a,b)=>a&&(this.detectCollisions(b,elems).collisions.length<1),true)){
          holoMatrix = holoMatrix.concat(below);
        }
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