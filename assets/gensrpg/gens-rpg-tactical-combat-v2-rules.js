/* GenSrpG Tactical Combat V2 — tactical rules extension.
   Adds cell cover to ranged combat and keeps AI deterministic/no-timer. */
(function(root){
  "use strict";
  const R=root||globalThis,E=R.GensRpgTacticalCombatV2;if(!E)return;
  if(E.__gensTacticalRules103)return;
  const baseCreate=E.createBattle,basePreview=E.attackPreview;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const key=(x,y)=>`${x},${y}`;
  function createBattle(input={}){
    const state=baseCreate(input),seen=new Set();
    state.grid.cover=(Array.isArray(input?.grid?.cover)?input.grid.cover:[]).map(p=>({x:Math.trunc(num(p?.x,-1)),y:Math.trunc(num(p?.y,-1))})).filter(p=>p.x>=0&&p.y>=0&&p.x<state.grid.width&&p.y<state.grid.height&&!seen.has(key(p.x,p.y))&&seen.add(key(p.x,p.y)));
    return state;
  }
  function coverAt(state,actor){
    const set=new Set((state?.grid?.cover||[]).map(p=>key(p.x,p.y)));
    return set.has(key(actor?.x,actor?.y))?20:0;
  }
  function preview(state,attackerId,targetId,attackId){
    const p=basePreview(state,attackerId,targetId,attackId);if(!p?.ok)return p;
    const attacker=E.actorById(state,attackerId),target=E.actorById(state,targetId);
    const ranged=!!p.attack?.lineOfSight&&num(p.attack?.maxRange,1)>1;
    const cellCover=ranged?coverAt(state,target):0;
    if(!cellCover)return {...p,cellCover:0,totalCover:num(p.los?.cover,0)};
    return {...p,cellCover,totalCover:num(p.los?.cover,0)+cellCover,hitChance:clamp(num(p.hitChance,5)-cellCover,5,95),attacker,target};
  }
  function nextRandom(state){
    if(!state.rngSeed)return Math.random();
    let t=state.rngSeed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;
  }
  function resolveAttack(state,attackerId,targetId,attackId,forcedRoll=null){
    if(state.status!=="active")return {ok:false,reason:"battle-ended"};
    const cur=E.currentActor(state);if(!cur||cur.id!==String(attackerId))return {ok:false,reason:"not-current-actor"};
    if(cur.actionsLeft<1)return {ok:false,reason:"no-action"};
    const p=preview(state,attackerId,targetId,attackId);if(!p.ok)return p;
    const target=E.actorById(state,targetId),roll=forcedRoll==null?Math.floor(nextRandom(state)*100)+1:clamp(Math.trunc(num(forcedRoll,100)),1,100);
    const hit=roll<=p.hitChance,damage=hit?p.damage:0;
    if(damage>0){target.hp=clamp(target.hp-damage,0,target.maxHp);if(target.hp<=0)target.alive=false}
    cur.actionsLeft-=1;
    const result={ok:true,hit,roll,hitChance:p.hitChance,damage,targetHp:target.hp,targetDefeated:!target.alive,attackId:p.attack.id,attackerId:cur.id,targetId:target.id,cellCover:p.cellCover||0,totalCover:p.totalCover||0};
    state.log.push({type:"attack",...result});E.refreshOutcome(state);return result;
  }
  function nearestEnemy(state,actor){return state.actors.filter(a=>a.alive&&a.side!==actor.side).sort((a,b)=>E.distance(actor,a)-E.distance(actor,b)||num(a.hp)-num(b.hp)||String(a.id).localeCompare(String(b.id)))[0]||null}
  function bestAttack(state,actor,target){return (actor.attacks||[]).map(a=>({a,p:preview(state,actor.id,target.id,a.id)})).filter(x=>x.p.ok).sort((x,y)=>y.p.damage-x.p.damage||y.p.hitChance-x.p.hitChance||x.p.distance-y.p.distance)[0]||null}
  function aiStep(state,actorId=E.currentActor(state)?.id){
    const actor=E.actorById(state,actorId);if(!actor||!actor.alive||actor.side!==E.SIDE_ENEMY)return {ok:false,reason:"not-ai-actor"};
    if(E.currentActor(state)?.id!==actor.id)return {ok:false,reason:"not-current-actor"};
    let target=nearestEnemy(state,actor),choice=target?bestAttack(state,actor,target):null;
    if(choice&&actor.actionsLeft>0){const attack=resolveAttack(state,actor.id,target.id,choice.a.id);if(state.status==="active")E.endTurn(state);return {ok:true,type:"attack",attack}}
    const cells=E.reachableCells(state,actor.id).filter(c=>c.cost>0);let best=null;
    for(const cell of cells){const d=target?E.distance(cell,target):999,cover=coverAt(state,cell);const score=d*100-cover*2+cell.cost;if(!best||score<best.score)best={cell,score}}
    if(best)E.moveActor(state,actor.id,best.cell);
    target=nearestEnemy(state,actor);choice=target?bestAttack(state,actor,target):null;let attack=null;
    if(choice&&actor.actionsLeft>0)attack=resolveAttack(state,actor.id,target.id,choice.a.id);
    if(state.status==="active")E.endTurn(state);
    return {ok:true,type:attack?"move-attack":"move",attack,position:{x:actor.x,y:actor.y}};
  }
  E.createBattle=createBattle;E.attackPreview=preview;E.resolveAttack=resolveAttack;E.aiStep=aiStep;E.coverAt=coverAt;E.__gensTacticalRules103=true;
})(typeof globalThis!=="undefined"?globalThis:this);
