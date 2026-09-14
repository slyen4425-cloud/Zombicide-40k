/* GenSrpG V16.78.114 — targeted wall / detection / dice hotfix.
   Keeps V113 room/sub-room combat scoping intact.
   - restores the validated dng_wall_block.jpg wall art and removes zoom artefacts;
   - detects heroes from the live Dungeon runtime after movement/render/ambush spawns;
   - uses a real visible D100 rolling stage and reveals the already-resolved result only after the roll.
   No canonical RPG stat calculation is added to the combat hot loop. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalHotfix1678114=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.114";
  const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
  const STYLE_ID="gensRpgTacticalHotfix1678114Style";
  const DEFAULT_ENEMY_VISION=3,MAX_VISION=12,ROLL_DURATION=900,RESULT_HOLD=260,HEARTBEAT_MS=450;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=v=>str(v).trim().toLowerCase().normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||str(v).trim().toLowerCase();
  let installed=false,observer=null,heartbeat=null,boardBound=false,queued=false,lastSignature="",lastCombatSignature="";
  const wrappedGlobals=new Map(),wrappedCore=new Map();

  function doc(rt=R){return rt?.document||null}
  function authority(rt=R){return rt?.GensRpgTacticalRuntimeAuthority1678113||null}
  function ui(rt=R){return rt?.GensRpgTacticalCombatV2Ui||null}
  function currentBattle(rt=R){try{return ui(rt)?.getBattle?.()||null}catch(e){return null}}
  function runtimeState(rt=R){
    try{
      const raw=rt?.localStorage?.getItem?.("gensrpg_dungeon_runtime_v2");
      const x=raw?JSON.parse(raw):null;
      if(x&&typeof x==="object"&&x.last?.map&&Array.isArray(x.participants))return x;
    }catch(e){}
    try{const x=rt?.loadDungeonState?.();if(x&&typeof x==="object")return x}catch(e){}
    return null;
  }
  function participants(state){return arr(state?.participants).map(str).filter(Boolean)}
  function activeHeroId(state){const p=participants(state),i=clamp(Math.trunc(num(state?.index,0)),0,Math.max(0,p.length-1));return p[i]||""}
  function roomOfHero(state,id){const v=state?.heroRooms?.[id];return v==null?num(state?.room,0):num(v,0)}
  function heroCell(state,id){
    id=str(id);const active=activeHeroId(state);
    if(id===active&&state?.branch?.active&&Number.isFinite(Number(state?.positions?.[id])))return num(state.positions[id],-1);
    const saved=state?.heroBranchStates?.[id];
    if(saved?.branch?.active&&Number.isFinite(Number(saved?.cell)))return num(saved.cell,-1);
    return num(state?.positions?.[id],-1);
  }
  function heroScope(state,id,rt=R){
    try{const x=authority(rt)?.heroScope?.(state,id,rt);if(x)return x}catch(e){}
    id=str(id);let room=roomOfHero(state,id),branch="";const active=activeHeroId(state);
    if(id===active&&state?.branch?.active){room=num(state.branch.parentRoom??room,room);branch=str(state.branch.sourceId||"")}
    else{const saved=state?.heroBranchStates?.[id];if(saved?.branch?.active){room=num(saved.branch.parentRoom??saved.room??room,room);branch=str(saved.branch.sourceId||"")}}
    return {room,branchSourceId:branch};
  }
  function enemyScope(state,enemy,rt=R){
    try{const x=authority(rt)?.enemyScope?.(state,enemy);if(x)return x}catch(e){}
    let branch=str(enemy?.dc318BranchSourceId||enemy?.branchSourceId||enemy?.dc200BranchSourceId||"");
    if(!branch&&enemy?.dc200Branch===true&&state?.branch?.active)branch=str(state.branch.sourceId||"");
    return {room:num(enemy?.dungeonRoom,state?.room||0),branchSourceId:branch};
  }
  function sameScope(a,b){return num(a?.room,0)===num(b?.room,0)&&str(a?.branchSourceId)===str(b?.branchSourceId)}
  function activeScope(state,rt=R){const id=activeHeroId(state);return id?heroScope(state,id,rt):{room:num(state?.room,0),branchSourceId:""}}
  function activeEnemies(rt=R){try{return arr(rt?.loadActiveEnemies?.()).filter(e=>num(e?.hp,1)>0&&!e?.removed&&!e?.defeated)}catch(e){return []}}
  function enemyCell(state,e){return num(state?.enemyCells?.[str(e?.id)],num(e?.dungeonCell200??e?.dungeonCell104,-1))}
  function mapInfo(state){
    const map=state?.last?.map||{},cells=arr(map.cells);let width=Math.trunc(num(map.width??map.size,0));
    if(width<1)width=Math.max(1,Math.round(Math.sqrt(cells.length||1)));
    let height=Math.trunc(num(map.height,0));if(height<1)height=Math.max(1,Math.ceil((cells.length||width)/width));
    return {map,cells,width,height};
  }
  function cellXY(state,cell){const m=mapInfo(state),i=Math.trunc(num(cell,-1));return i>=0&&i<m.width*m.height?{x:i%m.width,y:Math.floor(i/m.width)}:null}
  function xyCell(state,x,y){const m=mapInfo(state);return x>=0&&y>=0&&x<m.width&&y<m.height?y*m.width+x:-1}
  function blockedCell(state,cell){const m=mapInfo(state),t=norm(m.cells[Math.trunc(num(cell,-1))]||"");return t==="wall"||t==="void"||t==="blocked"||t==="rock"}
  function bresenham(a,b){let x0=a.x|0,y0=a.y|0,x1=b.x|0,y1=b.y|0;const out=[],dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;while(true){out.push({x:x0,y:y0});if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}return out}
  function lineOfSight(state,aCell,bCell){const a=cellXY(state,aCell),b=cellXY(state,bCell);if(!a||!b)return false;const pts=bresenham(a,b);for(let i=1;i<pts.length-1;i++){const c=xyCell(state,pts[i].x,pts[i].y);if(c<0||blockedCell(state,c))return false}return true}
  function manhattan(state,aCell,bCell){const a=cellXY(state,aCell),b=cellXY(state,bCell);return !a||!b?Infinity:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}

  function enemyVision(rt=R,enemy=null){
    let def=null,derived={};try{def=rt?.activeEnemyDefinition?.(enemy?.enemyId)||null}catch(e){}try{derived=rt?.dungeonEnemyDerivedForInstance?.(enemy)||{}}catch(e){}
    const explicit=enemy?.vision??enemy?.detectionRange??derived?.vision??derived?.sight??derived?.detectionRange??def?.rule?.vision??def?.rule?.sight??def?.rule?.detectionRange;
    if(Number.isFinite(Number(explicit)))return clamp(Math.round(num(explicit,DEFAULT_ENEMY_VISION)),1,MAX_VISION);
    let attackRange=num(def?.rule?.range,1);
    try{for(const sk of arr(rt?.dungeonEnemyAttackSkills?.(def))){const p=rt?.dungeonEnemyAttackProfile?.(def,sk)||{};attackRange=Math.max(attackRange,num(p?.range??sk?.range,1))}}catch(e){}
    return clamp(Math.round(Math.max(DEFAULT_ENEMY_VISION,attackRange)),1,MAX_VISION);
  }
  function heroesInActiveScope(rt,state,scope){return participants(state).filter(id=>sameScope(heroScope(state,id,rt),scope)&&heroCell(state,id)>=0)}
  function enemiesInActiveScope(rt,state,scope){return activeEnemies(rt).filter(e=>sameScope(enemyScope(state,e,rt),scope)&&enemyCell(state,e)>=0)}
  function detectionPairs(rt=R,state=runtimeState(rt)){
    if(!state?.last?.map)return [];const scope=activeScope(state,rt),heroes=heroesInActiveScope(rt,state,scope),enemies=enemiesInActiveScope(rt,state,scope),out=[];
    for(const e of enemies){const ec=enemyCell(state,e),vision=enemyVision(rt,e);for(const id of heroes){const hc=heroCell(state,id),distance=manhattan(state,ec,hc);if(distance<=vision&&lineOfSight(state,ec,hc))out.push({enemyId:str(e.id),heroId:id,enemyCell:ec,heroCell:hc,distance,vision,scope})}}
    return out;
  }
  function detectionSignature(rt=R,state=runtimeState(rt)){
    if(!state)return "";const scope=activeScope(state,rt),h=heroesInActiveScope(rt,state,scope).map(id=>`${id}@${heroCell(state,id)}`).sort().join(","),e=enemiesInActiveScope(rt,state,scope).map(x=>`${str(x.id)}@${enemyCell(state,x)}#${num(x.hp,0)}v${enemyVision(rt,x)}`).sort().join(",");return `${scope.room}|${scope.branchSourceId}|${h}|${e}`;
  }
  function scanDetection(rt=R,reason="runtime-v114",force=false){
    if(currentBattle(rt))return [];const state=runtimeState(rt);if(!state?.last?.map)return [];const sig=detectionSignature(rt,state);if(!force&&sig&&sig===lastSignature)return [];lastSignature=sig;const pairs=detectionPairs(rt,state);if(!pairs.length)return [];
    const enemyIds=[...new Set(pairs.map(p=>p.enemyId))],heroIds=[...new Set(pairs.map(p=>p.heroId))],combatSig=`${sig}|${enemyIds.join(",")}|${heroIds.join(",")}`;
    if(combatSig===lastCombatSignature&&!force)return [];lastCombatSignature=combatSig;rt.__gensTacticalV114DetectionContext={at:Date.now(),reason,enemyIds,heroIds,scope:pairs[0]?.scope||activeScope(state,rt)};
    try{if(typeof rt?.dc200StartCombat==="function")rt.dc200StartCombat(enemyIds,"auto-engage-v114")}catch(e){try{rt?.console?.warn?.("V16.78.114 auto engage",e)}catch(_){}}
    return enemyIds;
  }
  function scheduleDetection(rt=R,reason="runtime-v114",force=false,delays=[0,80,180]){
    if(currentBattle(rt))return false;for(const delay of delays){if(typeof setTimeout==="function")setTimeout(()=>scanDetection(rt,reason,force),Math.max(0,delay));else scanDetection(rt,reason,force)}return true;
  }

  function wrapGlobal(rt,name){
    const fn=rt?.[name];if(typeof fn!=="function")return false;if(fn.__gensRpg114Detection)return true;const old=fn;
    const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,`after:${name}`,true);return out};wrapped.__gensRpg114Detection=true;wrapped.__original=old;rt[name]=wrapped;wrappedGlobals.set(name,wrapped);return true;
  }
  function wrapCore(rt,name){
    const core=rt?.DungeonCore01,fn=core?.[name];if(typeof fn!=="function")return false;if(fn.__gensRpg114Detection)return true;const old=fn;
    const wrapped=function(){const out=old.apply(this,arguments);scheduleDetection(rt,`core:${name}`,false,[0,90]);return out};wrapped.__gensRpg114Detection=true;wrapped.__original=old;core[name]=wrapped;wrappedCore.set(name,wrapped);return true;
  }
  function ensureDetectionHooks(rt=R){
    for(const name of ["dungeonMoveHero098","applyDungeonTurnEvent","dungeonEventSpawn","applyEnemyConfiguredAbilityEffect","saveActiveEnemies","renderActiveEnemies"])wrapGlobal(rt,name);
    for(const name of ["render","show"])wrapCore(rt,name);return true;
  }
  function bindBoard(rt=R){const D=doc(rt);if(!D?.addEventListener||boardBound)return !!D;const hit=ev=>{if(!ev?.target?.closest?.("#dc047RoomBoard .dc047Cell"))return;scheduleDetection(rt,"board-input-v114",true)};D.addEventListener("pointerup",hit,false);D.addEventListener("click",hit,false);boardBound=true;return true}
  function boardTouched(node){if(!node||node.nodeType!==1)return false;return !!(node.matches?.("#dc047RoomBoard,#dc047RoomBoard *")||node.closest?.("#dc047RoomBoard")||node.querySelector?.("#dc047RoomBoard"))}

  function ensureStyle(rt=R){
    const D=doc(rt);if(!D||D.getElementById?.(STYLE_ID))return !!D;const s=D.createElement("style");s.id=STYLE_ID;s.textContent=`
      .gtv2114Wall{background-image:url("${WALL_ASSET}")!important;background-size:cover!important;background-position:center center!important;background-repeat:no-repeat!important;background-color:#181818!important;color:transparent!important;text-shadow:none!important;font-size:0!important;overflow:hidden!important}
      .gtv2114Wall::before,.gtv2114Wall::after{display:none!important;content:none!important;background:none!important;border:0!important;box-shadow:none!important}
      .gtv2114Wall>*{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      .gtv2114RollStage{position:absolute;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(8,12,18,.985);border-radius:inherit;min-height:160px;padding:16px;box-sizing:border-box;pointer-events:auto}
      .gtv2114RollStage strong{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.76}.gtv2114DiceRow{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
      .gtv2114Die{display:grid;place-items:center;width:74px;height:74px;border:2px solid #d9e3ef;border-radius:16px;background:#111923;color:#fff;font-weight:1000;font-size:30px;box-shadow:0 10px 28px rgba(0,0,0,.45);animation:gtv2114Roll .18s linear infinite alternate;will-change:transform}
      .gtv2114RollStage.settled .gtv2114Die{animation:gtv2114Land .22s ease-out both}.gtv2114RollResult{min-height:18px;font-size:13px;font-weight:900;opacity:0}.gtv2114RollStage.settled .gtv2114RollResult{opacity:1}
      @keyframes gtv2114Roll{0%{transform:translate(-3px,-5px) rotate(-13deg) scale(.92)}50%{transform:translate(4px,3px) rotate(10deg) scale(1.08)}100%{transform:translate(-1px,5px) rotate(-4deg) scale(.98)}}
      @keyframes gtv2114Land{0%{transform:scale(1.18) rotate(9deg)}100%{transform:scale(1) rotate(0)}}
      @media(max-width:430px){.gtv2114Die{width:62px;height:62px;font-size:26px}.gtv2114RollStage{min-height:145px;padding:12px}}
    `;(D.head||D.documentElement||D.body)?.appendChild(s);return true;
  }
  function wallTargets(rt=R){
    const D=doc(rt),out=[];if(!D)return out;for(const sel of [".gtv2Cell.blocked","#drc100Grid .drc100Cell.wall","#dc047RoomBoard .dav167870WallCell"]){for(const el of D.querySelectorAll?.(sel)||[])if(!out.includes(el))out.push(el)}
    const state=runtimeState(rt),kinds=arr(state?.last?.map?.cells),cells=[...(D.querySelectorAll?.("#dc047RoomBoard .dc047Grid > .dc047Cell")||[])];for(let i=0;i<cells.length;i++)if(norm(kinds[i])==="wall"&&!out.includes(cells[i]))out.push(cells[i]);return out;
  }
  function wallCorrect(el){const bg=str(el?.style?.backgroundImage||el?.style?.getPropertyValue?.("background-image"));const size=str(el?.style?.backgroundSize||el?.style?.getPropertyValue?.("background-size"));return !!el?.classList?.contains?.("gtv2114Wall")&&bg.includes("dng_wall_block.jpg")&&size==="cover"}
  function paintWalls(rt=R){let n=0;for(const el of wallTargets(rt)){if(wallCorrect(el))continue;el.classList?.remove?.("gtv2112WallCell","gtv2113Wall");el.classList?.add?.("gtv2114Wall");if(el?.style?.setProperty){el.style.setProperty("background-image",`url("${WALL_ASSET}")`,"important");el.style.setProperty("background-size","cover","important");el.style.setProperty("background-position","center center","important");el.style.setProperty("background-repeat","no-repeat","important");el.style.setProperty("background-color","#181818","important");el.style.setProperty("font-size","0","important");el.style.setProperty("color","transparent","important")}n++}return n}

  function latestAttackRow(rt=R){const b=currentBattle(rt);return [...arr(b?.log)].reverse().find(x=>x?.type==="attack"&&(arr(x?.rollsDisplay).length||Number.isFinite(Number(x?.roll))))||null}
  function rowRolls(row){const xs=arr(row?.rollsDisplay).filter(v=>Number.isFinite(Number(v))).map(v=>clamp(Math.round(num(v,1)),1,100));if(xs.length)return xs;if(Number.isFinite(Number(row?.roll)))return [clamp(Math.round(num(row.roll,1)),1,100)];return []}
  function animateDiceOverlay(rt=R){
    const D=doc(rt),card=D?.querySelector?.(".gtv2DiceCard");if(!card||card.getAttribute?.("data-v114-roll")==="settled"||card.querySelector?.(".gtv2114RollStage"))return false;const row=latestAttackRow(rt),rolls=rowRolls(row);if(!rolls.length)return false;
    card.style?.setProperty?.("position","relative");card.setAttribute?.("data-v114-roll","rolling");const stage=D.createElement("div");stage.className="gtv2114RollStage";stage.innerHTML=`<strong>Lancer D100</strong><div class="gtv2114DiceRow">${rolls.map(v=>`<div class="gtv2114Die" data-final="${v}">?</div>`).join("")}</div><div class="gtv2114RollResult">Résultat : ${rolls.join(" · ")}</div>`;card.appendChild(stage);
    const dice=[...stage.querySelectorAll?.(".gtv2114Die")||[]],tick=()=>dice.forEach(d=>d.textContent=String(Math.floor(Math.random()*100)+1));tick();let timer=null;if(typeof setInterval==="function")timer=setInterval(tick,48);
    const settle=()=>{if(timer!=null&&typeof clearInterval==="function")clearInterval(timer);dice.forEach((d,i)=>d.textContent=String(rolls[i]));stage.classList?.add?.("settled");if(typeof setTimeout==="function")setTimeout(()=>{stage.remove?.();card.setAttribute?.("data-v114-roll","settled")},RESULT_HOLD);else{stage.remove?.();card.setAttribute?.("data-v114-roll","settled")}};
    if(typeof setTimeout==="function")setTimeout(settle,ROLL_DURATION);else settle();return true;
  }

  function maintain(rt=R){queued=false;ensureStyle(rt);ensureDetectionHooks(rt);paintWalls(rt);animateDiceOverlay(rt);return true}
  function queueMaintain(rt=R){if(queued)return;queued=true;const run=()=>maintain(rt);if(typeof rt?.requestAnimationFrame==="function")rt.requestAnimationFrame(run);else if(typeof setTimeout==="function")setTimeout(run,0);else run()}
  function observe(rt=R){const D=doc(rt);if(!D?.body||observer||typeof rt?.MutationObserver!=="function")return !!observer;observer=new rt.MutationObserver(muts=>{let board=false,dice=false;for(const m of muts){for(const n of m.addedNodes||[]){if(boardTouched(n))board=true;if(n?.nodeType===1&&(n.matches?.(".gtv2DiceBackdrop,.gtv2DiceCard")||n.querySelector?.(".gtv2DiceBackdrop,.gtv2DiceCard")))dice=true}if(board&&dice)break}if(board||dice)queueMaintain(rt);if(board)scheduleDetection(rt,"board-mutation-v114",false,[0,100])});observer.observe(D.body,{childList:true,subtree:true});return true}
  function startHeartbeat(rt=R){if(heartbeat!=null||typeof setInterval!=="function")return !!heartbeat;heartbeat=setInterval(()=>{if(currentBattle(rt))return;const D=doc(rt);if(!D?.querySelector?.("#dc047RoomBoard"))return;ensureDetectionHooks(rt);scanDetection(rt,"heartbeat-v114",false);paintWalls(rt)},HEARTBEAT_MS);return true}
  function install(rt=R){ensureStyle(rt);ensureDetectionHooks(rt);bindBoard(rt);observe(rt);paintWalls(rt);animateDiceOverlay(rt);scheduleDetection(rt,"install-v114",false,[0,120]);startHeartbeat(rt);try{rt.GENS_RPG_TACTICAL_HOTFIX_VERSION=APP_VERSION}catch(e){}installed=true;return true}
  function installWithRetries(rt=R){install(rt);if(typeof setTimeout==="function")for(const ms of [80,220,600,1200,2500,5000,8000,11000])setTimeout(()=>install(rt),ms);return true}
  const api={VERSION,APP_VERSION,WALL_ASSET,DEFAULT_ENEMY_VISION,MAX_VISION,ROLL_DURATION,RESULT_HOLD,HEARTBEAT_MS,runtimeState,heroScope,enemyScope,enemyVision,lineOfSight,detectionPairs,detectionSignature,scanDetection,scheduleDetection,ensureDetectionHooks,wallTargets,paintWalls,rowRolls,animateDiceOverlay,install,installWithRetries,status:()=>({installed,observer:!!observer,heartbeat:heartbeat!=null,wrappedGlobals:[...wrappedGlobals.keys()],wrappedCore:[...wrappedCore.keys()]})};
  if(doc(R)){if(doc(R).readyState==="loading")doc(R).addEventListener?.("DOMContentLoaded",()=>installWithRetries(R),{once:true});else installWithRetries(R)}
  return api;
});
