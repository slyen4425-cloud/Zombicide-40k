/* GenSrpG V16.78.79 — authored Dungeon event cells.
   Adds a reusable 🎲 event tile to Room Creator and routes it through the existing complete Dungeon
   event engine (selection + effect + popup), once per authored zone cell. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2",APP_VERSION="16.78.79",VERSION="1.1.1",MARKER="event";
let scheduled=false;
function read(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function write(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function hero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function installTool(){const api=R.DungeonRoomCreator100,tools=api?.TOOLS;if(!tools)return false;if(!tools.event)tools.event={label:"Événement",icon:"🎲",kind:"object"};if(D&&!D.getElementById("dae167877Style")){const s=D.createElement("style");s.id="dae167877Style";s.textContent=".drc100Cell.event{background:#30224a;border-color:#6f58a5}.drc100Cell.event::after{content:'🎲';font-size:16px}";D.head?.appendChild(s)}return true}
function context(){const x=read();if(!x||Number(x.room)<=0||x.branch?.active||!x.last?.authoredRuntime167839)return null;const h=hero(x),pos=Number(x?.positions?.[h]),map=x?.last?.map||{},cells=Array.isArray(map.cells)?map.cells:[];if(!h||!Number.isInteger(pos)||pos<0||String(cells[pos]||"").toLowerCase()!==MARKER)return null;const worldId=String(x.last.worldDungeonId||""),nodeId=String(x.last.worldNodeId||"");if(!worldId||!nodeId)return null;const key=worldId+"::"+nodeId+"::"+pos;x.authoredEventCells167877=x.authoredEventCells167877&&typeof x.authoredEventCells167877==="object"?x.authoredEventCells167877:{};return {x,h,pos,worldId,nodeId,key,done:!!x.authoredEventCells167877[key]}}
function eventRound(c){return Math.max(1,Number(c?.x?.round)||Number(R.loadDungeonState?.()?.room)||Number(c?.x?.room)||1)}
function pickEvent(round){try{const eligible=R.dungeonEligibleEvents?.(round)||[];return R.dungeonWeightedEventPick?.(eligible)||null}catch(e){return null}}
function applyEvent(evt,round){if(!evt)return null;return R.applyDungeonTurnEvent?.(evt,round)||null}
function fallbackPopup(text){const body=String(text||"Un événement se produit dans cette salle.");try{if(typeof R.showEffectPopup==="function"){R.showEffectPopup("🎲","ÉVÉNEMENT",body,"Donjon construit",true);return true}}catch(e){}try{if(typeof R.DungeonCore01?.modal==="function"){R.DungeonCore01.modal("🎲 ÉVÉNEMENT",body);return true}}catch(e){}try{R.showToast?.("🎲 "+body)}catch(e){}return false}
function fire(){
  scheduled=false;const c=context();if(!c||c.done)return false;
  const round=eventRound(c),evt=pickEvent(round);
  c.x.authoredEventCells167877[c.key]={heroId:c.h,room:Number(c.x.room)||0,cell:c.pos,at:Date.now(),eventId:String(evt?.id||"")};write(c.x);
  try{
    if(evt&&typeof R.applyDungeonTurnEvent==="function"){
      const out=R.DungeonCore318?.withRoom?R.DungeonCore318.withRoom(Number(c.x.room)||0,()=>applyEvent(evt,round)):applyEvent(evt,round);
      if(out)return true;
    }
    const spawn=R.dungeonEventSpawn;
    if(typeof spawn==="function"){
      const out=R.DungeonCore318?.withRoom?R.DungeonCore318.withRoom(Number(c.x.room)||0,()=>spawn(1,round)):spawn(1,round);
      fallbackPopup(out?.text||"Un événement se déclenche.");return out!==false;
    }
    fallbackPopup("Le moteur d'événements Dungeon n'est pas disponible.");return false;
  }catch(e){delete c.x.authoredEventCells167877[c.key];write(c.x);console.warn("Authored Dungeon event cell",e);fallbackPopup("Impossible de résoudre cet événement.");return false}
}
function schedule(){if(scheduled)return;scheduled=true;if(typeof setTimeout==="function")setTimeout(fire,0);else fire()}
function wrap(name){const core=R.DungeonCore01,old=core?.[name];if(typeof old!=="function"||old.__dae167879)return false;const w=function(){const out=old.apply(this,arguments);schedule();return out};w.__dae167879=true;w.__original=old;core[name]=w;return true}
function install(){installTool();wrap("render");wrap("show");if(D&&!D.__dae167879Click){D.__dae167879Click=true;D.addEventListener("click",schedule,true)}schedule();try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true}
R.DungeonAuthoredEventCells167877={VERSION,APP_VERSION,MARKER,installTool,context,eventRound,pickEvent,applyEvent,fire,schedule,install};
install();if(D&&D.readyState==="loading")D.addEventListener("DOMContentLoaded",install,{once:true});if(typeof setTimeout==="function")for(const ms of [50,250,1000])setTimeout(install,ms);
})();
