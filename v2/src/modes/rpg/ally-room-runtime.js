import { setActorPosition } from './spatial-engine.js';

function clone(value){return structuredClone(value);}

function isActive(runtime){return runtime&&runtime.active!==false&&!runtime.dismissed&&!runtime.expired;}

export function alliesInRoom(roster,roomId){
  return (roster?.order||[]).map(id=>roster.actors?.[id]).filter(runtime=>isActive(runtime)&&String(runtime.roomId??'')===String(roomId??''));
}

export function transitionAlliesWithOwner(roster,spatial,{ownerActorId,fromRoomId,toRoomId,entryPosition={x:0,y:0},ownerPosition=null}={}){
  const nextRoster=clone(roster); let nextSpatial=clone(spatial); const moved=[]; const stayed=[];
  for(const id of nextRoster.order||[]){
    const runtime=nextRoster.actors?.[id]; if(!isActive(runtime)) continue;
    const follows=runtime.followOwner!==false&&runtime.ownerActorId&&String(runtime.ownerActorId)===String(ownerActorId);
    const inOrigin=String(runtime.roomId??'')===String(fromRoomId??'');
    if(!follows||!inOrigin){stayed.push(String(id));continue;}
    const position=ownerPosition||entryPosition||{x:0,y:0};
    runtime.roomId=String(toRoomId);
    runtime.x=Number(position.x)||0; runtime.y=Number(position.y)||0;
    nextSpatial=setActorPosition(nextSpatial,String(id),{x:runtime.x,y:runtime.y,zoneId:String(toRoomId)});
    moved.push(String(id));
  }
  return {roster:nextRoster,spatial:nextSpatial,movedInstanceIds:moved,stayedInstanceIds:stayed};
}

export function transitionIndependentAllies(roster,{fromRoomId,toRoomId,instanceIds=[]}={}){
  const next=clone(roster); const moved=[];
  for(const rawId of instanceIds||[]){
    const id=String(rawId); const runtime=next.actors?.[id];
    if(!isActive(runtime)||String(runtime.roomId??'')!==String(fromRoomId??'')) continue;
    runtime.roomId=String(toRoomId); runtime.x=null; runtime.y=null; moved.push(id);
  }
  return {roster:next,movedInstanceIds:moved};
}

export function finishRoomForAllies(roster,roomId){
  const next=clone(roster); const expired=[];
  next.history=Array.isArray(next.history)?next.history:[];
  for(const id of next.order||[]){
    const runtime=next.actors?.[id];
    if(!runtime||runtime.expired||runtime.dismissed||runtime.durationKind!=='room'||runtime.remaining==null) continue;
    if(String(runtime.roomId??'')!==String(roomId??'')) continue;
    runtime.remaining=Math.max(0,Number(runtime.remaining)-1);
    if(runtime.remaining<=0){
      runtime.expired=true;
      runtime.active=false;
      expired.push(String(id));
      next.history.push({type:'expired',instanceId:String(id),durationKind:'room'});
    }
  }
  return {roster:next,expiredInstanceIds:expired};
}

export function removeExpiredAlliesFromSpatial(roster,spatial){
  const next=clone(spatial); next.positions=next.positions||{}; const removed=[];
  for(const id of roster?.order||[]){
    const runtime=roster.actors?.[id];
    if(runtime&&(runtime.expired||runtime.dismissed||runtime.active===false)&&next.positions[String(id)]){
      delete next.positions[String(id)]; removed.push(String(id));
    }
  }
  return {spatial:next,removedInstanceIds:removed};
}
