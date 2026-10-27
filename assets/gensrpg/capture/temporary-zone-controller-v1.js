"use strict";
/* UI-neutral temporary exploration controller: movement emits encounter keys only.
 * Combat and creature authority remain outside this module. */
(function(root){
 function create({width=9,height=7,encounterSource,encounterAt,onMove=()=>{}}){
  if(!Number.isInteger(width)||width<2||!Number.isInteger(height)||height<2)throw new RangeError("Invalid zone size");
  if(!encounterSource||typeof encounterSource.encounter!=="function"||typeof encounterSource.leave!=="function")throw new TypeError("Encounter source required");
  if(typeof encounterAt!=="function"||typeof onMove!=="function")throw new TypeError("Callbacks required");
  let x=0,y=0,locked=false,disposed=false;
  function state(){return Object.freeze({x,y,width,height,locked,disposed});}
  function move(dx,dy){
   if(disposed)throw new Error("Zone disposed");
   if(locked)return Object.freeze({moved:false,reason:"encounter-active",state:state()});
   if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)throw new TypeError("Move exactly one tile");
   const nx=x+dx,ny=y+dy;
   if(nx<0||ny<0||nx>=width||ny>=height)return Object.freeze({moved:false,reason:"boundary",state:state()});
   x=nx;y=ny;onMove(state());
   const key=encounterAt(x,y);
   if(key!==null&&key!==undefined){
    if(typeof key!=="string"||!key.trim())throw new TypeError("Invalid encounter key");
    const launched=encounterSource.encounter(key);
    if(launched.ready)locked=true;
    return Object.freeze({moved:true,encounter:launched,state:state()});
   }
   return Object.freeze({moved:true,state:state()});
  }
  function resume(){if(disposed)throw new Error("Zone disposed");locked=false;return state();}
  function leave(){if(disposed)return false;if(locked)encounterSource.leave();locked=false;disposed=true;return true;}
  return Object.freeze({move,resume,leave,state});
 }
 root.GensCaptureTemporaryZoneControllerV1=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);
