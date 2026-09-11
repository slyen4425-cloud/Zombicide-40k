function clone(value){return structuredClone(value);}

function key(x,y){return `${Number(x)},${Number(y)}`;}

export function normalizeSpatialConfig(config={}){
  return {
    enabled: config.enabled !== false,
    unit: config.unit || 'cases',
    diagonal: Boolean(config.diagonal),
    movementStatId: config.movementStatId || null,
    defaultMovement: Math.max(0, Number(config.defaultMovement ?? 3) || 0),
    combatAssistRange: Math.max(0, Number(config.combatAssistRange ?? 3) || 0),
    requireSameZone: config.requireSameZone !== false,
  };
}

export function createSpatialState({zoneId='zone-1',positions={}}={}){
  return {zoneId:String(zoneId),positions:clone(positions),blocked:[]};
}

export function setBlockedCells(spatial,cells=[]){
  const next=clone(spatial);
  next.blocked=[...new Set(cells.map(c=>key(c.x,c.y)))];
  return next;
}

export function setActorPosition(spatial,actorId,position={}){
  const next=clone(spatial);
  next.positions=next.positions||{};
  next.positions[String(actorId)]={
    x:Number(position.x)||0,
    y:Number(position.y)||0,
    zoneId:String(position.zoneId ?? next.zoneId ?? 'zone-1'),
  };
  return next;
}

export function getActorPosition(spatial,actorId){
  return spatial?.positions?.[String(actorId)]||null;
}

function neighbors(x,y,diagonal=false){
  const list=[[1,0],[-1,0],[0,1],[0,-1]];
  if(diagonal) list.push([1,1],[1,-1],[-1,1],[-1,-1]);
  return list.map(([dx,dy])=>({x:x+dx,y:y+dy}));
}

export function shortestPathDistance(spatial,from,to,{diagonal=false,maxDistance=999}={}){
  if(!from||!to) return Infinity;
  if(String(from.zoneId??spatial?.zoneId)!==String(to.zoneId??spatial?.zoneId)) return Infinity;
  const blocked=new Set(spatial?.blocked||[]);
  const start=key(from.x,from.y), goal=key(to.x,to.y);
  if(start===goal) return 0;
  const queue=[{x:Number(from.x)||0,y:Number(from.y)||0,d:0}];
  const seen=new Set([start]);
  while(queue.length){
    const cur=queue.shift();
    if(cur.d>=maxDistance) continue;
    for(const n of neighbors(cur.x,cur.y,diagonal)){
      const k=key(n.x,n.y);
      if(blocked.has(k)||seen.has(k)) continue;
      const d=cur.d+1;
      if(k===goal) return d;
      seen.add(k); queue.push({x:n.x,y:n.y,d});
    }
  }
  return Infinity;
}

export function actorMovementAllowance(actor={},config={}){
  const c=normalizeSpatialConfig(config);
  if(!c.enabled) return Infinity;
  const stat=c.movementStatId ? Number(actor?.state?.stats?.[c.movementStatId]) : NaN;
  return Number.isFinite(stat) ? Math.max(0,stat) : c.defaultMovement;
}

export function canActorReach(spatial,actorId,target,config={}){
  const from=getActorPosition(spatial,actorId);
  const actor=config.actor||{};
  const allowance=actorMovementAllowance(actor,config);
  const distance=shortestPathDistance(spatial,from,target,{diagonal:Boolean(config.diagonal),maxDistance:allowance});
  return {ok:Number.isFinite(distance)&&distance<=allowance,distance,allowance};
}

export function moveActor(spatial,actorId,target,config={}){
  const check=canActorReach(spatial,actorId,target,config);
  if(!check.ok) return {moved:false,reason:'out-of-range',spatial,distance:check.distance,allowance:check.allowance};
  return {moved:true,spatial:setActorPosition(spatial,actorId,target),distance:check.distance,allowance:check.allowance};
}

export function combatParticipants(spatial,engagerId,actorIds=[],config={}){
  const c=normalizeSpatialConfig(config);
  if(!c.enabled) return [...actorIds];
  const engager=getActorPosition(spatial,engagerId);
  if(!engager) return [];
  return actorIds.filter(id=>{
    const pos=getActorPosition(spatial,id);
    if(!pos) return false;
    if(c.requireSameZone&&String(pos.zoneId)!==String(engager.zoneId)) return false;
    const distance=shortestPathDistance(spatial,engager,pos,{diagonal:c.diagonal,maxDistance:c.combatAssistRange});
    return Number.isFinite(distance)&&distance<=c.combatAssistRange;
  });
}
