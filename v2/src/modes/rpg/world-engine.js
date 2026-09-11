import { inventoryQuantity } from './inventory-engine.js';

function clone(value){return structuredClone(value);}
function id(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function createWorld({id:worldId=id(),name='Nouveau monde',startRoomId=null,zones=[]}={}){
  return {id:String(worldId),name,zones:clone(zones),startRoomId:startRoomId?String(startRoomId):null};
}

export function createZone({id:zoneId=id(),name='Nouvelle zone',roomIds=[]}={}){
  return {id:String(zoneId),name,roomIds:[...roomIds].map(String)};
}

export function createRoom({id:roomId=id(),zoneId=null,name='Nouvelle salle',kind='room',links=[],metadata={}}={}){
  return {id:String(roomId),zoneId:zoneId?String(zoneId):null,name,kind,links:clone(links),metadata:clone(metadata)};
}

export function createRoomLink({id:linkId=id(),fromRoomId,toRoomId,label='Passage',direction='forward',conditions=[],oneWay=false,enabled=true,requiredItemId=null}={}){
  return {
    id:String(linkId),fromRoomId:String(fromRoomId),toRoomId:String(toRoomId),label,direction,
    conditionIds:[...conditions].map(String),oneWay:Boolean(oneWay),enabled:enabled!==false,
    requiredItemId:requiredItemId==null?null:String(requiredItemId),
  };
}

export function buildWorldIndex({world=null,zones=[],rooms=[],links=[]}={}){
  return {
    world:world?clone(world):null,
    zones:Object.fromEntries((zones||[]).map(z=>[String(z.id),clone(z)])),
    rooms:Object.fromEntries((rooms||[]).map(r=>[String(r.id),clone(r)])),
    links:Object.fromEntries((links||[]).map(l=>[String(l.id),clone(l)])),
  };
}

export function validateWorld(index){
  const errors=[];
  if(!index?.world) errors.push({code:'missing-world'});
  const roomIds=new Set(Object.keys(index?.rooms||{}));
  for(const zone of Object.values(index?.zones||{})){
    for(const roomId of zone.roomIds||[]) if(!roomIds.has(String(roomId))) errors.push({code:'zone-room-missing',zoneId:zone.id,roomId:String(roomId)});
  }
  for(const room of Object.values(index?.rooms||{})){
    if(room.zoneId&&!index.zones?.[String(room.zoneId)]) errors.push({code:'room-zone-missing',roomId:room.id,zoneId:String(room.zoneId)});
  }
  for(const link of Object.values(index?.links||{})){
    if(!roomIds.has(String(link.fromRoomId))) errors.push({code:'link-from-missing',linkId:link.id,roomId:String(link.fromRoomId)});
    if(!roomIds.has(String(link.toRoomId))) errors.push({code:'link-to-missing',linkId:link.id,roomId:String(link.toRoomId)});
  }
  if(index?.world?.startRoomId&&!roomIds.has(String(index.world.startRoomId))) errors.push({code:'start-room-missing',roomId:String(index.world.startRoomId)});
  return {valid:errors.length===0,errors};
}

export function createWorldSession(index,{startRoomId=null}={}){
  const roomId=String(startRoomId||index?.world?.startRoomId||'');
  if(!roomId||!index?.rooms?.[roomId]) return {ok:false,reason:'missing-start-room',session:null};
  return {ok:true,session:{worldId:String(index.world.id),currentRoomId:roomId,visitedRoomIds:[roomId],history:[],flags:{},openedLinks:[],sequence:0}};
}

export function availableRoomLinks(index,session,{conditionEvaluator=null,inventory=null}={}){
  const current=String(session?.currentRoomId||'');
  return Object.values(index?.links||{}).filter(link=>{
    if(link.enabled===false) return false;
    const forward=String(link.fromRoomId)===current;
    const reverse=!link.oneWay&&String(link.toRoomId)===current;
    if(!forward&&!reverse) return false;
    if(link.requiredItemId&&inventoryQuantity(inventory,link.requiredItemId)<=0) return false;
    if(typeof conditionEvaluator==='function'&&(link.conditionIds||[]).some(conditionId=>!conditionEvaluator(conditionId,session))) return false;
    return true;
  }).map(link=>({
    ...clone(link),
    targetRoomId:String(link.fromRoomId)===current?String(link.toRoomId):String(link.fromRoomId),
    traversal:String(link.fromRoomId)===current?'forward':'reverse',
  }));
}

export function traverseRoomLink(index,session,linkId,{conditionEvaluator=null,inventory=null}={}){
  const link=availableRoomLinks(index,session,{conditionEvaluator,inventory}).find(x=>String(x.id)===String(linkId));
  if(!link) return {ok:false,reason:'link-unavailable',session};
  if(!index.rooms?.[String(link.targetRoomId)]) return {ok:false,reason:'target-room-missing',session};
  const next=clone(session);
  const from=String(next.currentRoomId);
  const to=String(link.targetRoomId);
  next.sequence=Number(next.sequence)||0;
  next.sequence+=1;
  next.history=Array.isArray(next.history)?next.history:[];
  next.history.push({seq:next.sequence,fromRoomId:from,toRoomId:to,linkId:String(link.id),traversal:link.traversal});
  next.currentRoomId=to;
  next.visitedRoomIds=Array.isArray(next.visitedRoomIds)?next.visitedRoomIds:[];
  if(!next.visitedRoomIds.includes(to)) next.visitedRoomIds.push(to);
  return {ok:true,session:next,room:clone(index.rooms[to]),link};
}

export function returnToPreviousRoom(index,session){
  const history=Array.isArray(session?.history)?session.history:[];
  if(!history.length) return {ok:false,reason:'no-history',session};
  const last=history[history.length-1];
  if(!index?.rooms?.[String(last.fromRoomId)]) return {ok:false,reason:'previous-room-missing',session};
  const next=clone(session);
  next.history.pop();
  next.currentRoomId=String(last.fromRoomId);
  next.sequence=(Number(next.sequence)||0)+1;
  return {ok:true,session:next,room:clone(index.rooms[next.currentRoomId])};
}
