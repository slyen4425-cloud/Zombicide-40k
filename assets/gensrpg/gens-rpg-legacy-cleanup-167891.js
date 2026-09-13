/* GenSrpG V16.78.93 — audit stats / persistance / neutralisation legacy.
   - Les anciens coefficients Dungeon restent lisibles dans les sauvegardes mais n'agissent plus.
   - Les nouvelles stats/effets restent actifs et leurs cases sont autosauvegardées.
   - Le nettoyage UI est rejoué après les renderers tardifs. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.93";
const ALIAS={agility:"agilite",spirit:"esprit",strength:"force",dexterity:"agilite",wisdom:"esprit",constitution:"endurance"};
const LEGACY=[
 ["force","damage:physical","physicalDamageStep","physicalDamageGain"],
 ["intelligence","damage:magic","magicDamageStep","magicDamageGain"],
 ["endurance","max_hp","enduranceHpStep","hpGain"],
 ["esprit","max_mana","spiritManaStep","manaGain"],
 ["agilite","crit","agilityCritStep","critGain"],
 ["agilite","dodge","agilityDodgeStep","dodgeGain"],
 ["force","hit:melee","meleeHitStep","meleeHitGain"],
 ["agilite","hit:ranged","rangedHitStep","rangedHitGain"],
 ["intelligence","hit:magic","magicHitStep","magicHitGain"],
 ["esprit","magic_resistance","spiritMagicResistStep","magicResistGain"]
];
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const canon=id=>ALIAS[String(id||"")]||String(id||"");
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim().toLowerCase();
function dungeon(){try{return !!R.isDungeonMode?.()}catch(_){return false}}
function rules(){try{return R.loadDungeonRpgRules?.()||{}}catch(_){return {}}}
function attr(id){try{return num(R.dungeonAttributeValue?.(canon(id)),0)}catch(_){return 0}}
function legacyAmount(target){
 if(!dungeon())return 0;
 const r=rules();
 return LEGACY.filter(x=>x[1]===target).reduce((sum,x)=>{
  const step=Math.max(1,num(r[x[2]],10)),gain=num(r[x[3]],0);
  return sum+Math.floor(attr(x[0])/step)*gain;
 },0);
}
function wrap(name,adjust){
 const old=R[name];
 if(typeof old!=="function"||old.__legacyClean793)return false;
 const w=function(){return adjust(this,old,arguments)};
 w.__legacyClean793=true;w.__original=old;R[name]=w;return true;
}
function installRuntime(){
 let n=0;
 n+=wrap("dungeonPhysicalDamageBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("damage:physical"))?1:0;
 n+=wrap("dungeonMagicDamageBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("damage:magic"))?1:0;
 n+=wrap("dungeonEnduranceHpBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("max_hp"))?1:0;
 n+=wrap("dungeonMaxMana",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("max_mana")))?1:0;
 n+=wrap("dungeonCriticalChance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("crit")))?1:0;
 n+=wrap("dungeonDodgeChance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("dodge")))?1:0;
 n+=wrap("dungeonMagicResistance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("magic_resistance")))?1:0;
 n+=wrap("applyDungeonCombatScaling",(ctx,old,args)=>{
  const out=old.apply(ctx,args);
  if(!dungeon()||!out||!args[0]?.rpgScaling)return out;
  const mode=args[0].rpgScaling.magic?"magic":(out.melee?"melee":"ranged");
  out.hitChance=Math.max(0,num(out.hitChance,0)-legacyAmount("hit:"+mode));
  return out;
 })?1:0;
 return n;
}
function hideNode(node){if(node&&node.style)node.style.display="none"}
function hideLabel(text){
 if(!D)return;
 const wanted=norm(text);
 for(const label of D.querySelectorAll("label"))if(norm(label.textContent).includes(wanted))hideNode(label);
}
function hideLegacySection(){
 if(!D)return false;
 const wanted="modificateurs par caracteristique";
 const candidates=[];
 for(const el of D.querySelectorAll("section,div,fieldset")){
  const t=norm(el.textContent);
  if(!t.includes(wanted))continue;
  if(!t.includes("degats physiques")||!t.includes("degats magiques"))continue;
  candidates.push([el,t.length]);
 }
 candidates.sort((a,b)=>a[1]-b[1]);
 if(candidates[0]){hideNode(candidates[0][0]);return true}
 for(const el of D.querySelectorAll("h1,h2,h3,h4,strong,div,span")){
  if(!norm(el.textContent).includes(wanted))continue;
  let p=el.parentElement;
  while(p&&p!==D.body){
   const t=norm(p.textContent);
   if(t.includes("degats physiques")&&t.includes("degats magiques")){hideNode(p);return true}
   p=p.parentElement;
  }
 }
 return false;
}
function cleanUi(){
 if(!D)return false;
 hideLabel("PV / 10 Endurance");
 hideLabel("Mana / 10 Esprit");
 hideLegacySection();
 for(const row of D.querySelectorAll('[data-effect-id^="legacy_"]'))hideNode(row);
 for(const el of D.querySelectorAll(".small")){
  if(norm(el.textContent).includes("les effets historiques restent ceux du moteur dungeon"))
   el.textContent="Les effets configurés ici sont les seuls modificateurs de caractéristiques utilisés par le nouveau système.";
 }
 return true;
}
let saveTimer=0;
function saveStatsNow(){
 if(!D)return false;
 const host=D.getElementById("rpgStatsList"),api=R.GensCleanRpgStats167874;
 if(!host||typeof api?.syncEditor!=="function")return false;
 try{return !!api.syncEditor(host)}catch(e){console.warn("stats autosave",e);return false}
}
function queueSave(delay=180){
 if(!D)return;
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{saveStatsNow();cleanUi()},delay);
}
function bindAutosave(){
 if(!D||D.documentElement?.dataset?.statsAutosave793)return false;
 if(D.documentElement)D.documentElement.dataset.statsAutosave793="1";
 D.addEventListener("change",e=>{
  const t=e.target;if(!t?.closest?.("#rpgStatsList"))return;
  if(t.matches?.("[data-active]"))queueSave(0);else queueSave(80);
 },true);
 D.addEventListener("input",e=>{if(e.target?.closest?.("#rpgStatsList"))queueSave(220)},true);
 D.addEventListener("visibilitychange",()=>{if(D.visibilityState==="hidden")saveStatsNow()},true);
 R.addEventListener?.("pagehide",saveStatsNow,true);
 return true;
}
function install(){
 try{R.GENSRPG_VERSION=APP_VERSION}catch(_){}
 installRuntime();bindAutosave();cleanUi();
 for(const ms of [0,50,250,1000,2500])setTimeout(()=>{installRuntime();cleanUi()},ms);
 if(D&&typeof MutationObserver==="function"){
  const obs=new MutationObserver(()=>cleanUi());
  obs.observe(D.documentElement||D.body,{childList:true,subtree:true});
 }
 return true;
}
R.GensRpgLegacyCleanup167891={VERSION,APP_VERSION,LEGACY,legacyAmount,installRuntime,cleanUi,saveStatsNow,bindAutosave,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}else install();
})();