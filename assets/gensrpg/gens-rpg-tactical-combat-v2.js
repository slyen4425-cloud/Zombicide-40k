/* GenSrpG Tactical Combat V2 — isolated RPG combat engine foundation.
   Pure state engine: no DOM, no timers, no localStorage, no legacy combat wrappers.
   Designed for deterministic mobile-friendly grid combat. */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="0.1.0";
  const APP_VERSION="16.78.103";
  const SIDE_HERO="hero";
  const SIDE_ENEMY="enemy";
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];

  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const key=(x,y)=>`${x},${y}`;
  const copy=v=>JSON.parse(JSON.stringify(v));
  const sameCell=(a,b)=>!!a&&!!b&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y);

  function normalizeGrid(grid={}){
    const width=clamp(Math.trunc(num(grid.width,10)),4,40);
    const height=clamp(Math.trunc(num(grid.height,8)),4,40);
    const blocked=new Set();
    for(const p of Array.isArray(grid.blocked)?grid.blocked:[]){
      const x=Math.trunc(num(p?.x,-1)),y=Math.trunc(num(p?.y,-1));
      if(x>=0&&y>=0&&x<width&&y<height)blocked.add(key(x,y));
    }
    return {width,height,blocked:[...blocked].map(s=>{const [x,y]=s.split(",").map(Number);return {x,y}})};
  }

  function normalizeAttack(a={},index=0){
    const minRange=Math.max(0,Math.trunc(num(a.minRange,0)));
    const maxRange=Math.max(minRange,Math.trunc(num(a.maxRange??a.range,1)));
    return {
      id:String(a.id||`attack_${index+1}`),
      name:String(a.name||"Attaque"),
      minRange,
      maxRange,
      hit:clamp(num(a.hit,70),5,100),
      power:Math.max(0,num(a.power??a.damage,1)),
      damageType:String(a.damageType||"physical"),
      ignoreArmor:!!a.ignoreArmor,
      actionCost:Math.max(1,Math.trunc(num(a.actionCost,1))),
      lineOfSight:a.lineOfSight!==false,
      tags:Array.isArray(a.tags)?a.tags.map(String):[]
    };
  }

  function normalizeActor(a={},index=0){
    const maxHp=Math.max(1,num(a.maxHp??a.hp,1));
    const side=a.side===SIDE_ENEMY?SIDE_ENEMY:SIDE_HERO;
    return {
      id:String(a.id||`${side}_${index+1}`),
      name:String(a.name||a.id||`${side} ${index+1}`),
      side,
      x:Math.trunc(num(a.x,side===SIDE_HERO?0:5)),
      y:Math.trunc(num(a.y,index)),
      hp:clamp(num(a.hp,maxHp),0,maxHp),
      maxHp,
      movement:Math.max(0,Math.trunc(num(a.movement,3))),
      initiative:num(a.initiative,10),
      defense:num(a.defense,10),
      armor:Math.max(0,num(a.armor,0)),
      dodge:clamp(num(a.dodge,0),0,95),
      alive:a.alive!==false&&num(a.hp,maxHp)>0,
      movementLeft:0,
      actionsLeft:0,
      attacks:(Array.isArray(a.attacks)&&a.attacks.length?a.attacks:[{}]).map(normalizeAttack),
      meta:a.meta&&typeof a.meta==="object"?copy(a.meta):{}
    };
  }

  function actorById(state,id){return state.actors.find(a=>a.id===String(id))||null}
  function inBounds(state,x,y){return x>=0&&y>=0&&x<state.grid.width&&y<state.grid.height}
  function blockedSet(state){return new Set((state.grid.blocked||[]).map(p=>key(p.x,p.y)))}
  function occupantAt(state,x,y,ignoreId=""){
    return state.actors.find(a=>a.alive&&a.id!==ignoreId&&a.x===x&&a.y===y)||null;
  }
  function isWalkable(state,x,y,ignoreId=""){
    return inBounds(state,x,y)&&!blockedSet(state).has(key(x,y))&&!occupantAt(state,x,y,ignoreId);
  }
  function distance(a,b){return Math.abs(num(a?.x)-num(b?.x))+Math.abs(num(a?.y)-num(b?.y))}

  function initiativeOrder(actors){
    return actors.filter(a=>a.alive).slice().sort((a,b)=>{
      const d=num(b.initiative)-num(a.initiative);
      if(d)return d;
      if(a.side!==b.side)return a.side===SIDE_HERO?-1:1;
      return String(a.id).localeCompare(String(b.id));
    }).map(a=>a.id);
  }

  function createBattle(input={}){
    const grid=normalizeGrid(input.grid||{});
    const actors=(Array.isArray(input.actors)?input.actors:[]).map(normalizeActor);
    const ids=new Set();
    for(const a of actors){
      if(ids.has(a.id))throw new Error(`Duplicate actor id: ${a.id}`);
      ids.add(a.id);
      if(!inGrid(grid,a.x,a.y))throw new Error(`Actor outside grid: ${a.id}`);
      if(grid.blocked.some(p=>p.x===a.x&&p.y===a.y))throw new Error(`Actor on blocked cell: ${a.id}`);
    }
    for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
      if(actors[i].alive&&actors[j].alive&&sameCell(actors[i],actors[j]))throw new Error(`Actors share cell: ${actors[i].id}/${actors[j].id}`);
    }
    const order=initiativeOrder(actors);
    const state={
      version:VERSION,
      appVersion:APP_VERSION,
      id:String(input.id||`battle_${Date.now().toString(36)}`),
      grid,
      actors,
      round:1,
      turnIndex:0,
      order,
      status:"active",
      winner:null,
      log:[],
      rngSeed:Math.trunc(num(input.rngSeed,0))>>>0,
      config:{actionsPerTurn:Math.max(1,Math.trunc(num(input.config?.actionsPerTurn,1)))}
    };
    if(!order.length){state.status="ended";state.winner="none";return state}
    refreshOutcome(state);
    if(state.status==="active")beginTurn(state,order[0]);
    return state;
  }

  function inGrid(grid,x,y){return x>=0&&y>=0&&x<grid.width&&y<grid.height}

  function beginTurn(state,id){
    const a=actorById(state,id);
    if(!a||!a.alive)return false;
    a.movementLeft=a.movement;
    a.actionsLeft=state.config.actionsPerTurn;
    state.log.push({type:"turn",round:state.round,actorId:a.id});
    return true;
  }

  function currentActor(state){
    if(state.status!=="active"||!state.order.length)return null;
    return actorById(state,state.order[state.turnIndex])||null;
  }

  function neighbors(state,p,ignoreId=""){
    const out=[];
    for(const [dx,dy] of DIRS){const x=p.x+dx,y=p.y+dy;if(isWalkable(state,x,y,ignoreId))out.push({x,y})}
    return out;
  }

  function shortestPath(state,actorId,target){
    const a=actorById(state,actorId);if(!a||!a.alive)return null;
    const tx=Math.trunc(num(target?.x,-1)),ty=Math.trunc(num(target?.y,-1));
    if(!inBounds(state,tx,ty))return null;
    if(tx===a.x&&ty===a.y)return [{x:a.x,y:a.y}];
    if(!isWalkable(state,tx,ty,a.id))return null;
    const start={x:a.x,y:a.y},q=[start],prev=new Map([[key(start.x,start.y),null]]);
    for(let qi=0;qi<q.length;qi++){
      const p=q[qi];
      for(const n of neighbors(state,p,a.id)){
        const k=key(n.x,n.y);if(prev.has(k))continue;
        prev.set(k,p);q.push(n);
        if(n.x===tx&&n.y===ty){
          const path=[n];let cur=p;
          while(cur){path.push(cur);cur=prev.get(key(cur.x,cur.y))||null}
          path.reverse();return path;
        }
      }
    }
    return null;
  }

  function reachableCells(state,actorId,maxSteps=null){
    const a=actorById(state,actorId);if(!a||!a.alive)return [];
    const limit=Math.max(0,Math.trunc(maxSteps==null?a.movementLeft:num(maxSteps,0)));
    const q=[{x:a.x,y:a.y,d:0}],seen=new Map([[key(a.x,a.y),0]]);
    for(let qi=0;qi<q.length;qi++){
      const p=q[qi];if(p.d>=limit)continue;
      for(const n of neighbors(state,p,a.id)){
        const k=key(n.x,n.y),d=p.d+1;if(seen.has(k)&&seen.get(k)<=d)continue;
        seen.set(k,d);q.push({x:n.x,y:n.y,d});
      }
    }
    return [...seen.entries()].map(([k,d])=>{const [x,y]=k.split(",").map(Number);return {x,y,cost:d}}).sort((a,b)=>a.cost-b.cost||a.y-b.y||a.x-b.x);
  }

  function moveActor(state,actorId,target){
    if(state.status!=="active")return {ok:false,reason:"battle-ended"};
    const cur=currentActor(state);if(!cur||cur.id!==String(actorId))return {ok:false,reason:"not-current-actor"};
    const path=shortestPath(state,actorId,target);if(!path)return {ok:false,reason:"unreachable"};
    const cost=Math.max(0,path.length-1);if(cost>cur.movementLeft)return {ok:false,reason:"insufficient-movement",cost};
    cur.x=Math.trunc(target.x);cur.y=Math.trunc(target.y);cur.movementLeft-=cost;
    state.log.push({type:"move",actorId:cur.id,x:cur.x,y:cur.y,cost});
    return {ok:true,cost,path};
  }

  function bresenham(a,b){
    let x0=Math.trunc(a.x),y0=Math.trunc(a.y),x1=Math.trunc(b.x),y1=Math.trunc(b.y);
    const points=[],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;
    while(true){points.push({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
    return points;
  }

  function lineOfSight(state,from,to,{ignoreActors=false}={}){
    const pts=bresenham(from,to);if(pts.length<=2)return {clear:true,cover:0,blockedAt:null};
    const blocked=blockedSet(state);let cover=0;
    for(let i=1;i<pts.length-1;i++){
      const p=pts[i];
      if(blocked.has(key(p.x,p.y)))return {clear:false,cover:100,blockedAt:p};
      if(!ignoreActors&&occupantAt(state,p.x,p.y))cover=Math.max(cover,20);
    }
    return {clear:true,cover,blockedAt:null};
  }

  function getAttack(actor,attackId){return actor?.attacks?.find(a=>a.id===String(attackId))||actor?.attacks?.[0]||null}

  function attackPreview(state,attackerId,targetId,attackId){
    const attacker=actorById(state,attackerId),target=actorById(state,targetId);
    if(!attacker||!target)return {ok:false,reason:"actor-missing"};
    if(!attacker.alive||!target.alive)return {ok:false,reason:"actor-defeated"};
    if(attacker.side===target.side)return {ok:false,reason:"same-side"};
    const attack=getAttack(attacker,attackId);if(!attack)return {ok:false,reason:"attack-missing"};
    const d=distance(attacker,target);
    if(d<attack.minRange||d>attack.maxRange)return {ok:false,reason:"out-of-range",distance:d,minRange:attack.minRange,maxRange:attack.maxRange};
    const los=attack.lineOfSight?lineOfSight(state,attacker,target):{clear:true,cover:0,blockedAt:null};
    if(!los.clear)return {ok:false,reason:"line-of-sight",distance:d,los};
    const defensePenalty=Math.max(0,num(target.defense,0));
    const dodgePenalty=Math.max(0,num(target.dodge,0));
    const hitChance=clamp(num(attack.hit,70)-defensePenalty-dodgePenalty-los.cover,5,95);
    const armor=attack.ignoreArmor?0:Math.max(0,num(target.armor,0));
    const damage=Math.max(0,Math.round(num(attack.power,1)-armor));
    return {ok:true,attack,distance:d,los,hitChance,damage,armor};
  }

  function nextRandom(state){
    // Mulberry32 when a seed is supplied, Math.random fallback otherwise.
    if(!state.rngSeed)return Math.random();
    let t=state.rngSeed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;
  }

  function resolveAttack(state,attackerId,targetId,attackId,forcedRoll=null){
    if(state.status!=="active")return {ok:false,reason:"battle-ended"};
    const cur=currentActor(state);if(!cur||cur.id!==String(attackerId))return {ok:false,reason:"not-current-actor"};
    if(cur.actionsLeft<1)return {ok:false,reason:"no-action"};
    const preview=attackPreview(state,attackerId,targetId,attackId);if(!preview.ok)return preview;
    const target=actorById(state,targetId);
    const roll=forcedRoll==null?Math.floor(nextRandom(state)*100)+1:clamp(Math.trunc(num(forcedRoll,100)),1,100);
    const hit=roll<=preview.hitChance;
    const damage=hit?preview.damage:0;
    if(damage>0){target.hp=clamp(target.hp-damage,0,target.maxHp);if(target.hp<=0)target.alive=false}
    cur.actionsLeft-=1;
    const result={ok:true,hit,roll,hitChance:preview.hitChance,damage,targetHp:target.hp,targetDefeated:!target.alive,attackId:preview.attack.id,attackerId:cur.id,targetId:target.id};
    state.log.push({type:"attack",...result});
    refreshOutcome(state);
    return result;
  }

  function refreshOutcome(state){
    const heroes=state.actors.some(a=>a.side===SIDE_HERO&&a.alive);
    const enemies=state.actors.some(a=>a.side===SIDE_ENEMY&&a.alive);
    if(!heroes||!enemies){state.status="ended";state.winner=heroes&&!enemies?SIDE_HERO:enemies&&!heroes?SIDE_ENEMY:"none";state.order=[];state.turnIndex=0;return state.winner}
    return null;
  }

  function endTurn(state){
    if(state.status!=="active")return {ok:false,reason:"battle-ended"};
    const previous=currentActor(state);if(!previous)return {ok:false,reason:"no-current-actor"};
    previous.movementLeft=0;previous.actionsLeft=0;
    const aliveIds=new Set(state.actors.filter(a=>a.alive).map(a=>a.id));
    state.order=state.order.filter(id=>aliveIds.has(id));
    if(!state.order.length){refreshOutcome(state);return {ok:false,reason:"battle-ended"}}
    let nextIndex=state.turnIndex+1;
    if(nextIndex>=state.order.length){state.round+=1;state.order=initiativeOrder(state.actors);nextIndex=0}
    state.turnIndex=nextIndex;
    const next=currentActor(state);if(next)beginTurn(state,next.id);
    return {ok:true,previousId:previous.id,nextId:next?.id||null,round:state.round};
  }

  function nearestEnemy(state,actor){
    return state.actors.filter(a=>a.alive&&a.side!==actor.side).sort((a,b)=>distance(actor,a)-distance(actor,b)||num(a.hp)-num(b.hp)||String(a.id).localeCompare(String(b.id)))[0]||null;
  }

  function bestAttack(state,actor,target){
    return actor.attacks.map(a=>({a,p:attackPreview(state,actor.id,target.id,a.id)})).filter(x=>x.p.ok).sort((x,y)=>y.p.damage-x.p.damage||y.p.hitChance-x.p.hitChance||x.p.distance-y.p.distance)[0]||null;
  }

  function aiStep(state,actorId=currentActor(state)?.id){
    const actor=actorById(state,actorId);if(!actor||!actor.alive||actor.side!==SIDE_ENEMY)return {ok:false,reason:"not-ai-actor"};
    if(currentActor(state)?.id!==actor.id)return {ok:false,reason:"not-current-actor"};
    let target=nearestEnemy(state,actor);if(!target)return {ok:false,reason:"no-target"};
    let choice=bestAttack(state,actor,target);
    if(choice&&actor.actionsLeft>0){const attack=resolveAttack(state,actor.id,target.id,choice.a.id);if(state.status==="active")endTurn(state);return {ok:true,type:"attack",attack}}
    const cells=reachableCells(state,actor.id).filter(c=>c.cost>0);
    if(cells.length){
      let best=null;
      for(const cell of cells){
        const fake={x:cell.x,y:cell.y};
        const score=distance(fake,target);
        if(!best||score<best.score||(score===best.score&&cell.cost<best.cell.cost))best={cell,score};
      }
      if(best)moveActor(state,actor.id,best.cell);
    }
    target=nearestEnemy(state,actor);choice=target?bestAttack(state,actor,target):null;
    let attack=null;if(choice&&actor.actionsLeft>0)attack=resolveAttack(state,actor.id,target.id,choice.a.id);
    if(state.status==="active")endTurn(state);
    return {ok:true,type:attack?"move-attack":"move",attack,position:{x:actor.x,y:actor.y}};
  }

  function snapshot(state){
    return copy({
      version:state.version,appVersion:state.appVersion,id:state.id,grid:state.grid,actors:state.actors,
      round:state.round,turnIndex:state.turnIndex,order:state.order,status:state.status,winner:state.winner,config:state.config,log:state.log
    });
  }

  return {
    VERSION,APP_VERSION,SIDE_HERO,SIDE_ENEMY,
    createBattle,currentActor,actorById,distance,initiativeOrder,shortestPath,reachableCells,moveActor,
    bresenham,lineOfSight,attackPreview,resolveAttack,endTurn,aiStep,refreshOutcome,snapshot
  };
});
