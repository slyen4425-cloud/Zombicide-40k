/* GenSrpG V16.78.20 — live world-card summaries.
   Recomputes built-in Dungeon / Monster Capture card counts from live content sources.
   Does not mutate world profiles, saves, gameplay, movement, combat, timeline or spawn. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="16.78.20";
const DUNGEON_ID="game_profile_dungeon_demo";
const CAPTURE_ID="gp_mt7ker7t_m2iw9";
let patchTimer=0;

function arr(v){return Array.isArray(v)?v:[]}
function idOf(v){return typeof v==="string"?v:String(v?.id||"")}
function uniqueCount(values){const s=new Set();for(const v of arr(values)){const id=idOf(v).trim();if(id)s.add(id)}return s.size}
function readJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||"");return v??fallback}catch(e){return fallback}}
function call(name,args,fallback){try{const fn=ROOT[name];return typeof fn==="function"?(fn.apply(ROOT,arr(args))??fallback):fallback}catch(e){return fallback}}
function profileById(id){const list=arr(call("rpgProfiles",[],[]));return list.find(p=>String(p?.id||"")===String(id||""))||null}
function recordFamily(record){
  const explicit=String(record?.contentFamily||"").toLowerCase();if(explicit)return explicit;
  if(String(record?.universeId||"")===CAPTURE_ID)return "creature";
  if(String(record?.type||"").toLowerCase()==="objet de capture")return "creature";
  return "rpg";
}
function isCaptureRecord(record){return recordFamily(record)==="creature"||String(record?.universeId||"")===CAPTURE_ID}
function isDungeonRecord(record){return !isCaptureRecord(record)&&String(record?.gameMode||"dungeon")==="dungeon"}
function plural(n,one,many){return Number(n)===1?one:many}

function dungeonSummary(profile){
  const content=call("dungeonContentIds",[],{})||{};
  const builtinHeroes=arr(content.heroes);
  const liveItems=arr(call("dungeonItems",[],[]));
  const customHeroes=arr(call("loadCustomHeroesMulti",[],[])).filter(h=>isDungeonRecord(h));
  const customItems=arr(call("loadCustomEquipment",[],[])).filter(it=>isDungeonRecord(it));
  const runtimeEnemies=arr(call("enemiesForMode",[true],[])).filter(e=>!isCaptureRecord(e));
  const customEnemies=arr(call("loadCustomEnemies",[],[])).filter(e=>isDungeonRecord(e));
  const fallbackEnemies=arr(content.enemies);
  const heroes=uniqueCount([...builtinHeroes,...customHeroes]);
  const objects=uniqueCount([...liveItems,...customItems]);
  const monsters=uniqueCount(runtimeEnemies.length?[...runtimeEnemies,...customEnemies]:[...fallbackEnemies,...customEnemies]);
  return {kind:"dungeon",live:true,heroes,objects,monsters,text:`${heroes} ${plural(heroes,"héros","héros")} · ${objects} ${plural(objects,"objet","objets")} · ${monsters} ${plural(monsters,"monstre","monstres")}`};
}

function captureEntities(profileId){
  const exact=arr(readJson("gensrpg_shared_entities_v1__"+profileId,[]));
  if(exact.length)return exact.filter(e=>!e||typeof e!=="object"||e.category==="creature"||e.contentFamily==="creature"||!e.category);
  const family=arr(readJson("gensrpg_shared_entities_v1__family__creature",[]));
  return family.filter(e=>String(e?.universeId||"")===profileId||String(e?.universeId||"")==="starter_capture"||String(e?.contentFamily||"")==="creature");
}
function captureSummary(profile){
  const p=profile||profileById(CAPTURE_ID)||{id:CAPTURE_ID,heroPool:[]};
  const pid=String(p.id||CAPTURE_ID);
  const allHeroes=arr(call("loadCustomHeroesMulti",[],[]));
  let trainers=allHeroes.filter(h=>String(h?.universeId||"")===pid);
  if(!trainers.length&&pid===CAPTURE_ID)trainers=allHeroes.filter(h=>isCaptureRecord(h)&&String(h?.role||"").toLowerCase().includes("héros"));
  const trainerCount=trainers.length?uniqueCount(trainers):uniqueCount(arr(p.heroPool));
  const creatures=uniqueCount(captureEntities(pid));
  const starterItems=arr(call("gensStarterCaptureItems",[],[]));
  const customCaptureItems=arr(call("loadCustomEquipment",[],[])).filter(it=>isCaptureRecord(it)&&(!it.universeId||String(it.universeId)===pid||pid===CAPTURE_ID));
  const objects=uniqueCount([...starterItems,...customCaptureItems]);
  return {kind:"capture",live:true,trainers:trainerCount,creatures,objects,text:`${trainerCount} ${plural(trainerCount,"dresseur","dresseurs")} · ${creatures} ${plural(creatures,"créature","créatures")} · ${objects} ${plural(objects,"objet","objets")}`};
}
function legacySummary(profile){const p=profile||{};const heroes=arr(p.heroPool).length,objects=arr(p.objectPool).length,monsters=Object.keys(p.enemyConfig||{}).length;return {kind:"legacy",live:false,heroes,objects,monsters,text:`${heroes} héros · ${objects} objets · ${monsters} monstres`}}
function summarizeProfile(profile){const id=String(profile?.id||"");if(id===DUNGEON_ID)return dungeonSummary(profile);if(id===CAPTURE_ID||String(profile?.rpgUniverse?.gameplay?.profile||"")==="creature")return captureSummary(profile);return legacySummary(profile)}
function summarizeId(id){const sid=String(id||"");if(sid===DUNGEON_ID)return dungeonSummary(profileById(sid));if(sid===CAPTURE_ID)return captureSummary(profileById(sid));const p=profileById(sid);return p?legacySummary(p):null}

function summaryNode(card){
  const smalls=Array.from(card?.querySelectorAll?.("small")||[]);
  return smalls.find(el=>/héros\s*·|objets\s*·|monstres/i.test(String(el.textContent||"")))||smalls[0]||null;
}
function patchCards(){
  if(!DOC)return 0;let changed=0;
  DOC.querySelectorAll?.(".gensUniverseCard[data-rpg-profile]")?.forEach(card=>{
    const id=String(card.dataset?.rpgProfile||card.getAttribute?.("data-rpg-profile")||"");
    if(id!==DUNGEON_ID&&id!==CAPTURE_ID)return;
    const summary=summarizeId(id),node=summaryNode(card);if(!summary||!node)return;
    if(String(node.textContent||"")!==summary.text){node.textContent=summary.text;node.dataset.gensLiveSummary="167820";changed++}
  });
  return changed;
}
function schedulePatch(){if(!DOC)return;if(patchTimer)return;patchTimer=setTimeout(()=>{patchTimer=0;patchCards()},0)}
function install(){if(!DOC)return;patchCards();if(typeof MutationObserver==="function"){const target=DOC.body||DOC.documentElement;if(target)new MutationObserver(schedulePatch).observe(target,{childList:true,subtree:true})}}

ROOT.GensWorldSummary167820={VERSION,DUNGEON_ID,CAPTURE_ID,dungeonSummary,captureSummary,legacySummary,summarizeProfile,summarizeId,patchCards,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
