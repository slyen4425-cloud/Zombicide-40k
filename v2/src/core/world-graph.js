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
