/* GenSrpG V16.78.75 — final exit for authored Dungeon worlds.
   A terminal authored zone (no outgoing edge) ends the Dungeon instead of showing "sortie non reliée".
   No room generation, combat, movement, spawn or stat logic is changed. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.75";
let installed=false;
function api(){return R.DungeonAuthoredRuntime167839||null}
function runtime(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function save(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function blocked(x){try{if(R.dungeonRoomExitLocked102?.())return true}catch(e){}if(x?.last?.exitLocked)return true;return String(x?.last?.map?.objective?.status||x?.last?.objective?.status||"")==="locked"}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function finalState(){const a=api(),x=runtime();if(!a?.active?.()||!x||Number(x.room)<=0||x.branch?.active)return null;let g=null,p=null;try{g=a.graph?.();p=a.plan?.(x,g)}catch(e){return null}if(!g||!p?.currentNodeId||!Array.isArray(p.outgoing)||p.outgoing.length!==0)return null;const hero=activeHero(x),map=x?.last?.map||{},cells=Array.isArray(map.cells)?map.cells:[],direct=Number(map.exitIdx),exitIdx=Number.isInteger(direct)&&direct>=0?direct:cells.findIndex(v=>String(v||"").toLowerCase()==="exit"),pos=Number(x?.positions?.[hero]),positional=!!a.positional?.(),atExit=!positional||(exitIdx>=0&&pos===exitIdx);return {a,x,g,p,hero,map,exitIdx,positional,atExit}}
function notice(title,text){try{return R.DungeonCore01?.modal?.(title,text)}catch(e){}try{return R.showToast?.(title+" · "+text)}catch(e){}}
function showHome(){try{if(typeof R.dc033ForceHome==="function")return R.dc033ForceHome()}catch(e){}try{R.markSessionActive?.(false)}catch(e){try{localStorage.setItem("z40k_session_active_v1","0")}catch(_){}}if(D){["gensDungeonCore01","sheet","menu","dungeonCombatModal","dungeonCombatVictoryModal","dungeonCombatStatsModal","dc032GameOver","dc104SafeModal","dc200Modal"].forEach(id=>{const e=D.getElementById(id);if(e){e.classList.remove("open");e.style.display="none"}});D.body.style.removeProperty("overflow");D.documentElement.style.removeProperty("overflow");try{R.showGensRootHome?.()}catch(e){}const root=D.getElementById("gensRootHome");if(root)root.style.display="block"}return true}
function finish(){const f=finalState();if(!f)return false;if(blocked(f.x)){notice("🔒 Sortie verrouillée","Résous d’abord la condition de sortie de cette zone.");return false}if(!f.atExit){notice("🏁 Sortie finale","Place le héros actif sur la case de sortie finale pour terminer le donjon.");return false}const now=Date.now();f.x.authoredCompleted167875={worldId:String(f.g.id||""),nodeId:String(f.p.currentNodeId||""),heroId:f.hero,at:now};if(f.x.last){if(f.x.last.map?.objective)f.x.last.map.objective.status="complete";if(f.x.last.objective)f.x.last.objective.status="complete";f.x.last.authoredDungeonCompleted167875=true}save(f.x);try{R.saveDungeonState?.({room:Number(f.x.room)||0,last:f.x.last||null})}catch(e){}try{R.markSessionActive?.(false)}catch(e){try{localStorage.setItem("z40k_session_active_v1","0")}catch(_){}}try{R.showToast?.("🏆 Donjon terminé") }catch(e){}setTimeout(showHome,0);return true}
function syncButton(){if(!D)return false;const f=finalState(),btn=D.getElementById("dc01Explore");if(!f||!btn)return false;if(blocked(f.x)){btn.textContent="🔒 SORTIE VERROUILLÉE";return false}btn.disabled=false;if(f.positional&&!f.atExit){btn.textContent="🏁 REJOINDRE LA SORTIE FINALE";btn.onclick=()=>notice("🏁 Sortie finale","Place le héros actif sur la case de sortie finale pour terminer le donjon.");return true}btn.textContent="🏆 TERMINER LE DONJON";btn.onclick=finish;return true}
function wrapExplore(){const core=R.DungeonCore01,old=core?.explore;if(typeof old!=="function"||old.__daf167875)return false;const w=function(){const f=finalState();if(f)return finish();return old.apply(this,arguments)};w.__daf167875=true;w.__original=old;core.explore=w;return true}
function wrapRender(name){const core=R.DungeonCore01,old=core?.[name];if(typeof old!=="function"||old.__daf167875)return false;const w=function(){const out=old.apply(this,arguments);try{syncButton()}catch(e){}return out};w.__daf167875=true;w.__original=old;core[name]=w;return true}
function install(){wrapExplore();wrapRender("render");wrapRender("show");syncButton();installed=!!R.DungeonCore01?.explore?.__daf167875;return installed}
R.DungeonAuthoredFinalExit167875={VERSION,APP_VERSION,finalState,finish,syncButton,install};
install();if(D){if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>{install();syncButton()},{once:true});else syncButton()}if(typeof setTimeout==="function")for(const ms of [50,250,1000])setTimeout(()=>{install();syncButton()},ms);
})();

/* GenSrpG V16.78.77 — authored Dungeon event cells.
   Adds a reusable 🎲 event tile to Room Creator and fires the existing Dungeon event engine once
   when a hero reaches that cell in a built Dungeon. No second event/combat/spawn system is created. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2",APP_VERSION="16.78.77",VERSION="1.0.0",MARKER="event";
let scheduled=false;
function read(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function write(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function hero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function installTool(){const api=R.DungeonRoomCreator100,tools=api?.TOOLS;if(!tools)return false;if(!tools.event)tools.event={label:"Événement",icon:"🎲",kind:"object"};if(D&&!D.getElementById("dae167877Style")){const s=D.createElement("style");s.id="dae167877Style";s.textContent=".drc100Cell.event{background:#30224a;border-color:#6f58a5}.drc100Cell.event::after{content:'🎲';font-size:16px}";D.head?.appendChild(s)}return true}
function context(){const x=read();if(!x||Number(x.room)<=0||x.branch?.active||!x.last?.authoredRuntime167839)return null;const h=hero(x),pos=Number(x?.positions?.[h]),map=x?.last?.map||{},cells=Array.isArray(map.cells)?map.cells:[];if(!h||!Number.isInteger(pos)||pos<0||String(cells[pos]||"").toLowerCase()!==MARKER)return null;const worldId=String(x.last.worldDungeonId||""),nodeId=String(x.last.worldNodeId||"");if(!worldId||!nodeId)return null;const key=worldId+"::"+nodeId+"::"+pos;x.authoredEventCells167877=x.authoredEventCells167877&&typeof x.authoredEventCells167877==="object"?x.authoredEventCells167877:{};return {x,h,pos,worldId,nodeId,key,done:!!x.authoredEventCells167877[key]}}
function fire(){scheduled=false;const c=context();if(!c||c.done)return false;const fn=R.dungeonEventSpawn;if(typeof fn!=="function"){try{R.showToast?.("🎲 Événement placé · moteur d'événements indisponible") }catch(e){}return false}c.x.authoredEventCells167877[c.key]={heroId:c.h,room:Number(c.x.room)||0,cell:c.pos,at:Date.now()};write(c.x);let out=false;try{out=R.DungeonCore318?.withRoom?R.DungeonCore318.withRoom(Number(c.x.room)||0,()=>fn()):fn()}catch(e){delete c.x.authoredEventCells167877[c.key];write(c.x);console.warn("Authored Dungeon event cell",e);return false}try{R.showToast?.("🎲 Événement déclenché") }catch(e){}return out!==false}
function schedule(){if(scheduled)return;scheduled=true;if(typeof setTimeout==="function")setTimeout(fire,0);else fire()}
function wrap(name){const core=R.DungeonCore01,old=core?.[name];if(typeof old!=="function"||old.__dae167877)return false;const w=function(){const out=old.apply(this,arguments);schedule();return out};w.__dae167877=true;w.__original=old;core[name]=w;return true}
function install(){installTool();wrap("render");wrap("show");if(D&&!D.__dae167877Click){D.__dae167877Click=true;D.addEventListener("click",schedule,true)}schedule();try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true}
R.DungeonAuthoredEventCells167877={VERSION,APP_VERSION,MARKER,installTool,context,fire,schedule,install};
install();if(D){if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",install,{once:true});}if(typeof setTimeout==="function")for(const ms of [50,250,1000])setTimeout(install,ms);
})();
