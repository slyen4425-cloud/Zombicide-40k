/* GenSrpG V16.78.114.10 — authoritative tactical runtime fixes.
   Fixes the real seams that V112 could not own reliably:
   - branch-aware room/sub-room combat scopes;
   - enemy vision detection after the actual board interaction/movement seam;
   - one final wall authority using the full Dungeon wall asset;
   - visible D100 animation even when the V111 multi-die renderer replaces the legacy die node.
   Canonical RPG/equipment stats remain snapshotted outside the combat hot loop. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalRuntimeAuthority1678113=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.1.0",APP_VERSION="16.78.114.10";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalRuntimeAuthority1678113Style";
  const DEFAULT_PERCEPTION=3,MAX_SENSE=12,ROLL_DURATION=680;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let installed=false,adapterHooked=false,startHooked=false,clickBound=false,observer=null,maintainQueued=false;
  let moveWrapped=null,eventWrapped=new Map(),lastDetectionSignature="";

  function doc(rt=R){return rt?.document||null}
  function adapter(rt=R){return rt?.GensRpgTacticalCombatV2Adapter||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){
    try{const x=rt?.loadDungeonState?.();if(x?.participants&&x?.last)return x}catch(e){}
    try{const x=JSON.parse(rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2")||"null");return x&&typeof x==="object"?x:null}catch(e){return null}
  }
  function profile(rt=R){try{return rt?.currentRpgProfile?.()||rt?.getActiveGameProfile?.()||null}catch(e){return null}}
  function norm(v){return str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase()}
  function participants(state,rt=R){const p=arr(state?.participants).map(str).filter(Boolean);if(p.length)return p;try{return arr(adapter(rt)?.participants?.(rt)).map(str).filter(Boolean)}catch(e){return []}}
  function activeHeroId(state,rt=R){const p=participants(state,rt),i=clamp(Math.trunc(num(state?.index,0)),0,Math.max(0,p.length-1));return p[i]||""}
  function roomOfHero(state,id){const v=state?.heroRooms?.[id];return v==null?num(state?.room,0):num(v,0)}
  function heroCell(state,id){
    const active=activeHeroId(state);if(str(id)===active&&state?.branch?.active&&Number.isFinite(Number(state?.positions?.[id])))return num(state.positions[id],-1);
    const bs=state?.heroBranchStates?.[id];if(bs?.branch?.active&&Number.isFinite(Number(bs?.cell)))return num(bs.cell,-1);
    return num(state?.positions?.[id],-1);
  }
  function heroEntered(state,id){
    const rawRoom=state?.heroRooms?.[str(id)],room=Number.isFinite(Number(rawRoom))?num(rawRoom,0):0,cell=heroCell(state,id);
    return room>0&&Number.isInteger(cell)&&cell>=0;
  }
  function heroScope(state,id,rt=R){
    id=str(id);const active=activeHeroId(state,rt);let b=null,room=roomOfHero(state,id);
    if(id===active){if(state?.branch?.active)b=state.branch}
    else{const saved=state?.heroBranchStates?.[id];if(saved?.branch?.active){b=saved.branch;room=num(saved?.room??b?.parentRoom,room)}}
    if(b?.active)room=num(b.parentRoom??room,room);
    return {room,branchSourceId:b?.active?str(b.sourceId||b.branchSourceId||""):""};
  }
  function enemyScope(state,enemy){
    const room=num(enemy?.dungeonRoom,state?.room||0);let branch=str(enemy?.dc318BranchSourceId||enemy?.branchSourceId||enemy?.dc200BranchSourceId||"");
    if(!branch&&enemy?.dc200Branch===true&&state?.branch?.active)branch=str(state.branch.sourceId||"");
    return {room,branchSourceId:branch};
  }
  function scopeKey(scope){return `${num(scope?.room,0)}|${str(scope?.branchSourceId)}`}
  function sameScope(a,b){return num(a?.room,0)===num(b?.room,0)&&str(a?.branchSourceId)===str(b?.branchSourceId)}
  function activeScope(state,rt=R){const id=activeHeroId(state,rt);return id?heroScope(state,id,rt):{room:num(state?.room,0),branchSourceId:str(state?.branch?.active?state.branch.sourceId:"")}}

  function mapInfo(state){
    const map=state?.last?.map||{},cells=arr(map.cells);let width=Math.trunc(num(map.width??map.size,0));
    if(width<1)width=Math.max(1,Math.round(Math.sqrt(cells.length||1)));
    let height=Math.trunc(num(map.height,0));if(height<1)height=Math.max(1,Math.ceil((cells.length||width)/width));
    return {map,cells,width,height};
  }
  function cellXY(state,cell){const m=mapInfo(state),i=Math.trunc(num(cell,-1));return i>=0&&i<m.width*m.height?{x:i%m.width,y:Math.floor(i/m.width)}:null}
  function xyCell(state,x,y){const m=mapInfo(state);return x>=0&&y>=0&&x<m.width&&y<m.height?y*m.width+x:-1}
  function blockedCell(state,cell){const m=mapInfo(state),t=norm(m.cells[Math.trunc(num(cell,-1))]||"");return t==="wall"||t==="void"||t==="blocked"}
  function bresenham(a,b){let x0=a.x|0,y0=a.y|0,x1=b.x|0,y1=b.y|0;const out=[],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;while(true){out.push({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}return out}
  function lineOfSightCells(state,aCell,bCell){const a=cellXY(state,aCell),b=cellXY(state,bCell);if(!a||!b)return false;const pts=bresenham(a,b);for(let i=1;i<pts.length-1;i++){const c=xyCell(state,pts[i].x,pts[i].y);if(c<0||blockedCell(state,c))return false}return true}
  function manhattan(state,aCell,bCell){const a=cellXY(state,aCell),b=cellXY(state,bCell);return !a||!b?Infinity:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
  function pathDistance(state,aCell,bCell,limit=MAX_SENSE){
    const a=Math.trunc(num(aCell,-1)),b=Math.trunc(num(bCell,-1));if(a<0||b<0)return Infinity;if(a===b)return 0;const max=Math.max(1,Math.trunc(num(limit,MAX_SENSE))),q=[a],dist=new Map([[a,0]]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let qi=0;qi<q.length;qi++){const cur=q[qi],d=dist.get(cur)||0;if(d>=max)continue;const p=cellXY(state,cur);if(!p)continue;for(const [dx,dy] of dirs){const n=xyCell(state,p.x+dx,p.y+dy);if(n<0||dist.has(n)||blockedCell(state,n))continue;const nd=d+1;if(n===b)return nd;dist.set(n,nd);q.push(n)}}return Infinity;
  }

  function activeEnemies(rt=R){try{return arr(rt?.loadActiveEnemies?.()).filter(e=>num(e?.hp,1)>0&&!e?.removed&&!e?.defeated)}catch(e){return []}}
  function enemyCell(state,enemy){return num(state?.enemyCells?.[str(enemy?.id)],num(enemy?.dungeonCell200??enemy?.dungeonCell104,-1))}
  function perceptionDef(rt=R){let defs=[];try{defs=arr(rt?.GensCleanRpgStats167874?.runtimeDefs?.())}catch(e){}return defs.find(d=>/perception|vision|vigilance|awareness/.test(norm(d?.id)+" "+norm(d?.name)))||null}
  function fallbackPerception(rt=R){const mv=profile(rt)?.rpgUniverse?.movement||{},v=mv.combatAssistRange??mv.assistRange??mv.helpRange??mv.perceptionRange??DEFAULT_PERCEPTION;return clamp(Math.round(num(v,DEFAULT_PERCEPTION)),1,MAX_SENSE)}
  function heroPerception(rt=R,id=""){const d=perceptionDef(rt);if(d){try{return clamp(Math.round(num(rt?.GensCleanRpgStats167874?.value?.(str(id),str(d.id)),fallbackPerception(rt))),1,MAX_SENSE)}catch(e){}}return fallbackPerception(rt)}
  function baseEnemyVision(rt=R,enemy=null){
    let def=null,d={};try{def=rt?.activeEnemyDefinition?.(enemy?.enemyId)||null}catch(e){}try{d=rt?.dungeonEnemyDerivedForInstance?.(enemy)||{}}catch(e){}
    const direct=enemy?.vision??enemy?.detectionRange??d?.vision??d?.sight??d?.detectionRange??def?.rule?.vision??def?.rule?.sight??def?.rule?.detectionRange;
    if(Number.isFinite(Number(direct)))return clamp(Math.round(num(direct,1)),1,MAX_SENSE);
    let range=num(def?.rule?.range,1);try{for(const sk of arr(rt?.dungeonEnemyAttackSkills?.(def))){const p=rt?.dungeonEnemyAttackProfile?.(def,sk)||{};range=Math.max(range,num(p?.range??sk?.range,1))}}catch(e){}
    return clamp(Math.round(Math.max(1,range)),1,MAX_SENSE);
  }
  function enemyVision(rt=R,enemy=null,heroId=""){
    let vision=baseEnemyVision(rt,enemy);try{const api=rt?.GensCleanRpgStats167874;if(typeof api?.extraTotal==="function")vision+=num(api.extraTotal("enemy_vision",str(heroId)),0)}catch(e){}
    return clamp(Math.round(vision),1,MAX_SENSE);
  }

  function heroesInScope(state,scope,rt=R){return participants(state,rt).filter(id=>heroEntered(state,id)&&sameScope(heroScope(state,id,rt),scope))}
  function enemiesInScope(rt,state,scope){return activeEnemies(rt).filter(e=>sameScope(enemyScope(state,e),scope))}
  function detectionPairs(rt=R,state=runtimeState(rt),list=null){
    if(!state?.last?.map)return [];const scope=activeScope(state,rt),heroes=heroesInScope(state,scope,rt);if(!heroes.length)return [];const enemies=Array.isArray(list)?list.filter(e=>sameScope(enemyScope(state,e),scope)):enemiesInScope(rt,state,scope),pairs=[];
    for(const enemy of enemies){const ec=enemyCell(state,enemy);if(ec<0)continue;for(const id of heroes){const hc=heroCell(state,id),vision=enemyVision(rt,enemy,id),distance=manhattan(state,ec,hc);if(distance>vision||!lineOfSightCells(state,ec,hc))continue;pairs.push({enemyId:str(enemy.id),heroId:id,scope,enemyCell:ec,heroCell:hc,distance,vision})}}
    return pairs;
  }
  function detectionEnemyIds(rt=R,state=runtimeState(rt),list=null){return [...new Set(detectionPairs(rt,state,list).map(p=>p.enemyId))]}

  function context(rt=R){const c=rt?.__gensTacticalV113Context;return c&&Date.now()-num(c.at,0)<3000?c:null}
  function setContext(rt=R,data={}){rt.__gensTacticalV113Context={...data,at:Date.now()};return rt.__gensTacticalV113Context}
  function targetScopeForOptions(rt,state,options={}){
    const wanted=new Set(arr(options.enemyIds).map(str)),all=activeEnemies(rt),seed=all.filter(e=>wanted.has(str(e.id)));const scopes=[...new Set(seed.map(e=>scopeKey(enemyScope(state,e))))];
    if(scopes.length===1)return enemyScope(state,seed[0]);const c=context(rt);if(c?.scope)return c.scope;return activeScope(state,rt);
  }
  function selectCombatants(rt=R,options={}){
    const state=runtimeState(rt);if(!state)return {scope:{room:0,branchSourceId:""},heroIds:arr(options.heroIds).map(str),enemyIds:arr(options.enemyIds).map(str),sourceHeroIds:[]};
    const scope=targetScopeForOptions(rt,state,options),roomHeroes=heroesInScope(state,scope,rt),roomEnemies=enemiesInScope(rt,state,scope),wanted=arr(options.enemyIds).map(str),c=context(rt);
    let source=arr(c?.sourceHeroIds).map(str).filter(id=>roomHeroes.includes(id));const active=activeHeroId(state,rt);if(!source.length&&active&&roomHeroes.includes(active))source=[active];if(!source.length&&roomHeroes.length)source=[roomHeroes[0]];
    let seeds=wanted.length?roomEnemies.filter(e=>wanted.includes(str(e.id))):[];if(!seeds.length&&wanted.length===0){const pairs=detectionPairs(rt,state,roomEnemies).filter(p=>source.includes(p.heroId));const ids=new Set(pairs.map(p=>p.enemyId));seeds=roomEnemies.filter(e=>ids.has(str(e.id)));if(!seeds.length)seeds=roomEnemies.slice()}
    const sourceCells=source.map(id=>heroCell(state,id)).filter(c=>c>=0),seedCells=seeds.map(e=>enemyCell(state,e)).filter(c=>c>=0),heroIds=[];
    for(const id of roomHeroes){if(source.includes(id)){heroIds.push(id);continue}const hc=heroCell(state,id),sense=heroPerception(rt,id);let d=Infinity;for(const c0 of [...sourceCells,...seedCells])d=Math.min(d,pathDistance(state,hc,c0,sense));if(d<=sense)heroIds.push(id)}
    if(!heroIds.length)heroIds.push(...source);
    const heroCells=heroIds.map(id=>heroCell(state,id)).filter(c0=>c0>=0),enemyIds=new Set(seeds.map(e=>str(e.id)));
    for(const e of roomEnemies){if(enemyIds.has(str(e.id)))continue;const ec=enemyCell(state,e);if(ec<0)continue;for(const hid of heroIds){const hc=heroCell(state,hid),vision=enemyVision(rt,e,hid);if(manhattan(state,ec,hc)<=vision&&lineOfSightCells(state,ec,hc)){enemyIds.add(str(e.id));break}}}
    return {scope,room:scope.room,branchSourceId:scope.branchSourceId,heroIds:[...new Set(heroIds)],enemyIds:[...enemyIds],sourceHeroIds:source};
  }

  function applyRuntimePositions(rt=R,battle=null,sel=null){
    const state=runtimeState(rt);if(!state||!battle?.actors)return 0;const m=mapInfo(state),w=num(battle.grid?.width,0),h=num(battle.grid?.height,0),blocked=new Set(arr(battle.grid?.blocked).map(p=>`${p.x},${p.y}`)),used=new Set();let count=0;
    const enemies=activeEnemies(rt);for(const actor of battle.actors){let cell=-1;if(actor.side==="hero")cell=heroCell(state,str(actor?.meta?.heroId||actor.id));else{const inst=enemies.find(e=>str(e.id)===str(actor?.meta?.instanceId));if(inst)cell=enemyCell(state,inst)}const p=cellXY(state,cell);if(!p||p.x>=w||p.y>=h)continue;const k=`${p.x},${p.y}`;if(blocked.has(k)||used.has(k))continue;actor.x=p.x;actor.y=p.y;used.add(k);count++}
    battle.meta=battle.meta&&typeof battle.meta==="object"?battle.meta:{};battle.meta.scopeV113={scope:sel?.scope,heroIds:arr(sel?.heroIds),enemyIds:arr(sel?.enemyIds),realPositions:count,mapWidth:m.width,mapHeight:m.height};return count;
  }
  function unwrap112Create(fn){return fn?.__gensRpg112Spatial&&typeof fn.__original==="function"?fn.__original:fn}
  function hookAdapter(rt=R){
    const A=adapter(rt);if(!A?.createBattle)return false;if(A.createBattle.__gensRpg113Scope){adapterHooked=true;return true}const base=unwrap112Create(A.createBattle);if(typeof base!=="function")return false;
    const wrapped=function(runtime,options={}){const realRt=runtime||rt,sel=selectCombatants(realRt,options||{}),next={...(options||{}),heroIds:sel.heroIds,enemyIds:sel.enemyIds},battle=base.call(this,realRt,next);applyRuntimePositions(realRt,battle,sel);try{realRt?.GensRpgTacticalStats1678110?.decorateBattle?.(realRt,battle,{force:true})}catch(e){}return battle};
    wrapped.__gensRpg113Scope=true;wrapped.__gensRpg112Spatial=true;wrapped.__original=base;A.createBattle=wrapped;adapterHooked=true;return true;
  }

  function isDetectionReason(reason){return /detect|vision|rep[eé]rage|ambush|embuscade/i.test(str(reason))}
  function unwrap112Start(fn){return fn?.__gensRpg112Start&&typeof fn.__original==="function"?fn.__original:fn}
  function hookStart(rt=R){
    const cur=rt?.dc200StartCombat;if(typeof cur!=="function")return false;if(cur.__gensRpg113Start){startHooked=true;return true}const base=unwrap112Start(cur);if(typeof base!=="function")return false;
    const wrapped=function(ids=[],reason="manual"){
      const state=runtimeState(rt);if(!state)return base.apply(this,arguments);let requested=arr(ids).map(str).filter(Boolean);
      if(isDetectionReason(reason)){const pairs=detectionPairs(rt,state),visible=new Set(pairs.map(p=>p.enemyId));requested=(requested.length?requested:[...visible]).filter(id=>visible.has(id));if(!requested.length)return {ok:false,reason:"not-detected-v113"};const source=[...new Set(pairs.filter(p=>requested.includes(p.enemyId)).map(p=>p.heroId))];setContext(rt,{scope:activeScope(state,rt),sourceHeroIds:source,enemyIds:requested,reason})}
      const sel=selectCombatants(rt,{enemyIds:requested});if(!sel.heroIds.length||!sel.enemyIds.length)return {ok:false,reason:"no-scoped-combatants-v113"};setContext(rt,{scope:sel.scope,sourceHeroIds:sel.sourceHeroIds,enemyIds:sel.enemyIds,reason});return base.call(this,sel.enemyIds,reason);
    };
    wrapped.__gensRpg113Start=true;wrapped.__gensRpg112Start=true;wrapped.__original=base;rt.dc200StartCombat=wrapped;startHooked=true;return true;
  }

  function detectionSignature(rt,state){const scope=activeScope(state,rt),h=heroesInScope(state,scope,rt).map(id=>`${id}@${heroCell(state,id)}`).sort().join(","),e=enemiesInScope(rt,state,scope).map(x=>`${str(x.id)}@${enemyCell(state,x)}#${num(x.hp,0)}`).sort().join(",");return `${scopeKey(scope)}|${h}|${e}`}
  function scanDetection(rt=R,reason="vision-v113",force=false){
    hookStart(rt);hookAdapter(rt);if(currentBattle(rt))return [];const state=runtimeState(rt);if(!state?.last?.map)return [];const sig=detectionSignature(rt,state);if(!force&&sig===lastDetectionSignature)return [];lastDetectionSignature=sig;const pairs=detectionPairs(rt,state);if(!pairs.length)return [];const ids=[...new Set(pairs.map(p=>p.enemyId))],source=[...new Set(pairs.map(p=>p.heroId))];setContext(rt,{scope:activeScope(state,rt),sourceHeroIds:source,enemyIds:ids,reason});try{rt?.dc200StartCombat?.(ids,reason)}catch(e){try{rt?.console?.warn?.("V16.78.113 detection",e)}catch(_){}}return ids;
  }
  function scheduleDetection(rt=R,reason="vision-v113",force=false,delay=0){const run=()=>scanDetection(rt,reason,force);if(typeof setTimeout==="function")setTimeout(run,Math.max(0,delay));else run()}
  function hookMovement(rt=R){
    const fn=rt?.dungeonMoveHero098;if(typeof fn!=="function")return false;if(fn.__gensRpg113Detection){moveWrapped=fn;return true}const old=fn;const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,"movement-detection-v113",true,0);scheduleDetection(rt,"movement-detection-v113",true,90);return out};wrapped.__gensRpg113Detection=true;wrapped.__original=old;rt.dungeonMoveHero098=wrapped;moveWrapped=wrapped;return true;
  }
  function hookEventFunction(rt,name){const fn=rt?.[name];if(typeof fn!=="function")return false;if(fn.__gensRpg113Detection){eventWrapped.set(name,fn);return true}const old=fn;const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,`event-detection-v113:${name}`,true,0);scheduleDetection(rt,`event-detection-v113:${name}`,true,100);return out};wrapped.__gensRpg113Detection=true;wrapped.__original=old;rt[name]=wrapped;eventWrapped.set(name,wrapped);return true}
  function ensureDetectionHooks(rt=R){hookMovement(rt);for(const name of ["applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect"])hookEventFunction(rt,name);hookStart(rt);hookAdapter(rt);return true}
  function bindBoardClicks(rt=R){const D=doc(rt);if(!D?.addEventListener||clickBound)return !!D;const onBoard=ev=>{const cell=ev?.target?.closest?.("#dc047RoomBoard .dc047Cell");if(!cell)return;ensureDetectionHooks(rt);scheduleDetection(rt,"board-cell-detection-v113",true,0);scheduleDetection(rt,"board-cell-detection-v113",true,80)};D.addEventListener("click",onBoard,false);D.addEventListener("pointerup",onBoard,false);clickBound=true;return true}

  function ensureStyle(rt=R){const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
    .gtv2113DiceRow{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin:10px 0}
    .gtv2113DiceRow .gtv2Die{width:64px;height:64px;font-size:27px;will-change:transform;animation:gtv2113DiceShake .17s linear infinite alternate}
    .gtv2113DiceRow.settled .gtv2Die{animation:gtv2113DiceLand .22s ease-out both}
    @keyframes gtv2113DiceShake{from{transform:translateY(-2px) rotate(-10deg) scale(.92)}to{transform:translateY(2px) rotate(11deg) scale(1.07)}}
    @keyframes gtv2113DiceLand{0%{transform:scale(1.18) rotate(8deg)}100%{transform:scale(1) rotate(0deg)}}
    @media(max-width:430px){.gtv2113DiceRow .gtv2Die{width:56px;height:56px;font-size:24px}}
  `;(D.head||D.documentElement||D.body)?.appendChild(s);return true}
  function wallTargets(rt=R){const D=doc(rt),out=[];if(!D)return out;for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];for(let i=0;i<cells.length;i++)if(norm(kinds[i])==="wall"&&!out.includes(cells[i]))out.push(cells[i]);return out}
  function paintWalls(rt=R){let n=0;for(const el of wallTargets(rt)){el.classList?.add?.("gtv2113Wall");if(el?.style?.setProperty){el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center","important");el.style.setProperty("background-repeat","no-repeat","important")}n++}return n}

  function latestAttackRow(rt=R){const b=currentBattle(rt);return [...arr(b?.log)].reverse().find(x=>x?.type==="attack"&&(arr(x?.rollsDisplay).length||Number.isFinite(Number(x?.roll))))||null}
  function rowRolls(row){const xs=arr(row?.rollsDisplay).filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));if(xs.length)return xs;if(Number.isFinite(Number(row?.roll)))return [clamp(Math.round(num(row.roll,1)),1,100)];return []}
  function animateDiceOverlay(rt=R){return false}

  function maintain(rt=R){maintainQueued=false;ensureStyle(rt);ensureDetectionHooks(rt);animateDiceOverlay(rt);return true}
  function queueMaintain(rt=R){if(maintainQueued)return;maintainQueued=true;const run=()=>maintain(rt);if(typeof requestAnimationFrame==="function")requestAnimationFrame(run);else if(typeof setTimeout==="function")setTimeout(run,0);else run()}
  function observe(rt=R){const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;observer=new rt.MutationObserver(()=>queueMaintain(rt));observer.observe(D.body,{childList:true,subtree:true});return true}
  function install(rt=R){ensureStyle(rt);ensureDetectionHooks(rt);bindBoardClicks(rt);animateDiceOverlay(rt);try{rt.GENS_RPG_TACTICAL_RUNTIME_AUTHORITY_VERSION=APP_VERSION}catch(e){}installed=!!(adapterHooked&&startHooked);return installed}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,7500,10000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,DEFAULT_PERCEPTION,MAX_SENSE,ROLL_DURATION,runtimeState,heroEntered,heroScope,enemyScope,scopeKey,sameScope,mapInfo,cellXY,lineOfSightCells,pathDistance,heroPerception,enemyVision,detectionPairs,detectionEnemyIds,selectCombatants,applyRuntimePositions,hookAdapter,hookStart,scanDetection,scheduleDetection,hookMovement,ensureDetectionHooks,paintWalls,rowRolls,animateDiceOverlay,install,installWithRetries,status:()=>({installed,adapterHooked,startHooked,moveHooked:!!moveWrapped})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
