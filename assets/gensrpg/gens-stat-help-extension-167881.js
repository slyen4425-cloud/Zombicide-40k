/* GenSrpG V16.78.88 — generic characteristic links, single source of truth + custom-stat UI parity.
   Static extension only; no spatial combat, navigation, spawn or timeline changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="2.1.0",APP_VERSION="16.78.88";
const CORE_STATS=[
  {id:"force",name:"Force",icon:"💪"},
  {id:"agilite",name:"Agilité",icon:"🏃"},
  {id:"intelligence",name:"Intelligence",icon:"🧠"},
  {id:"esprit",name:"Esprit",icon:"✨"},
  {id:"endurance",name:"Endurance",icon:"❤️"},
  {id:"initiative",name:"Initiative",icon:"⚡"}
];
const TARGETS=[
  {id:"damage:all",name:"Tous les dégâts",kind:"amount",icon:"💥"},
  {id:"damage:physical",name:"Dégâts physiques",kind:"amount",icon:"⚔️"},
  {id:"damage:melee",name:"Dégâts de mêlée",kind:"amount",icon:"🗡️"},
  {id:"damage:ranged",name:"Dégâts à distance",kind:"amount",icon:"🏹"},
  {id:"damage:magic",name:"Dégâts magiques",kind:"amount",icon:"✨"},
  {id:"hit:all",name:"Précision / toucher général",kind:"rate",icon:"🎯"},
  {id:"hit:melee",name:"Précision de mêlée",kind:"rate",icon:"🎯"},
  {id:"hit:ranged",name:"Précision à distance",kind:"rate",icon:"🎯"},
  {id:"hit:magic",name:"Précision magique",kind:"rate",icon:"🎯"},
  {id:"max_hp",name:"PV maximum",kind:"amount",icon:"❤️"},
  {id:"max_mana",name:"Mana maximum",kind:"amount",icon:"🔷"},
  {id:"crit",name:"Critique",kind:"rate",icon:"💥"},
  {id:"dodge",name:"Esquive",kind:"rate",icon:"💨"},
  {id:"initiative",name:"Initiative dérivée",kind:"amount",icon:"⚡"},
  {id:"defense",name:"Défense",kind:"amount",icon:"🛡️"},
  {id:"armor",name:"Armure",kind:"amount",icon:"🧱"},
  {id:"magic_resistance",name:"Résistance magique",kind:"amount",icon:"🔮"},
  {id:"movement",name:"Déplacement",kind:"amount",icon:"👣"}
];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const attr=esc;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const slug=v=>String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_:-]+/g,"_").replace(/^_+|_+$/g,"");
function profile(){try{return R.currentRpgProfile?.()||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(list){try{R.saveGameProfiles?.(list);return true}catch(e){return false}}
function customStats(){try{return R.GensCustomStats167879?.defs?.()||[]}catch(e){return []}}
function statCatalog(){
  const out=CORE_STATS.map(x=>({...x,custom:false}));
  for(const d of customStats()){
    const id=String(d?.id||"");
    if(id&&!out.some(x=>x.id===id))out.push({id,name:String(d?.name||id),icon:String(d?.icon||"📊"),custom:true});
  }
  return out;
}
function targetCatalog(){return TARGETS.slice()}
function statMeta(id){return statCatalog().find(x=>x.id===String(id))||{id:String(id||""),name:String(id||"Stat"),icon:"📊",custom:true}}
function targetMeta(id){return TARGETS.find(x=>x.id===String(id))||{id:String(id||""),name:String(id||"Valeur"),kind:"amount",icon:"📐"}}
function legacy(){try{return R.loadDungeonRpgRules?.()||{}}catch(e){return {}}}
function defaultRules(){
  const r=legacy(),out=[];
  const add=(id,source,target,calc,step,value,unit="flat",enabled=true)=>{
    value=Number(value)||0;step=Math.max(1,Number(step)||1);
    if(!enabled||!value)return;
    out.push({id,enabled:true,source,target,calc:calc==="perPoint"?"perPoint":"step",step,value,unit:unit==="percent"?"percent":"flat"});
  };
  if(r.physicalDamageFormula==="percent")add("legacy_damage_physical","force","damage:physical","perPoint",1,r.physicalDamagePercentPerPoint,"percent");
  else add("legacy_damage_physical","force","damage:physical","step",r.physicalDamageStep||10,r.physicalDamageGain||1,"flat");
  if(r.magicDamageFormula==="percent")add("legacy_damage_magic","intelligence","damage:magic","perPoint",1,r.magicDamagePercentPerPoint,"percent");
  else add("legacy_damage_magic","intelligence","damage:magic","step",r.magicDamageStep||10,r.magicDamageGain||1,"flat");
  if(r.rangedDamageFormula==="percent")add("legacy_damage_ranged","agilite","damage:ranged","perPoint",1,r.rangedDamagePercentPerPoint,"percent");
  add("legacy_hit_melee","force","hit:melee","step",r.meleeHitStep||10,r.meleeHitGain||5,"flat");
  add("legacy_hit_ranged","agilite","hit:ranged","step",r.rangedHitStep||10,r.rangedHitGain||5,"flat");
  add("legacy_hit_magic","intelligence","hit:magic","step",r.magicHitStep||10,r.magicHitGain||5,"flat");
  if(r.hpFormula==="percent")add("legacy_hp","endurance","max_hp","perPoint",1,r.hpPercentPerPoint,"percent");
  else add("legacy_hp","endurance","max_hp","step",r.enduranceHpStep||10,r.hpGain||2,"flat");
  if(r.manaFormula==="percent")add("legacy_mana","esprit","max_mana","perPoint",1,r.manaPercentPerPoint,"percent");
  else add("legacy_mana","esprit","max_mana","step",r.spiritManaStep||10,r.manaGain||10,"flat");
  if(r.critFormula==="perPoint")add("legacy_crit","agilite","crit","perPoint",1,r.critPercentPerPoint||0,"flat");
  else add("legacy_crit","agilite","crit","step",r.agilityCritStep||10,r.critGain||5,"flat");
  if(r.dodgeFormula==="perPoint")add("legacy_dodge","agilite","dodge","perPoint",1,r.dodgePercentPerPoint||0,"flat");
  else add("legacy_dodge","agilite","dodge","step",r.agilityDodgeStep||10,r.dodgeGain||3,"flat");
  if(r.magicResistFormula==="perPoint")add("legacy_magic_res","esprit","magic_resistance","perPoint",1,r.magicResistPerPoint||0,"flat");
  else add("legacy_magic_res","esprit","magic_resistance","step",r.spiritMagicResistStep||10,r.magicResistGain||0,"flat");
  if(r.initiativeFormula==="perPoint")add("legacy_initiative","agilite","initiative","perPoint",1,r.initiativePerPoint||0,"flat");
  else if(Number(r.initiativeGain))add("legacy_initiative","agilite","initiative","step",r.agilityInitiativeStep||10,r.initiativeGain,"flat");
  return out;
}
function normalizeRule(x,i=0){
  if(!x||typeof x!=="object")return null;
  const source=String(x.source||x.sourceStatId||""),target=String(x.target||"");
  if(!source||!TARGETS.some(t=>t.id===target))return null;
  return {id:slug(x.id||("link_"+(i+1)))||("link_"+(i+1)),enabled:x.enabled!==false,source,target,calc:x.calc==="perPoint"?"perPoint":"step",step:Math.max(1,Number(x.step)||1),value:Number(x.value)||0,unit:x.unit==="percent"&&targetMeta(target).kind==="amount"?"percent":"flat"};
}
function ensureRules(p=profile()){
  if(!p?.rpgUniverse)return [];
  const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
  if(!Array.isArray(s.derivedRules)){s.derivedRules=defaultRules();s.derivedRulesVersion=1;persistProfile(p)}
  s.derivedRules=s.derivedRules.map(normalizeRule).filter(Boolean);return s.derivedRules;
}
function rules(){return ensureRules(profile())}
function persistProfile(p){if(!p)return false;const all=profiles(),i=all.findIndex(x=>String(x.id||"")===String(p.id||""));if(i>=0){all[i]=p;saveProfiles(all);return true}return false}
function persistRules(list){
  const p=profile();if(!p?.rpgUniverse)return false;
  const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
  s.derivedRules=(list||[]).map(normalizeRule).filter(Boolean);s.derivedRulesVersion=1;
  const ok=persistProfile(p);try{R.applyGameProfile?.(p,false)}catch(e){}
  renderLinksEditor();try{R.renderDungeonAttributes?.();R.renderDungeonHeroStats?.()}catch(e){}return ok;
}
function currentHero(){try{return String(R.current||"")}catch(e){return ""}}
function sourceValue(source,hero=currentHero()){
  const m=statMeta(source);
  if(m.custom){try{return Number(R.GensCustomStats167879?.value?.(hero,source))||0}catch(e){return 0}}
  try{return Number(R.dungeonAttributeValue?.(source))||0}catch(e){}
  try{const st=R.loadState?.(hero)||{};return Number(st?.rpgAttributes?.[source])||0}catch(e){return 0}
}
function ruleRaw(rule,hero){const v=sourceValue(rule.source,hero);return rule.calc==="perPoint"?v*rule.value:Math.floor(v/Math.max(1,rule.step))*rule.value}
function totals(target,hero=currentHero()){let flat=0,percent=0;for(const r of rules()){if(!r.enabled||r.target!==target)continue;const n=ruleRaw(r,hero);if(r.unit==="percent")percent+=n;else flat+=n}return {flat,percent}}
function combineTargets(targets,hero=currentHero()){let flat=0,percent=0;for(const t of targets){const x=totals(t,hero);flat+=x.flat;percent+=x.percent}return {flat,percent}}
function applyTarget(base,target,hero=currentHero(),limits={}){const t=totals(target,hero),b=Number(base)||0;return clamp(b+t.flat+b*t.percent/100,limits.min??-Infinity,limits.max??Infinity)}
function damageTargets(mode){if(mode==="magic")return ["damage:all","damage:magic"];if(mode==="ranged")return ["damage:all","damage:physical","damage:ranged"];return ["damage:all","damage:physical","damage:melee"]}
function hitTargets(mode){return ["hit:all","hit:"+(mode==="magic"?"magic":mode==="ranged"?"ranged":"melee")]}
let enemyAttackContext=false;
function descriptionForSource(id){const linked=rules().filter(r=>r.enabled&&r.source===id);if(!linked.length)return "Aucune liaison automatique.";return linked.map(r=>targetMeta(r.target).name).filter((v,i,a)=>a.indexOf(v)===i).join(" · ")}
function explainRule(r){const s=statMeta(r.source),t=targetMeta(r.target),left=r.calc==="perPoint"?"1 "+s.name:Math.max(1,r.step)+" "+s.name,sign=r.value>=0?"+":"−",val=Math.abs(r.value),suffix=r.unit==="percent"?"% de la base":"";return left+" = "+sign+val+(suffix?" "+suffix:"")+" "+t.name}
function explainTarget(target){const set=rules().filter(r=>r.enabled&&r.target===target);return set.length?set.map(explainRule).join(" · "):"Aucune caractéristique liée."}
function statOptions(selected){return statCatalog().map(s=>'<option value="'+attr(s.id)+'"'+(s.id===selected?' selected':'')+'>'+esc((s.icon?s.icon+" ":"")+s.name)+'</option>').join("")}
function targetOptions(selected){return TARGETS.map(t=>'<option value="'+attr(t.id)+'"'+(t.id===selected?' selected':'')+'>'+esc(t.icon+" "+t.name)+'</option>').join("")}
function ruleRow(r,i){
  const amount=targetMeta(r.target).kind==="amount";
  return '<div class="v2LibCard gsr8787Rule" data-i="'+i+'" style="margin:8px 0"><div class="v2LibHead"><strong>🔗 '+esc(statMeta(r.source).name)+' → '+esc(targetMeta(r.target).name)+'</strong><button type="button" onclick="GensGenericStats167887.removeRule('+i+')">🗑️</button></div><div class="grid2" style="gap:8px"><label><input data-gr="enabled" type="checkbox"'+(r.enabled?' checked':'')+'> Actif</label><label>Caractéristique source<select data-gr="source">'+statOptions(r.source)+'</select></label><label>Valeur influencée<select data-gr="target">'+targetOptions(r.target)+'</select></label><label>Calcul<select data-gr="calc"><option value="step"'+(r.calc==="step"?' selected':'')+'>Par palier</option><option value="perPoint"'+(r.calc==="perPoint"?' selected':'')+'>Par point</option></select></label><label>Palier<input data-gr="step" type="number" min="1" max="9999" value="'+r.step+'"'+(r.calc==="perPoint"?' disabled':'')+'></label><label>Bonus / malus<input data-gr="value" type="number" step="0.1" min="-9999" max="9999" value="'+r.value+'"></label>'+(amount?'<label>Unité<select data-gr="unit"><option value="flat"'+(r.unit==="flat"?' selected':'')+'>Valeur fixe</option><option value="percent"'+(r.unit==="percent"?' selected':'')+'>% de la valeur de base</option></select></label>':'<input data-gr="unit" type="hidden" value="flat">')+'</div><div class="small" style="margin-top:7px">'+esc(explainRule(r))+'</div></div>';
}
function collectRules(){if(!D)return rules();return [...D.querySelectorAll("#gsr167887List .gsr8787Rule")].map((el,i)=>normalizeRule({id:rules()[i]?.id||("link_"+(i+1)),enabled:el.querySelector('[data-gr="enabled"]')?.checked,source:el.querySelector('[data-gr="source"]')?.value,target:el.querySelector('[data-gr="target"]')?.value,calc:el.querySelector('[data-gr="calc"]')?.value,step:el.querySelector('[data-gr="step"]')?.value,value:el.querySelector('[data-gr="value"]')?.value,unit:el.querySelector('[data-gr="unit"]')?.value},i)).filter(Boolean)}
function addRule(){const a=collectRules(),source=statCatalog()[0]?.id||"force";a.push(normalizeRule({id:"link_"+Date.now(),enabled:true,source,target:"defense",calc:"step",step:10,value:1,unit:"flat"},a.length));persistRules(a)}
function removeRule(i){const a=collectRules();a.splice(Number(i),1);persistRules(a)}
function saveRules(){return persistRules(collectRules())}
function refreshDraft(){const a=collectRules(),p=profile();if(p?.rpgUniverse){p.rpgUniverse.stats.derivedRules=a}renderLinksEditor(false)}
function cleanOldEditorUi(){
  if(!D)return;
  if(!D.getElementById("gsr167887CleanupStyle")){const st=D.createElement("style");st.id="gsr167887CleanupStyle";st.textContent='div.smodCard:has(#rpgPhysicalFormula),#gcsStealthSettings,#gsr167880Box,#gsr167880HeroActions,#gcs167879Box label:has([data-gcs="usage"]),#gcs167879Box details:has(.gcsEffects){display:none!important} #gsr167887Box .v2LibActions button{width:100%;font-size:18px;padding:15px}';D.head?.appendChild(st)}
  const old=D.getElementById("rpgPhysicalFormula")?.closest(".smodCard");if(old)old.style.display="none";
  const gsr=D.getElementById("gsr167880Box");if(gsr)gsr.style.display="none";const heroTests=D.getElementById("gsr167880HeroActions");if(heroTests)heroTests.style.display="none";
  try{R.__gsr167880Observer?.disconnect?.()}catch(e){}R.__gsr167880Observer=R.__gsr167880Observer||{disabled:true,disconnect(){}};
  const stealth=D.getElementById("gcsStealthSettings");if(stealth)stealth.style.display="none";
  for(const x of D.querySelectorAll('#gcs167879Box [data-gcs="usage"]')){const l=x.closest("label");if(l)l.style.display="none"}
  for(const x of D.querySelectorAll("#gcs167879Box .gcsEffects")){const d=x.closest("details");if(d)d.style.display="none"}
  for(const small of D.querySelectorAll('#rpgStatsList [data-gcs-primary="1"] small'))if(/personnalis/i.test(small.textContent||""))small.remove();
  for(const o of D.querySelectorAll("select option"))o.textContent=(o.textContent||"").replace(/\s*[·(]\s*personnalisée\)?/gi,"").trim();
}
function renderLinksEditor(sync=true){
  if(!D)return false;const tab=D.getElementById("rpgTab_stats");if(!tab)return false;if(sync)ensureRules();let box=D.getElementById("gsr167887Box");if(!box){box=D.createElement("div");box.id="gsr167887Box";box.className="v2LibCard";box.style.marginTop="12px";tab.appendChild(box)}
  box.innerHTML='<div class="v2LibHead"><strong>📐 Liaisons caractéristiques → valeurs</strong><button type="button" onclick="GensGenericStats167887.addRule()">＋ AJOUTER</button></div><div class="small">Source unique des formules de caractéristiques. Toute stat active, native ou créée, peut piloter n’importe quelle valeur ci-dessous.</div><div class="small" style="margin-top:5px">✅ Enregistrement automatique actif à chaque modification.</div><div id="gsr167887List">'+rules().map(ruleRow).join("")+'</div><div class="v2LibActions"><button type="button" onclick="GensGenericStats167887.saveRules()">💾 ENREGISTRER MAINTENANT</button></div>';
  box.onchange=e=>{if(e.target?.closest?.("#gsr167887List")){saveRules();try{R.showToast?.("✅ Liaisons enregistrées")}catch(err){}}};
  cleanOldEditorUi();return true;
}
function restoreOldCustomHooks(){
  const names=["dungeonAttributeValue","dungeonHeroMoveValue083","dungeonDerivedDefense","dungeonArmorScore","dungeonMagicResistance","dungeonCriticalChance","dungeonDodgeChance","effectiveMaxWounds","dungeonMaxMana","effectiveAttackStats"];
  for(const n of names){const f=R[n];if(typeof f==="function"&&f.__gcsEffects167881&&typeof f.__gcsOriginal==="function")R[n]=f.__gcsOriginal;if(typeof R[n]==="function")R[n].__gcsEffects167881=true}
  for(const n of ["dc047StealthPrompt","dc047ResolveStealth","dungeonCombatAttack","dungeonCombatBasicAttack","dungeonCombatUseActiveTalent","dungeonCombatUseItemAbility316"]){const f=R[n];if(typeof f==="function"&&f.__gcs167879&&typeof f.__gcsOriginal==="function")R[n]=f.__gcsOriginal;if(typeof R[n]==="function")R[n].__gcs167879=true}
}
function wrapReplace(name,fn){const old=R[name];if(typeof old!=="function"||old.__gsr167887)return false;const w=function(){return fn.call(this,old,arguments)};w.__gsr167887=true;w.__gcsEffects167881=true;w.__original=old;R[name]=w;return true}
function legacyContribution(target){
  const r=legacy();try{
    if(target==="crit"){const v=Number(R.dungeonAttributeValue?.("agilite"))||0;return r.critFormula==="perPoint"?v*(Number(r.critPercentPerPoint)||0):Math.floor(v/Math.max(1,Number(r.agilityCritStep)||10))*(Number(r.critGain)||0)}
    if(target==="dodge"){const v=Number(R.dungeonAttributeValue?.("agilite"))||0;return r.dodgeFormula==="perPoint"?v*(Number(r.dodgePercentPerPoint)||0):Math.floor(v/Math.max(1,Number(r.agilityDodgeStep)||10))*(Number(r.dodgeGain)||0)}
    if(target==="max_mana"){const v=Number(R.dungeonAttributeValue?.("esprit"))||0;return r.manaFormula==="percent"?(Number(r.baseMana)||0)*(v*(Number(r.manaPercentPerPoint)||0))/100:Math.floor(v/Math.max(1,Number(r.spiritManaStep)||10))*(Number(r.manaGain)||0)}
    if(target==="max_hp")return Number(R.dungeonEnduranceHpBonus?.())||0;
    if(target==="magic_resistance"){const v=Number(R.dungeonAttributeValue?.("esprit"))||0;return r.magicResistFormula==="perPoint"?v*(Number(r.magicResistPerPoint)||0):Math.floor(v/Math.max(1,Number(r.spiritMagicResistStep)||10))*(Number(r.magicResistGain)||0)}
    if(target==="initiative"){const v=Number(R.dungeonAttributeValue?.("agilite"))||0;return r.initiativeFormula==="perPoint"?v*(Number(r.initiativePerPoint)||0):Math.floor(v/Math.max(1,Number(r.agilityInitiativeStep)||9999))*(Number(r.initiativeGain)||0)}
  }catch(e){}return 0;
}
function installRuntime(){
  restoreOldCustomHooks();
  wrapReplace("dungeonEnemyAttackProfile",(old,args)=>{enemyAttackContext=true;try{return old.apply(this,args)}finally{enemyAttackContext=false}});
  wrapReplace("dungeonPhysicalDamageBonus",()=>Math.round(combineTargets(["damage:all","damage:physical"]).flat));
  wrapReplace("dungeonMagicDamageBonus",()=>Math.round(combineTargets(["damage:all","damage:magic"]).flat));
  wrapReplace("dungeonHitBonusForMode",(old,args)=>enemyAttackContext?old.apply(this,args):Math.round(combineTargets(hitTargets(String(args[0]||"melee"))).flat));
  wrapReplace("dungeonDamagePercentForMode",(old,args)=>enemyAttackContext?old.apply(this,args):combineTargets(damageTargets(String(args[0]||"melee"))).percent);
  wrapReplace("dungeonApplyStatDamagePercent",(old,args)=>{if(enemyAttackContext)return old.apply(this,args);const base=Math.max(0,Number(args[0])||0),mode=String(args[1]||"melee"),all=combineTargets(damageTargets(mode)),modeFlat=mode==="magic"?0:(totals("damage:"+mode).flat||0),bonus=modeFlat+base*all.percent/100;return {pct:all.percent,bonus}});
  wrapReplace("applyDungeonCombatScaling",(old,args)=>{const it=args[0],st=args[1],out=old.apply(this,args);if(!it||!st)return out;const sc=it.rpgScaling||{},mode=sc.magic?"magic":(st.melee?"melee":"ranged"),raw=R.itemAttackStats?.(it),baseStrength=Math.max(0,Number(raw?.strength)||0),baseChance=Math.max(1,Math.min(99,Number(sc.baseChance)||Number(raw?.hitChance)||50)),hit=combineTargets(hitTargets(mode)),dmg=combineTargets(damageTargets(mode));st.hitChance=Math.max(0,Math.round(baseChance+hit.flat));st.strength=Math.max(0,baseStrength+dmg.flat+baseStrength*dmg.percent/100);st.mods=[];if(hit.flat)st.mods.push("Liaisons RPG : "+(hit.flat>=0?"+":"")+hit.flat+"% toucher");if(dmg.flat||dmg.percent)st.mods.push("Liaisons RPG : "+(dmg.flat>=0?"+":"")+dmg.flat+" dégâts"+(dmg.percent?" · "+(dmg.percent>=0?"+":"")+dmg.percent+"%":""));return out});
  wrapReplace("dungeonTalentCalculatedAmount",(old,args)=>{const heroId=String(args[0]||currentHero()),e=args[1]||{},base=Number(e.base)||0;let amount=base;if(e.scaleAttribute&&Number(e.scaleCoeff))amount+=sourceValue(e.scaleAttribute,heroId)*Number(e.scaleCoeff);const damaging=["damage","magic_damage","area_damage","dot","double_strike","life_steal","execute"].includes(String(e.kind||""));if(damaging){const mode=(e.damageType==="magic"||e.kind==="magic_damage")?"magic":(e.range&&Number(e.range)>1?"ranged":"melee"),d=combineTargets(damageTargets(mode),heroId);amount+=d.flat+amount*d.percent/100}return Math.max(0,Math.round(amount))});
  for(const [name,target,min,max] of [["dungeonDerivedDefense","defense",0,Infinity],["dungeonArmorScore","armor",0,Infinity],["dungeonHeroMoveValue083","movement",0,Infinity]])wrapReplace(name,(old,args)=>{const hero=(name==="dungeonHeroMoveValue083"&&args[0])?String(args[0]):currentHero();return applyTarget(Number(old.apply(this,args))||0,target,hero,{min,max})});
  for(const [name,target,min,max] of [["dungeonCriticalChance","crit",0,100],["dungeonDodgeChance","dodge",0,100],["dungeonMagicResistance","magic_resistance",0,Infinity],["dungeonDerivedInitiative","initiative",-9999,9999],["dungeonMaxMana","max_mana",0,Infinity],["effectiveMaxWounds","max_hp",1,Infinity]])wrapReplace(name,(old,args)=>{const oldValue=Number(old.apply(this,args))||0,base=oldValue-legacyContribution(target),t=totals(target);return clamp(base+t.flat+base*t.percent/100,min,max)});
  return true;
}
function renderCustomStatsInMainGrid(){
  if(!D)return false;const grid=D.getElementById("dungeonAttributeGrid"),api=R.GensCustomStats167879;if(!grid||!api)return false;
  grid.querySelectorAll(".gsrCustomStatCard").forEach(n=>n.remove());const h=currentHero();if(!h)return false;
  const st=R.loadState?.(h)||{},pts=Math.max(0,Number(st.statPoints)||0),list=(api.defs?.()||[]).filter(d=>d.visible&&api.isActive?.(d.id));
  for(const d of list){const v=Number(api.value?.(h,d.id))||0,el=D.createElement("div");el.className="dungeonStatBox gsrCustomStatCard";const desc=descriptionForSource(d.id),canEdit=d.editMode!=="runtime",canAdd=d.editMode!=="points"||pts>0,base=Number(d.defaultValue)||0,minus=canEdit?'<button type="button" onclick="GensCustomStats167879.change(\''+attr(d.id)+'\',-1)">−</button>':'',plus=canEdit?'<button type="button" '+(canAdd?'':'disabled title="Aucun point de caractéristique disponible"')+' onclick="GensCustomStats167879.change(\''+attr(d.id)+'\',1)">＋</button>':'';el.innerHTML='<strong>'+esc((d.icon?d.icon+' ':'')+d.name)+'</strong><div style="font-size:36px;font-weight:900;line-height:1.05;margin:4px 0">'+v+(d.kind==="gauge"?' / '+d.max:'')+'</div><small>Base '+base+'</small><small style="display:block;margin-top:10px;color:#d6c18a">'+esc(desc)+'</small>'+(canEdit?'<div style="display:flex;gap:8px;justify-content:center;margin-top:12px">'+minus+plus+'</div>':'');grid.appendChild(el)}
  return true;
}
function patchSheetTexts(){
  if(!D)return false;renderCustomStatsInMainGrid();
  const grid=D.getElementById("dungeonAttributeGrid");if(grid){for(const box of grid.querySelectorAll(".dungeonStatBox")){if(box.classList.contains("gsrCustomStatCard"))continue;const name=box.querySelector("strong")?.textContent?.trim(),s=statCatalog().find(x=>x.name===name);if(!s)continue;const small=[...box.querySelectorAll("small")].find(x=>x.style.color||x.getAttribute("style")?.includes("d6c18a"));if(small)small.textContent=descriptionForSource(s.id)}}
  const derived=D.getElementById("dungeonDerivedStats");if(derived){const map={"❤️ PV MAX":"max_hp","⚔️ DÉGÂTS PHYS.":"damage:physical","✨ DÉGÂTS MAG.":"damage:magic","🔷 MANA":"max_mana","💥 CRITIQUE":"crit","💨 ESQUIVE":"dodge","⚡ INITIATIVE":"initiative","🛡️ DÉFENSE":"defense","🧱 ARMURE":"armor","🔮 RÉSIST. MAG.":"magic_resistance"};for(const card of derived.querySelectorAll(".dungeonDerivedCard")){const k=card.querySelector("b")?.textContent?.trim(),target=map[k];if(!target)continue;const small=card.querySelector("small");if(small)small.textContent=explainTarget(target)}}
  cleanOldEditorUi();return true;
}
function decorateTalentEditor(){if(!D)return false;for(const s of D.querySelectorAll('#dtalentEffectsHost select[data-f="scaleAttribute"]'))addStatOptions(s);addStatOptions(D.getElementById("dtalentPassiveAttribute"));return true}
function addStatOptions(select){if(!select)return false;const current=select.value;for(const s of statCatalog()){if([...select.options].some(o=>String(o.value)===s.id))continue;const o=D.createElement("option");o.value=s.id;o.textContent=(s.icon?s.icon+" ":"")+s.name;select.appendChild(o)}if([...select.options].some(o=>String(o.value)===String(current)))select.value=current;return true}
function abilityLibrary(){try{return R.loadAbilityLibrary?.()||[]}catch(e){return []}}
function rpgAbilities(){return abilityLibrary().filter(a=>{try{return (R.gensAbilityUsages?.(a)||a?.usageScopes||["rpgHero"]).includes("rpgHero")}catch(e){return true}})}
function currentEditedItem(){const id=D?.getElementById("eqEditId")?.value||"";if(!id)return null;try{return R.dungeonItems?.().find(x=>String(x.id)===String(id))||R.loadCustomEquipment?.().find(x=>String(x.id)===String(id))||null}catch(e){return null}}
function statOptions2(selected="",includeNone=false){return (includeNone?'<option value="">Aucun</option>':"")+statCatalog().map(s=>'<option value="'+attr(s.id)+'"'+(String(selected)===s.id?' selected':'')+'>'+esc((s.icon?s.icon+" ":"")+s.name)+'</option>').join("")}
function abilityChecks(refs){const set=new Set((refs||[]).map(String)),list=rpgAbilities();if(!list.length)return '<div class="small">Aucune compétence RPG disponible dans le Répertoire.</div>';return list.map(a=>'<label style="display:block;margin:5px 0"><input type="checkbox" data-gse-ability value="'+attr(a.id)+'"'+(set.has(String(a.id))?' checked':'')+'> '+esc(a.name||a.id)+'</label>').join("")}
function decorateEquipmentEditor(){if(!D)return false;const modal=D.getElementById("equipmentEditorModal"),anchor=D.getElementById("eqRpgBaseChanceWrap");if(!modal||!anchor)return false;let box=D.getElementById("gse167884Equipment");if(!box){box=D.createElement("div");box.id="gse167884Equipment";box.className="v2MechanicBox";box.style.marginTop="10px";anchor.insertAdjacentElement("afterend",box)}const it=currentEditedItem()||{},sc=it.rpgScaling||{},refs=Array.isArray(it.rpgAbilityRefs)?it.rpgAbilityRefs:[];box.innerHTML='<strong>🔗 Réglages RPG avancés</strong><div class="small">Les caractéristiques viennent du même catalogue que les liaisons RPG. Les capacités restent référencées par ID dans le Répertoire.</div><div class="grid2" style="margin-top:8px"><label>Stat du jet / toucher<select id="gse167884HitStat">'+statOptions2(sc.attribute||"force")+'</select></label><label>Stat de scaling dégâts<select id="gse167884DamageStat">'+statOptions2(sc.damageAttribute||"",true)+'</select></label><label>Coefficient dégâts<input id="gse167884DamageCoeff" type="number" step="0.05" min="-10" max="10" value="'+(Number(sc.damageCoeff)||0)+'"></label></div><details style="margin-top:8px"><summary><strong>📚 Compétences liées à l’équipement</strong></summary><div class="small">La définition reste dans le Répertoire ; l’objet conserve uniquement les IDs.</div><div id="gse167884AbilityList">'+abilityChecks(refs)+'</div></details>';return true}
function selectedAbilityRefs(){if(!D)return [];return [...D.querySelectorAll('#gse167884AbilityList input[data-gse-ability]:checked')].map(x=>String(x.value))}
function editorValues(){return {attribute:D?.getElementById("gse167884HitStat")?.value||"",damageAttribute:D?.getElementById("gse167884DamageStat")?.value||"",damageCoeff:Number(D?.getElementById("gse167884DamageCoeff")?.value)||0,rpgAbilityRefs:selectedAbilityRefs()}}
function patchSavedEquipment(id,values){if(!id||!values)return false;try{const customs=R.loadCustomEquipment?.()||[],ix=customs.findIndex(x=>String(x.id)===String(id));if(ix>=0){customs[ix]={...customs[ix],rpgScaling:{...(customs[ix].rpgScaling||{}),attribute:values.attribute||"force",damageAttribute:values.damageAttribute,damageCoeff:values.damageCoeff},rpgAbilityRefs:[...new Set(values.rpgAbilityRefs||[])]};R.saveCustomEquipment?.(customs);R.refreshCustomEquipmentIntoItems?.();return true}const live=R.dungeonItems?.().find(x=>String(x.id)===String(id));if(live&&typeof R.loadDungeonItemOverrides==="function"){const ovs=R.loadDungeonItemOverrides()||{},prev=ovs[id]&&typeof ovs[id]==="object"?ovs[id]:{};ovs[id]={...prev,rpgScaling:{...(prev.rpgScaling||live.rpgScaling||{}),attribute:values.attribute||"force",damageAttribute:values.damageAttribute,damageCoeff:values.damageCoeff},rpgAbilityRefs:[...new Set(values.rpgAbilityRefs||[])]};R.saveDungeonItemOverrides?.(ovs);R.refreshCustomEquipmentIntoItems?.();return true}}catch(e){console.warn("Éditeur RPG avancé équipement",e)}return false}
function installEditorHooks(){const wrapAfter=(name,after)=>{const old=R[name];if(typeof old!=="function"||old.__gsr167887Editor)return;const w=function(){const out=old.apply(this,arguments);try{after()}catch(e){console.warn("Extension éditeur",name,e)}return out};w.__gsr167887Editor=true;w.__original=old;R[name]=w};wrapAfter("renderDungeonTalentEffectsEditor",decorateTalentEditor);wrapAfter("openDungeonTalentNodeEditor",decorateTalentEditor);wrapAfter("openEquipmentEditor",decorateEquipmentEditor);wrapAfter("renderRpgUniverseEditor",()=>{renderLinksEditor();cleanOldEditorUi()});wrapAfter("renderDungeonAttributes",patchSheetTexts);wrapAfter("renderDungeonHeroStats",patchSheetTexts);const oldSave=R.saveEquipmentEditor;if(typeof oldSave==="function"&&!oldSave.__gsr167887Editor){const w=function(){let id=D?.getElementById("eqEditId")?.value||"";if(!id&&D?.getElementById("eqEditId")){id="custom_item_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);D.getElementById("eqEditId").value=id}const values=editorValues(),out=oldSave.apply(this,arguments);patchSavedEquipment(id,values);return out};w.__gsr167887Editor=true;w.__original=oldSave;R.saveEquipmentEditor=w}return true}
function installHelp(){const api=R.GensStatRules167880;if(!api?.HELP)return false;api.HELP.primaryStats={title:"Caractéristiques principales",body:"Toutes les caractéristiques actives utilisent le même catalogue. Une statistique créée est traitée comme les autres ; son rôle vient uniquement des liaisons configurées.",example:"Nécromancie peut piloter dégâts, critique, défense ou n’avoir aucune liaison automatique."};api.HELP.statEffects={title:"Liaisons caractéristiques → valeurs",body:"Une liaison choisit une caractéristique source, une valeur influencée et une formule. Les changements sont enregistrés automatiquement et le même réglage sert au calcul et au texte de la fiche héros.",example:"10 Nécromancie = +1 dégâts de mêlée ; 1 Chance = +0,5 critique."};return true}
function install(){try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}ensureRules();cleanOldEditorUi();installHelp();installRuntime();installEditorHooks();renderLinksEditor();patchSheetTexts();return true}
R.GensGenericStats167887={VERSION,APP_VERSION,TARGETS,CORE_STATS,statCatalog,targetCatalog,normalizeRule,ensureRules,rules,persistRules,sourceValue,ruleRaw,totals,combineTargets,applyTarget,damageTargets,hitTargets,descriptionForSource,explainRule,explainTarget,renderLinksEditor,collectRules,addRule,removeRule,saveRules,refreshDraft,cleanOldEditorUi,installRuntime,renderCustomStatsInMainGrid,patchSheetTexts,decorateTalentEditor,decorateEquipmentEditor,editorValues,patchSavedEquipment,install};
R.GensSafeEditor167884=R.GensGenericStats167887;R.GensStatHelpExtension167881=R.GensGenericStats167887;
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
