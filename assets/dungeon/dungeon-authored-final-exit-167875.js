/* GenSrpG V16.78.79 — safe final exit for authored Dungeon worlds.
   A terminal authored zone ends only from its real EXIT cell in the main graph.
   Secondary cache/place-of-interest branches are never treated as dungeon completion. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.2.0",APP_VERSION="16.78.79";
let installed=false,lastNormalButton=null;
function api(){return R.DungeonAuthoredRuntime167839||null}
function runtime(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function save(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function blocked(x){try{if(R.dungeonRoomExitLocked102?.())return true}catch(e){}if(x?.last?.exitLocked)return true;return String(x?.last?.map?.objective?.status||x?.last?.objective?.status||"")==="locked"}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function inSecondaryBranch(x,hero){
  if(x?.branch?.active)return true;
  const stacks=x?.authored167847ReturnStacks;
  const stack=stacks&&typeof stacks==="object"&&Array.isArray(stacks[hero])?stacks[hero]:[];
  return stack.length>0;
}
function finalState(){
  const a=api(),x=runtime();
  if(!a?.active?.()||!x||Number(x.room)<=0||!x?.last?.authoredRuntime167839)return null;
  const hero=activeHero(x);if(!hero||inSecondaryBranch(x,hero))return null;
  let g=null,p=null;try{g=a.graph?.();p=a.plan?.(x,g)}catch(e){return null}
  if(!g||!p?.currentNodeId||!Array.isArray(p.outgoing)||p.outgoing.length!==0)return null;
  if(String(x.last.worldDungeonId||"")!==String(g.id||""))return null;
  if(x.last.worldNodeId&&String(x.last.worldNodeId)!==String(p.currentNodeId))return null;
  const map=x?.last?.map||{},cells=Array.isArray(map.cells)?map.cells:[];
  const direct=Number(map.exitIdx),exitIdx=Number.isInteger(direct)&&direct>=0?direct:cells.findIndex(v=>String(v||"").toLowerCase()==="exit");
  const pos=Number(x?.positions?.[hero]),positional=!!a.positional?.();
  const hasExit=exitIdx>=0&&exitIdx<cells.length&&String(cells[exitIdx]||"").toLowerCase()==="exit";
  const atExit=hasExit&&(!positional||pos===exitIdx);
  return {a,x,g,p,hero,map,exitIdx,positional,hasExit,atExit};
}
function notice(title,text,onDone){try{return R.DungeonCore01?.modal?.(title,text,onDone)}catch(e){}try{R.showToast?.(title+" · "+text)}catch(e){}if(typeof onDone==="function")setTimeout(onDone,0)}
function hideDungeonUi(){
  try{R.markSessionActive?.(false)}catch(e){try{localStorage.setItem("z40k_session_active_v1","0")}catch(_){}}
  if(!D)return true;
  ["gensDungeonCore01","sheet","menu","dungeonCombatModal","dungeonCombatVictoryModal","dungeonCombatStatsModal","dc032GameOver","dc104SafeModal","dc200Modal"].forEach(id=>{const e=D.getElementById(id);if(e){e.classList.remove("open");e.style.display="none"}});
  try{D.body?.style?.removeProperty("overflow")}catch(e){}try{D.documentElement?.style?.removeProperty("overflow")}catch(e){}
  return true;
}
function showHome(){
  hideDungeonUi();
  try{if(typeof R.dc033ForceHome==="function")R.dc033ForceHome()}catch(e){}
  try{R.showGensRootHome?.()}catch(e){}
  if(D){const root=D.getElementById("gensRootHome");if(root)root.style.display="block"}
  return true;
}
function scheduleHome(){for(const ms of [0,40,160])setTimeout(showHome,ms);return true}
function finish(){
  const f=finalState();if(!f||!f.hasExit||!f.atExit)return false;
  if(blocked(f.x)){notice("🔒 Sortie verrouillée","Résous d’abord la condition de sortie de cette zone.");return false}
  const now=Date.now();
  f.x.authoredCompleted167875={worldId:String(f.g.id||""),nodeId:String(f.p.currentNodeId||""),heroId:f.hero,at:now};
  if(f.x.last){if(f.x.last.map?.objective)f.x.last.map.objective.status="complete";if(f.x.last.objective)f.x.last.objective.status="complete";f.x.last.authoredDungeonCompleted167875=true}
  save(f.x);try{R.saveDungeonState?.({room:Number(f.x.room)||0,last:f.x.last||null})}catch(e){}
  try{R.markSessionActive?.(false)}catch(e){try{localStorage.setItem("z40k_session_active_v1","0")}catch(_){}}
  notice("🏆 Donjon terminé","Le donjon est terminé. Retour à l’accueil.",scheduleHome);
  return true;
}
function rememberNormalButton(btn){if(!btn||btn.dataset?.daf167879Final==="1")return;lastNormalButton={text:btn.textContent,disabled:!!btn.disabled,onclick:btn.onclick}}
function restoreNormalButton(btn){if(!btn||btn.dataset?.daf167879Final!=="1")return false;if(lastNormalButton){btn.textContent=lastNormalButton.text;btn.disabled=lastNormalButton.disabled;btn.onclick=lastNormalButton.onclick}if(btn.dataset)delete btn.dataset.daf167879Final;return true}
function syncButton(){
  if(!D)return false;const btn=D.getElementById("dc01Explore");if(!btn)return false;const f=finalState();
  if(!f||!f.hasExit||!f.atExit){restoreNormalButton(btn);return false}
  rememberNormalButton(btn);if(btn.dataset)btn.dataset.daf167879Final="1";btn.disabled=false;
  if(blocked(f.x)){btn.textContent="🔒 SORTIE VERROUILLÉE";btn.onclick=()=>notice("🔒 Sortie verrouillée","Résous d’abord la condition de sortie de cette zone.");return true}
  btn.textContent="🏆 TERMINER LE DONJON";btn.onclick=finish;return true;
}
function wrapRender(name){const core=R.DungeonCore01,old=core?.[name];if(typeof old!=="function"||old.__daf167879)return false;const w=function(){const out=old.apply(this,arguments);try{syncButton()}catch(e){}return out};w.__daf167879=true;w.__original=old;core[name]=w;return true}
function install(){wrapRender("render");wrapRender("show");syncButton();installed=true;try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true}
R.DungeonAuthoredFinalExit167875={VERSION,APP_VERSION,inSecondaryBranch,finalState,finish,syncButton,showHome,scheduleHome,install};
install();if(D){if(D.readyState==="loading")D.addEventListener("DOMContentLoaded",()=>{install();syncButton()},{once:true});else syncButton()}if(typeof setTimeout==="function")for(const ms of [50,250,1000])setTimeout(()=>{install();syncButton()},ms);
})();
