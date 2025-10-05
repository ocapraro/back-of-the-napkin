import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css';
import './App.css'
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement, FractionalIndex } from '@excalidraw/excalidraw/element/types';
import {useState } from 'react';

const BOUNDS = [{x:10,y:10},{x:571.5,y:568}];

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [updated, setUpdated] = useState(false);
  const elems:ExcalidrawElement[] = [
    {"id":"S1of8bWbCtqTuhE-IPtit","type":"rectangle","x":110.5,"y":93,"width":65,"height":38,"angle":0,"strokeColor":"#1e1e1e","backgroundColor":"transparent","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roughness":1,"opacity":100,"groupIds":[],"frameId":null,"index":"a0" as FractionalIndex,"roundness":{"type":3},"seed":876682910,"version":17,"versionNonce":147079234,"isDeleted":false,"boundElements":null,"updated":1759697072510,"link":null,"locked":false}
  ];
  const initialData:ExcalidrawInitialDataState={
    appState:{
      viewBackgroundColor:"#0000",
    },
    scrollToContent:false,
    elements:elems

  };
  return (
    <div className="App">
      <div id='napkin-image'>
        <div 
          id='excalidraw-wrapper'
          onWheelCapture={(e) => {
            // Stop Excalidraw from hijacking scroll
            e.stopPropagation();
          }}
        >
            <Excalidraw
              excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
                setExcalidrawAPI(api);
                setUpdated(false);
              }}
              initialData={initialData}
              zenModeEnabled={true}
              onChange={()=>{
                if(!excalidrawAPI)
                  return;
                const es = [...excalidrawAPI.getSceneElements()];
                const newElems:ExcalidrawElement[] = [];
                let hitEdge = false;
                es.forEach(elem=>{
                  if((elem.x<BOUNDS[0].x||elem.y<BOUNDS[0].y)||((elem.x+elem.width)>BOUNDS[1].x||(elem.y+elem.height)>BOUNDS[1].y))
                    hitEdge = true;
                  newElems.push({
                    ...elem, 
                    x:Math.min(Math.max(elem.x,BOUNDS[0].x),BOUNDS[1].x-elem.width), 
                    y:Math.min(Math.max(elem.y,BOUNDS[0].y),BOUNDS[1].y-elem.height)
                  })
                })
                if(hitEdge){
                  if(updated)
                    return;
                  setUpdated(true);
                  excalidrawAPI.updateScene({elements:newElems});
                } else {
                  setUpdated(false);
                }
              }}
              UIOptions={{
                canvasActions: {
                  changeViewBackgroundColor: false,
                  clearCanvas: false,
                  export: false,
                  loadScene: false,
                  saveAsImage: false,
                  toggleTheme: false,
                  saveToActiveFile: false,
                },
              }}
            />
        </div>
      </div>
    </div>
  )
}
export default App
