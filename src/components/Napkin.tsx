import { useRef, useState, useEffect } from "react";
import "./napkin.css";
import CanvasUtils from "./CanvasUtils";

export default function Napkin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasUtils, setCanvasUtils] = useState<CanvasUtils | null>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasUtils(new CanvasUtils(canvasRef));
    }
  }, [canvasRef]);
  return (
    <div id='napkin-image'>
      <canvas 
        ref={canvasRef} 
        width={570} 
        height={565}
        onMouseMove={e=>{
          canvasUtils?.drawCreationRect(e);
        }} 
        onMouseLeave={()=>{
          canvasUtils?.render();
        }}
      >
      </canvas>
    </div>
  )
}
