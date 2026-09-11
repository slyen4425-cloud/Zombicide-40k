function key(x,y){return `${Number(x)},${Number(y)}`;}

const DIRS={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]};
const OPP={north:'south',south:'north',east:'west',west:'east'};

function inside(layout,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<Number(layout?.width||0)&&y<Number(layout?.height||0);}
function edgeForStep(from,to){
  const dx=Number(to.x)-Number(from.x),dy=Number(to.y)-Number(from.y);
  if(dx===1&&dy===0) return 'east'; if(dx===-1&&dy===0) return 'west';
  if(dx===0&&dy===1) return 'south'; if(dx===0&&dy===-1) return 'north';
  return null;
}
function featureAt(layout,x,y,edge){
  const door=(layout?.doors||[]).find(d=>Number(d.x)===Number(x)&&Number(d.y)===Number(y)&&String(d.edge)===String(edge));
  if(door) return {type:'door',feature:door};
  const wall=(layout?.walls||[]).find(w=>Number(w.x)===Number(x)&&Number(w.y)===Number(y)&&String(w.edge)===String(edge));
  if(wall) return {type:'wall',feature:wall};
  return null;
}
function transitionFeature(layout,from,to){
  const edge=edgeForStep(from,to); if(!edge) return null;
  return featureAt(layout,from.x,from.y,edge)||featureAt(layout,to.x,to.y,OPP[edge])||null;
}
function doorOpen(door){return String(door?.state||'closed')==='open'&&!door?.locked;}
function finiteModifier(value){const n=Number(value??0);return Number.isFinite(n)?n:0;}

export function roomTransitionAllowed(layout,from,to,{vision=false}={}){
  if(!inside(layout,Number(to.x),Number(to.y))) return false;
  const cell=layout?.cells?.[key(to.x,to.y)];
  if(!vision&&cell?.blocked) return false;
  const found=transitionFeature(layout,from,to); if(!found) return true;
  if(found.type==='door') return doorOpen(found.feature);
  return vision ? found.feature.blocksVision===false : found.feature.blocksMovement===false;
}

export function shortestRoomPathDistance(layout,from,to,{diagonal=false,maxDistance=999}={}){
  if(!from||!to||!inside(layout,Number(from.x),Number(from.y))||!inside(layout,Number(to.x),Number(to.y))) return Infinity;
  if(String(from.zoneId??'')!==String(to.zoneId??'')) return Infinity;
  if(Number(from.x)===Number(to.x)&&Number(from.y)===Number(to.y)) return 0;
  const steps=[[1,0],[-1,0],[0,1],[0,-1]];
  if(diagonal) steps.push([1,1],[1,-1],[-1,1],[-1,-1]);
  const queue=[{x:Number(from.x),y:Number(from.y),d:0}],seen=new Set([key(from.x,from.y)]);
  while(queue.length){
    const cur=queue.shift(); if(cur.d>=maxDistance) continue;
    for(const [dx,dy] of steps){
      const next={x:cur.x+dx,y:cur.y+dy};
      if(!inside(layout,next.x,next.y)) continue;
      if(dx!==0&&dy!==0){
        const midA={x:cur.x+dx,y:cur.y},midB={x:cur.x,y:cur.y+dy};
        if(!roomTransitionAllowed(layout,cur,midA)||!roomTransitionAllowed(layout,cur,midB)) continue;
      } else if(!roomTransitionAllowed(layout,cur,next)) continue;
      const k=key(next.x,next.y); if(seen.has(k)) continue;
      const d=cur.d+1; if(next.x===Number(to.x)&&next.y===Number(to.y)) return d;
      seen.add(k); queue.push({...next,d});
    }
  }
  return Infinity;
}

export function roomLineCells(from,to){
  let x0=Number(from.x),y0=Number(from.y),x1=Number(to.x),y1=Number(to.y);
  const cells=[{x:x0,y:y0}],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1; let err=dx+dy;
  while(x0!==x1||y0!==y1){const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}cells.push({x:x0,y:y0});}
  return cells;
}

export function roomCoverModifier(layout,from,to){
  if(!layout||!from||!to||String(from.zoneId??'')!==String(to.zoneId??'')) return 0;
  const cells=roomLineCells(from,to);
  if(!cells.length) return 0;
  const target=cells[cells.length-1];
  const beforeTarget=cells.length>1?cells[cells.length-2]:null;
  const candidates=[finiteModifier(layout?.cells?.[key(target.x,target.y)]?.coverModifier)];
  if(beforeTarget){
    if(cells.length>2){
      const adjacentCell=layout?.cells?.[key(beforeTarget.x,beforeTarget.y)];
      candidates.push(finiteModifier(adjacentCell?.coverModifier));
    }
    const feature=transitionFeature(layout,beforeTarget,target)?.feature;
    candidates.push(finiteModifier(feature?.coverModifier));
  }
  return Math.min(0,...candidates);
}

export function hasRoomLineOfSight(layout,from,to){
  if(!from||!to||String(from.zoneId??'')!==String(to.zoneId??'')) return false;
  const cells=roomLineCells(from,to);
  for(let i=1;i<cells.length;i++){
    const prev=cells[i-1],cur=cells[i];
    const dx=cur.x-prev.x,dy=cur.y-prev.y;
    if(dx!==0&&dy!==0){
      const stepX={x:cur.x,y:prev.y},stepY={x:prev.x,y:cur.y};
      if(!roomTransitionAllowed(layout,prev,stepX,{vision:true})&&!roomTransitionAllowed(layout,prev,stepY,{vision:true})) return false;
    } else if(!roomTransitionAllowed(layout,prev,cur,{vision:true})) return false;
    const cell=layout?.cells?.[key(cur.x,cur.y)];
    if(i<cells.length-1&&cell?.blocksVision===true) return false;
  }
  return true;
}
