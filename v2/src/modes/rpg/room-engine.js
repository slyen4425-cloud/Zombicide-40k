function clone(value){return structuredClone(value);}
function id(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function key(x,y){return `${Number(x)},${Number(y)}`;}

export function normalizeRoomDimensions({width=8,height=8}={}){
  return {
    width:Math.max(1,Math.min(100,Math.floor(Number(width)||8))),
    height:Math.max(1,Math.min(100,Math.floor(Number(height)||8))),
  };
}

export function createRoomLayout({id:layoutId=id(),roomId=null,name='Nouvelle salle',width=8,height=8}={}){
  const size=normalizeRoomDimensions({width,height});
  return {
    id:String(layoutId),
    roomId:roomId?String(roomId):null,
    name,
    width:size.width,
    height:size.height,
    cells:{},
    walls:[],
    doors:[],
    markers:[],
    metadata:{},
  };
}

export function isInsideRoom(layout,x,y){
  const xx=Number(x), yy=Number(y);
  return Number.isInteger(xx)&&Number.isInteger(yy)&&xx>=0&&yy>=0&&xx<Number(layout?.width||0)&&yy<Number(layout?.height||0);
}

export function setRoomCell(layout,x,y,patch={}){
  if(!isInsideRoom(layout,x,y)) return {ok:false,reason:'out-of-bounds',layout};
  const next=clone(layout); const k=key(x,y);
  const current=next.cells?.[k]||{x:Number(x),y:Number(y),terrain:'floor',blocked:false};
  next.cells=next.cells||{};
  next.cells[k]={...current,...clone(patch),x:Number(x),y:Number(y)};
  return {ok:true,layout:next,cell:clone(next.cells[k])};
}

export function getRoomCell(layout,x,y){
  if(!isInsideRoom(layout,x,y)) return null;
  return clone(layout?.cells?.[key(x,y)]||{x:Number(x),y:Number(y),terrain:'floor',blocked:false});
}

export function createWall({id:wallId=id(),x=0,y=0,edge='north',kind='wall',blocksMovement=true,blocksVision=true,coverModifier=0}={}){
  const cover=Number(coverModifier??0);
  return {
    id:String(wallId),x:Number(x),y:Number(y),edge,kind:String(kind||'wall'),
    blocksMovement:Boolean(blocksMovement),blocksVision:Boolean(blocksVision),
    coverModifier:Number.isFinite(cover)?cover:0,
  };
}

export function addWall(layout,wall){
  if(!isInsideRoom(layout,wall?.x,wall?.y)) return {ok:false,reason:'out-of-bounds',layout};
  const next=clone(layout); next.walls=Array.isArray(next.walls)?next.walls:[];
  const duplicate=next.walls.some(w=>Number(w.x)===Number(wall.x)&&Number(w.y)===Number(wall.y)&&String(w.edge)===String(wall.edge));
  if(duplicate) return {ok:false,reason:'wall-exists',layout};
  next.walls.push(clone(wall)); return {ok:true,layout:next};
}

export function createDoor({id:doorId=id(),x=0,y=0,edge='north',kind='door',state='closed',entry=false,exit=false,locked=false,keyItemId=null,linkId=null}={}){
  return {id:String(doorId),x:Number(x),y:Number(y),edge,kind,state,entry:Boolean(entry),exit:Boolean(exit),locked:Boolean(locked),keyItemId:keyItemId?String(keyItemId):null,linkId:linkId?String(linkId):null};
}

export function addDoor(layout,door){
  if(!isInsideRoom(layout,door?.x,door?.y)) return {ok:false,reason:'out-of-bounds',layout};
  const next=clone(layout); next.doors=Array.isArray(next.doors)?next.doors:[];
  const duplicate=next.doors.some(d=>Number(d.x)===Number(door.x)&&Number(d.y)===Number(door.y)&&String(d.edge)===String(door.edge));
  if(duplicate) return {ok:false,reason:'door-exists',layout};
  next.doors.push(clone(door)); return {ok:true,layout:next};
}

export function createMarker({id:markerId=id(),x=0,y=0,kind='special',label='',data={}}={}){
  return {id:String(markerId),x:Number(x),y:Number(y),kind,label,data:clone(data)};
}

export function addMarker(layout,marker){
  if(!isInsideRoom(layout,marker?.x,marker?.y)) return {ok:false,reason:'out-of-bounds',layout};
  const next=clone(layout); next.markers=Array.isArray(next.markers)?next.markers:[];
  next.markers.push(clone(marker)); return {ok:true,layout:next};
}

export function resizeRoomLayout(layout,{width,height}={}){
  const size=normalizeRoomDimensions({width:width??layout.width,height:height??layout.height});
  const next=clone(layout); next.width=size.width; next.height=size.height;
  next.cells=Object.fromEntries(Object.entries(next.cells||{}).filter(([,cell])=>isInsideRoom(next,cell.x,cell.y)));
  next.walls=(next.walls||[]).filter(x=>isInsideRoom(next,x.x,x.y));
  next.doors=(next.doors||[]).filter(x=>isInsideRoom(next,x.x,x.y));
  next.markers=(next.markers||[]).filter(x=>isInsideRoom(next,x.x,x.y));
  return next;
}

export function validateRoomLayout(layout){
  const errors=[];
  const size=normalizeRoomDimensions(layout||{});
  if(Number(layout?.width)!==size.width||Number(layout?.height)!==size.height) errors.push({code:'invalid-dimensions'});
  for(const cell of Object.values(layout?.cells||{})) if(!isInsideRoom(layout,cell.x,cell.y)) errors.push({code:'cell-out-of-bounds',x:cell.x,y:cell.y});
  for(const wall of layout?.walls||[]) if(!isInsideRoom(layout,wall.x,wall.y)) errors.push({code:'wall-out-of-bounds',id:wall.id});
  for(const door of layout?.doors||[]) if(!isInsideRoom(layout,door.x,door.y)) errors.push({code:'door-out-of-bounds',id:door.id});
  for(const marker of layout?.markers||[]) if(!isInsideRoom(layout,marker.x,marker.y)) errors.push({code:'marker-out-of-bounds',id:marker.id});
  return {valid:errors.length===0,errors};
}