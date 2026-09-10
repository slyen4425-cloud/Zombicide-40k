/* GenSrpG V16.78.108 — canonical per-entity Detection/Perception.
   Detection is an explicit hero/enemy stat. Legacy zero-valued enemies are migrated in the editor
   to their former effective universe radius; after save, zero means truly no detection. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.108",STAT_ID="perception",MIGRATION_KEY="canonicalDetectionMigrated107",EXPLICIT_KEY="perceptionExplicit";
let installed=false;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function api(){return R.GensCleanRpgStats167874||null}
function activeProfile(){try{return R.currentRpgProfile?.()||R.getActiveGameProfile?.()||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfile(p){try{const a=profiles();if(!Array.isArray(a)||!p)return false;const ids=[p.id,R.activeGameProfileId?.(),R.getActiveGameProfileId?.()].filter(Boolean).map(String);let i=a.findIndex(x=>ids.includes(String(x?.id||"")));if(i<0&&p?.name){const same=a.map((x,n)=>String(x?.name||"")===String(p.name)?n:-1).filter(n=>n>=0);if(same.length===1)i=same[0]}if(i<0&&a.length===1)i=0;if(i<0)return false;a[i]=p;R.saveGameProfiles?.(a);return true}catch(e){return false}}
function legacyDefaults(p=activeProfile()){
 const ex=p?.rpgUniverse?.exploration||{},mv=p?.rpgUniverse?.movement||{};
 return {hero:clamp(num(ex.trapDetectionRadius,2),0,20),enemy:clamp(num(ex.enemyDetectionRadius,2),0,20),ally:clamp(num(mv.combatParticipationRange,3),0,20)};
}
function ensureDefinition(){
 const p=activeProfile();if(!p?.rpgUniverse)return false;
 const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
 const defs=Array.isArray(s.dynamicDefinitions)?s.dynamicDefinitions:[];
 let d=defs.find(x=>String(x?.id||"")===STAT_ID);
 if(!d){d={id:STAT_ID,name:"Détection",icon:"👁️",defaultValue:2,min:0,max:20,visible:true,description:"Distance de perception en cases : repérage, pièges et portée pour rejoindre un combat allié."};defs.push(d)}
 else{d.name=d.name||"Détection";d.icon=d.icon||"👁️";d.min=0;d.max=Math.max(20,num(d.max,20));d.visible=d.visible!==false;d.description=d.description||"Distance de perception en cases : repérage, pièges et portée pour rejoindre un combat allié."}
 s.dynamicDefinitions=defs;s.active=Array.isArray(s.active)?s.active:[];if(!s.active.includes(STAT_ID))s.active.push(STAT_ID);
 if(!s[MIGRATION_KEY]){s[MIGRATION_KEY]={at:Date.now(),legacy:legacyDefaults(p)};saveProfile(p)}
 return true;
}
function heroExplicitBase(id){try{const st=R.loadState?.(id)||{},c=R.CHARS?.[id]||R.findCustomHero?.(id)||{};const a=st?.rpgAttributes?.[STAT_ID],b=c?.dungeonStats?.[STAT_ID];if(Number.isFinite(Number(a)))return Number(a);if(Number.isFinite(Number(b)))return Number(b)}catch(e){}return null}
function heroRange(id){
 id=String(id||"");const legacy=legacyDefaults();let base=heroExplicitBase(id),v;
 try{v=num(api()?.value?.(id,STAT_ID),NaN)}catch(e){v=NaN}
 if(base===null){base=legacy.ally;let bonus=0;try{if(String(R.current||"")===id)bonus+=num(R.dungeonEquipmentBonus?.(STAT_ID),0)}catch(e){}try{if(String(R.current||"")===id)bonus+=num(R.dungeonSkillEffectTotal?.("attribute",null,STAT_ID),0)}catch(e){}return clamp(base+bonus,0,20)}
 return clamp(Number.isFinite(v)?v:base,0,20);
}
function enemyRaw(def){const r=def?.rule||def||{};let own=r?.rpgStats?.[STAT_ID];if(!Number.isFinite(Number(own)))own=r.perception??r.detection??r.vision??def?.perception;return Number.isFinite(Number(own))?Number(own):null}
function enemyIsExplicit(def){const r=def?.rule||def||{};return r?.[EXPLICIT_KEY]===true||r?.rpgStats?.[EXPLICIT_KEY]===true}
function enemyRange(def){
 const own=enemyRaw(def);
 if(enemyIsExplicit(def)&&own!==null)return clamp(own,0,20);
 if(own!==null&&own>0)return clamp(own,0,20);
 return clamp(legacyDefaults().enemy,0,20);
}
function editorRecord(id){id=String(id||D?.getElementById?.("enemyEditId")?.value||"");try{const b=R.builtinEnemyBase?.(id);if(b)return R.builtinEnemyToEditorData?.(id)||b}catch(e){}try{return (R.loadCustomEnemies?.()||[]).find(x=>String(x?.id)===id)||null}catch(e){return null}}
function migrateEditorValue(id){
 if(!D)return false;const rec=editorRecord(id),r=rec?.rule||rec||{};let value=enemyRange(rec||r);
 const legacy=D.getElementById("enemyRpgPerception");if(legacy)legacy.value=String(value);
 const canon=D.querySelector?.('#enemyCanonicalStats1678105 [data-enemy-stat-value="perception"]');if(canon)canon.value=String(value);
 if(legacy){const f=legacy.closest?.(".eqField"),small=f?.querySelector?.(".small");if(small)small.textContent="0 = aucune détection. La valeur est propre à cette créature."}
 return true;
}
function markExplicit(out){if(!out?.rule)return out;const rs=out.rule.rpgStats=out.rule.rpgStats||{};let v=rs[STAT_ID];if(!Number.isFinite(Number(v))&&D)v=D.querySelector?.('#enemyCanonicalStats1678105 [data-enemy-stat-value="perception"]')?.value??D.getElementById?.("enemyRpgPerception")?.value;if(Number.isFinite(Number(v))){v=clamp(Number(v),0,20);rs[STAT_ID]=v;out.rule.perception=v;out.rule[EXPLICIT_KEY]=true}return out}
function wrapEnemyForm(){const old=R.enemyFormObject;if(typeof old!=="function"||old.__gcd108)return false;const w=function(){return markExplicit(old.apply(this,arguments))};w.__gcd108=true;w.__original=old;R.enemyFormObject=w;return true}
function wrapEnemyDefinition(){const old=R.activeEnemyDefinition;if(typeof old!=="function"||old.__gcd108)return false;const w=function(){const d=old.apply(this,arguments);if(d?.rule)d.rule.perception=enemyRange(d);return d};w.__gcd108=true;w.__original=old;R.activeEnemyDefinition=w;return true}
function wrapSpatial(){const model=R.DungeonSpatial313,old=model?.participatingHeroes;if(typeof old!=="function"||old.__gcd108)return false;const w=function(x,leader,fallback,tactical=true){if(!tactical)return old.call(this,x,leader,fallback,false);const here=typeof this.heroesHere==="function"?this.heroesHere(x):(x?.participants||[]).map(String);leader=String(leader||this.active?.(x)||"");return here.filter(id=>String(id)===leader||old.call(this,x,leader,heroRange(id),true).map(String).includes(String(id)))};w.__gcd108=true;w.__original=old;model.participatingHeroes=w;return true}
function activeHeroId(){try{const x=JSON.parse(localStorage.getItem("gensrpg_dungeon_runtime_v2")||"null");return String(x?.participants?.[Number(x?.index)||0]||R.current||"")}catch(e){return String(R.current||"")}}
function wrapTrapDetection(){const old=R.dc211TrapTest;if(typeof old!=="function"||old.__gcd108)return false;const w=function(){const radius=heroRange(activeHeroId()),origLoad=R.loadGameProfiles;if(typeof origLoad!=="function")return old.apply(this,arguments);R.loadGameProfiles=function(){const arr=origLoad.apply(this,arguments);try{const active=String(R.activeGameProfileId?.()||R.getActiveGameProfileId?.()||"");for(const p of arr||[]){if(active&&String(p?.id)!==active)continue;if(p?.rpgUniverse?.exploration)p.rpgUniverse.exploration.trapDetectionRadius=radius}return arr}catch(e){return arr}};try{return old.apply(this,arguments)}finally{R.loadGameProfiles=origLoad}};w.__gcd108=true;w.__original=old;R.dc211TrapTest=w;return true}
function hideLegacyRadius(id,note){if(!D)return false;const el=D.getElementById(id),label=el?.closest?.("label");if(!label)return false;label.hidden=true;label.style.setProperty("display","none","important");const card=el.closest?.(".smodCard");if(card&&!card.querySelector('[data-gcd-note="'+id+'"]')){const p=D.createElement("div");p.className="smodMini";p.setAttribute("data-gcd-note",id);p.textContent=note;card.appendChild(p)}return true}
function cleanEditorUi(){if(!D)return false;hideLegacyRadius("rpgTrapDetectionRadius","Le rayon vient maintenant de la caractéristique 👁️ Détection du héros.");hideLegacyRadius("rpgEnemyDetectionRadius","Chaque ennemi utilise désormais sa propre caractéristique 👁️ Détection.");hideLegacyRadius("rpgCombatParticipationRange","En mode tactique, chaque héros rejoint un combat allié selon sa propre 👁️ Détection.");const sel=D.getElementById("rpgTrapDetectionStat");if(sel&&!sel.querySelector('option[value="perception"]')){const o=D.createElement("option");o.value="perception";o.textContent="Détection";sel.appendChild(o)}return true}
function wrapUiHook(name){const old=R[name];if(typeof old!=="function"||old.__gcd108)return false;const w=function(){const args=arguments,out=old.apply(this,args);setTimeout(()=>{ensureDefinition();cleanEditorUi();if(name==="openEnemyEditor")migrateEditorValue(args[0])},0);if(name==="openEnemyEditor")setTimeout(()=>migrateEditorValue(args[0]),80);return out};w.__gcd108=true;w.__original=old;R[name]=w;return true}
function hooks(){wrapEnemyDefinition();wrapEnemyForm();wrapSpatial();wrapTrapDetection();for(const n of ["renderRpgUniverseEditor","reloadRpgGameplayFromProfileId","openHeroCreator","openEnemyEditor","openEquipmentEditor","editAbilityLibraryEntry"])wrapUiHook(n);return true}
function install(){if(installed)return true;if(!api()){setTimeout(install,25);return false}installed=true;ensureDefinition();cleanEditorUi();hooks();let tries=0;const retry=()=>{ensureDefinition();hooks();cleanEditorUi();if(tries++<60)setTimeout(retry,100)};setTimeout(retry,50);return true}
R.GensCanonicalDetection1678107={VERSION,APP_VERSION,STAT_ID,EXPLICIT_KEY,ensureDefinition,legacyDefaults,heroRange,enemyRaw,enemyIsExplicit,enemyRange,migrateEditorValue,markExplicit,wrapEnemyDefinition,wrapEnemyForm,wrapSpatial,wrapTrapDetection,cleanEditorUi,hooks,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}else install();
})();
