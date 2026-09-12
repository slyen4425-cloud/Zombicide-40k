/* GenSrpG V16.78.93 — retire les anciens réglages de coefficients RPG.
   Les valeurs historiques restent lisibles dans les sauvegardes pour compatibilité,
   mais ne participent plus aux calculs. Les effets du nouvel éditeur restent actifs. */
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
const LEGACY_KEYS=[...new Set(LEGACY.flatMap(x=>[x[2],x[3]]))];
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
 if(typeof old!=="function"||old.__legacyClean791)return false;
 const w=function(){return adjust(this,old,arguments)};
 w.__legacyClean791=true;w.__original=old;R[name]=w;return true;
}
function installRuntime(){
 wrap("dungeonPhysicalDamageBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("damage:physical"));
 wrap("dungeonMagicDamageBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("damage:magic"));
 wrap("dungeonEnduranceHpBonus",(ctx,old,args)=>num(old.apply(ctx,args),0)-legacyAmount("max_hp"));
 wrap("dungeonMaxMana",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("max_mana")));
 wrap("dungeonCriticalChance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("crit")));
 wrap("dungeonDodgeChance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("dodge")));
 wrap("dungeonMagicResistance",(ctx,old,args)=>Math.max(0,num(old.apply(ctx,args),0)-legacyAmount("magic_resistance")));
 wrap("applyDungeonCombatScaling",(ctx,old,args)=>{
  const out=old.apply(ctx,args);
  if(!dungeon()||!out||!args[0]?.rpgScaling)return out;
  const mode=args[0].rpgScaling.magic?"magic":(out.melee?"melee":"ranged");
  out.hitChance=Math.max(0,num(out.hitChance,0)-legacyAmount("hit:"+mode));
  return out;
 });
 return true;
}
function hideNode(node){if(node&&node.style)node.style.setProperty("display","none","important")}
function smallestFieldRow(node){
 if(!node)return null;
 let cur=node;
 for(let i=0;i<5&&cur&&cur!==D.body;i++,cur=cur.parentElement){
  const controls=cur.querySelectorAll?.("input,select,textarea")?.length||0;
  const text=norm(cur.textContent);
  if(controls>=1&&controls<=2&&text.length<300)return cur;
 }
 return node.closest?.("label")||node.parentElement||node;
}
function hideTextField(text){
 if(!D)return;
 const wanted=norm(text);
 for(const el of D.querySelectorAll("label,span,div,p,strong")){
  if(!norm(el.textContent).includes(wanted))continue;
  const row=smallestFieldRow(el);
  if(row)hideNode(row);
 }
}
function hideLegacyControls(){
 if(!D)return;
 for(const key of LEGACY_KEYS){
  const low=key.toLowerCase();
  for(const el of D.querySelectorAll("input,select,textarea,[data-field],[data-key],[data-rule]")){
   const hay=[el.id,el.name,el.getAttribute?.("data-field"),el.getAttribute?.("data-key"),el.getAttribute?.("data-rule")].filter(Boolean).join(" ").toLowerCase();
   if(hay.includes(low))hideNode(smallestFieldRow(el));
  }
 }
}
function hideLegacySection(){
 if(!D)return;
 const wanted="modificateurs par caracteristique";
 for(const heading of D.querySelectorAll("h1,h2,h3,h4,h5,strong,.sectionTitle,.title,legend")){
  if(!norm(heading.textContent).includes(wanted))continue;
  let box=heading.parentElement;
  for(let i=0;i<4&&box;i++,box=box.parentElement){
   const text=norm(box.textContent);
   const controls=box.querySelectorAll?.("input,select,textarea")?.length||0;
   if(controls>0&&controls<=24&&text.includes(wanted)&&!text.includes("pv de base")&&!text.includes("mana de base")){hideNode(box);return}
  }
  hideNode(heading);
 }
}
function cleanUi(){
 if(!D)return false;
 hideTextField("PV / 10 Endurance");
 hideTextField("Mana / 10 Esprit");
 hideLegacyControls();
 hideLegacySection();
 for(const row of D.querySelectorAll('[data-effect-id^="legacy_"]'))hideNode(row);
 for(const el of D.querySelectorAll(".small")){
  if(norm(el.textContent).includes("les effets historiques restent ceux du moteur dungeon"))
   el.textContent="Les effets configurés ici sont les seuls modificateurs de caractéristiques utilisés par le nouveau système.";
 }
 return true;
}
function install(){
 try{R.GENSRPG_VERSION=APP_VERSION}catch(_){}
 installRuntime();cleanUi();
 if(D&&typeof MutationObserver==="function"){
  const obs=new MutationObserver(()=>cleanUi());
  obs.observe(D.documentElement||D.body,{childList:true,subtree:true});
 }
 return true;
}
R.GensRpgLegacyCleanup167891={VERSION,APP_VERSION,LEGACY,LEGACY_KEYS,legacyAmount,installRuntime,cleanUi,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}else install();
})();
