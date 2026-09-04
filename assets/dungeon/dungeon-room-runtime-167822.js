/* GenSrpG V16.78.22 — Dungeon custom-room runtime integration.
   Applies Room Creator templates to newly created Dungeon rooms while preserving
   the existing encounter/combat/timeline/spawn pipeline. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0";
const APP_VERSION="16.78.22";
const RT_KEY="gensrpg_dungeon_runtime_v2";
const CFG_KEY="gensrpg_dungeon_room_runtime_cfg_v1";
const MARKER_BY_KIND={enemy:"enemy",ambush:"enemy",boss:"boss",chest:"chest",trap:"trap",merchant:"merchant",rest:"rest",mystery:"puzzle"};
let installing=false;

function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v}catch(e){return fallback}}
function writeJson(key,v){localStorage.setItem(key,JSON.stringify(v));return v}
function roomApi(){return ROOT.DungeonRoomCreator100||null}
function currentAdventureId(){try{return String(ROOT.activeDungeonAdventureId?.()||"default")}catch(e){return "default"}}
function allConfigs(){const x=readJson(CFG_KEY,{});return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}
function validRoom(room){try{const v=roomApi()?.validateRoom?.(room);return !!room&&(!v||v.valid)}catch(e){return !!room}}
function library(){try{return (roomApi()?.loadLibrary?.()||[]).filter(validRoom)}catch(e){return []}}
function defaultConfig(){return {enabled:false,chance:100,roomIds:library().map(r=>String(r.id))}}
function getConfig(adventureId){const id=String(adventureId||currentAdventureId()),all=allConfigs(),raw=all[id];if(!raw)return defaultConfig();const ids=Array.isArray(raw.roomIds)?raw.roomIds.map(String):[];return {enabled:!!raw.enabled,chance:Math.max(0,Math.min(100,Number(raw.chance??100))),roomIds:ids}}
function saveConfig(cfg,adventureId){const id=String(adventureId||currentAdventureId()),all=allConfigs();all[id]={enabled:!!cfg?.enabled,chance:Math.max(0,Math.min(100,Number(cfg?.chance??100))),roomIds:Array.isArray(cfg?.roomIds)?cfg.roomIds.map(String):[]};writeJson(CFG_KEY,all);return all[id]}
function readRuntime(){const x=readJson(RT_KEY,null);return x&&typeof x==="object"?x:null}
function writeRuntime(x){return writeJson(RT_KEY,x||{})}
function activeHeroId(x){const list=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(x?.index)||0));return String(list[i]||"")}
function generatedKind(x){return String(x?.last?.kind||"").toLowerCase()}
function selectedTemplates(cfg,kind){const ids=new Set((cfg?.roomIds||[]).map(String));let rooms=library().filter(r=>!ids.size||ids.has(String(r.id)));if(!rooms.length)return [];
  const k=String(kind||"").toLowerCase();
  if(k==="boss"){const exact=rooms.filter(r=>r.roomType==="boss");if(exact.length)return exact}
  if(k==="merchant"){const exact=rooms.filter(r=>r.roomType==="merchant");if(exact.length)return exact}
  if(k==="rest"){const exact=rooms.filter(r=>r.roomType==="rest");if(exact.length)return exact}
  const normal=rooms.filter(r=>r.roomType!=="boss");return normal.length?normal:rooms;
}
function chooseTemplate(x,cfg){const rooms=selectedTemplates(cfg,generatedKind(x));if(!rooms.length)return null;const roomNo=Math.max(1,Number(x?.room)||1);return rooms[(roomNo-1)%rooms.length]||rooms[0]}
function objectIndices(room,name){const out=[];(room?.cells||[]).forEach((c,i)=>{if(c?.object===name)out.push(i)});return out}
function firstFree(cells,reserved){for(let i=0;i<cells.length;i++){if(reserved.has(i))continue;if(cells[i]==="floor")return i}return -1}
function convertMap(room,lastKind){const width=Math.max(1,Number(room?.width)||1),height=Math.max(1,Number(room?.height)||1);const cells=(room?.cells||[]).map(c=>c?.terrain==="wall"?"wall":String(c?.object||"floor"));const entryIdx=cells.findIndex(v=>v==="entry"),exitIdx=cells.findIndex(v=>v==="exit");
  const marker=MARKER_BY_KIND[String(lastKind||"").toLowerCase()]||"";
  if(marker&&!cells.includes(marker)){
    const reserved=new Set([entryIdx,exitIdx].filter(i=>i>=0));const i=firstFree(cells,reserved);if(i>=0)cells[i]=marker;
  }
  return {size:width,width,height,cells,entryIdx,exitIdx};
}
function enemyAnchors(room,map){const preferred=[];(room?.cells||[]).forEach((c,i)=>{if(c?.object==="enemy"||c?.object==="boss")preferred.push(i)});if(preferred.length)return preferred;const reserved=new Set([map.entryIdx,map.exitIdx].filter(i=>i>=0));const out=[];for(let i=0;i<map.cells.length;i++)if(map.cells[i]==="floor"&&!reserved.has(i))out.push(i);return out}
function remapEnemyCells(enemyCells,anchors){const keys=Object.keys(enemyCells||{}),out={};if(!keys.length)return out;const spots=anchors.length?anchors:[0];keys.forEach((id,i)=>{out[id]=spots[Math.min(i,spots.length-1)]});return out}
function transitionWasCreated(x){const t=x?.dc313LastTransition||x?.dc317LastTransition||null;return !!t&&t.created===true}
function chancePass(chance){const c=Math.max(0,Math.min(100,Number(chance??100)));return c>=100||(c>0&&Math.random()*100<c)}
function persistSpatial(x){try{ROOT.DungeonSpatial313?.ensure?.(x);ROOT.DungeonSpatial313?.persist?.(x)}catch(e){}}
function applyTemplateToCurrentRoom(forceRoom){const x=readRuntime();if(!x||!x.last||x.branch?.active)return false;if(x.last?.customRoomRuntime167822&&!forceRoom)return false;if(!transitionWasCreated(x)&&!forceRoom)return false;
  const cfg=getConfig();if(!cfg.enabled||!chancePass(cfg.chance))return false;const room=forceRoom||chooseTemplate(x,cfg);if(!room||!validRoom(room))return false;
  const map=convertMap(room,x.last.kind),hero=activeHeroId(x),movementLeft=hero&&Number.isFinite(Number(x.remaining?.[hero]))?Number(x.remaining[hero]):null;
  x.last={...x.last,map,customRoomRuntime167822:true,customRoomId:String(room.id),customRoomName:String(room.name||"Pièce personnalisée"),customRoomTheme:String(room.theme||""),customRoomType:String(room.roomType||"room")};
  x.enemyCells=remapEnemyCells(x.enemyCells,enemyAnchors(room,map));
  if(hero&&map.entryIdx>=0){x.positions=x.positions&&typeof x.positions==="object"?x.positions:{};x.positions[hero]=map.entryIdx}
  if(hero&&movementLeft!=null){x.remaining=x.remaining&&typeof x.remaining==="object"?x.remaining:{};x.remaining[hero]=movementLeft}
  persistSpatial(x);writeRuntime(x);return true;
}
function notifyApplied(){try{ROOT.showToast?.("🧱 Pièce personnalisée chargée dans le Dungeon")}catch(e){}}
function installExploreWrapper(){const core=ROOT.DungeonCore01;if(!core||typeof core.explore!=="function")return false;if(core.explore.__drr167822)return true;const old=core.explore.bind(core);const wrapped=function(){const before=readRuntime();const out=old(...arguments);try{const after=readRuntime();if(after&&after!==before&&applyTemplateToCurrentRoom()){try{core.render?.()}catch(e){}notifyApplied()}}catch(e){console.warn("Dungeon room runtime integration",e)}return out};wrapped.__drr167822=true;wrapped.__drr167822Original=old;core.explore=wrapped;return true}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function renderConfigPanel(){if(!DOC)return;const box=DOC.getElementById("drr167822Panel");if(!box)return;const cfg=getConfig(),rooms=library();box.innerHTML='<div style="font-weight:900;margin-bottom:6px">🎮 Pièces utilisées en partie Dungeon</div><label style="display:flex;gap:8px;align-items:center"><input id="drr167822Enabled" type="checkbox" '+(cfg.enabled?'checked':'')+'> Utiliser les pièces créées dans cette aventure</label><label style="display:grid;gap:4px;margin-top:8px">Chance d’utiliser une pièce personnalisée (%)<input id="drr167822Chance" type="number" min="0" max="100" value="'+cfg.chance+'"></label><div style="font-size:12px;color:#aaa;margin:7px 0">Le moteur garde les combats, événements et spawns actuels ; la pièce fournit la géométrie et les emplacements.</div><div id="drr167822Rooms">'+(rooms.length?rooms.map(r=>'<label style="display:flex;gap:7px;align-items:center;margin:4px 0"><input type="checkbox" data-drr-room="'+esc(r.id)+'" '+(cfg.roomIds.includes(String(r.id))?'checked':'')+'> '+esc(r.name)+' · '+r.width+'×'+r.height+'</label>').join(''):'<div style="color:#aaa">Aucune pièce valide enregistrée.</div>')+'</div><button id="drr167822Save" type="button" style="margin-top:8px">💾 APPLIQUER À CETTE AVENTURE</button><div id="drr167822Status" style="font-size:12px;color:#aaa;margin-top:5px"></div>';
  DOC.getElementById("drr167822Save")?.addEventListener("click",()=>{const ids=[...DOC.querySelectorAll('[data-drr-room]:checked')].map(x=>String(x.dataset.drrRoom||""));saveConfig({enabled:!!DOC.getElementById("drr167822Enabled")?.checked,chance:Number(DOC.getElementById("drr167822Chance")?.value||0),roomIds:ids});const s=DOC.getElementById("drr167822Status");if(s)s.textContent="✓ Configuration enregistrée pour cette aventure."});
}
function ensureConfigPanel(){if(!DOC||DOC.getElementById("drr167822Panel"))return;const launcher=DOC.getElementById("drc100Launcher")||DOC.getElementById("dungeonAdvancedEditor")?.querySelector(".panel");if(!launcher)return;const box=DOC.createElement("div");box.id="drr167822Panel";box.style.cssText="margin-top:10px;padding:10px;border:1px solid #4b3f31;border-radius:10px;background:#12100d";launcher.appendChild(box);renderConfigPanel()}
function install(){if(installing)return false;installing=true;try{ROOT.GENSRPG_VERSION=APP_VERSION;installExploreWrapper();ensureConfigPanel();return true}finally{installing=false}}
ROOT.DungeonRoomRuntime167822={VERSION,APP_VERSION,CFG_KEY,getConfig,saveConfig,selectedTemplates,convertMap,remapEnemyCells,applyTemplateToCurrentRoom,install,renderConfigPanel};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install();if(typeof MutationObserver==="function")new MutationObserver(()=>{installExploreWrapper();ensureConfigPanel()}).observe(DOC.documentElement,{childList:true,subtree:true})}
else installExploreWrapper();
if(typeof setTimeout==="function")setTimeout(install,0);
})();
