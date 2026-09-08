/* GenSrpG V16.79.01 — single RPG stat service.
   One registry, one editor, one hero-sheet renderer and one point economy for RPG stats.
   Dungeon and authored/Builder engines remain separate; they only read this service.
   Legacy stat modules are treated as compatibility providers and no longer own rendering. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="5.0.0",APP_VERSION="16.79.01",SCHEMA="rpgStatServiceV167901";
const ALIASES={agility:"agilite",spirit:"esprit"};
const CORE=[
 {id:"force",name:"Force",icon:"💪",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",description:"Dégâts physiques et précision de mêlée."},
 {id:"agilite",name:"Agilité",icon:"🏃",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",description:"Précision à distance, critique, esquive et initiative."},
 {id:"intelligence",name:"Intelligence",icon:"🧠",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",description:"Dégâts et précision magiques."},
 {id:"esprit",name:"Esprit",icon:"✨",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",description:"Mana et résistance magique."},
 {id:"endurance",name:"Endurance",icon:"❤️",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",description:"Points de vie maximum."},
 {id:"initiative",name:"Initiative",icon:"⚡",kind:"score",min:-999,max:999,defaultValue:0,visible:true,editMode:"points",description:"Ordre d'action et tests d'initiative."}
];
const cp=v=>{try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const attr=v=>esc(v).replace(/`/g,"&#96;");
const slug=v=>String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_ -]/g,"").replace(/[ -]+/g,"_").replace(/^_+|_+$/g,"");
const canon=id=>ALIASES[String(id||"")]||String(id||"");
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function captureContext(){try{return D?.body?.classList?.contains("gens-pure-capture")||D?.body?.classList?.contains("gens-capture-gameplay")||String(R.activeGameProfileId?.()||"").toLowerCase().includes("capture")}catch(e){return false}}
function dungeonContext(){try{return !!R.isDungeonMode?.()&&!captureContext()}catch(e){return false}}
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function profile(){try{return editorOpen()?(R.currentRpgProfile?.()||R.getActiveGameProfile?.()):(R.getActiveGameProfile?.()||R.currentRpgProfile?.())}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(a){try{R.saveGameProfiles?.(a);return true}catch(e){return false}}
function norm(d){if(!d||typeof d!=="object")return null;const id=canon(slug(d.id||d.name));if(!id)return null;const kind=d.kind==="gauge"?"gauge":"score",min=Number.isFinite(Number(d.min))?Number(d.min):0,max=Math.max(min,Number.isFinite(Number(d.max))?Number(d.max):(kind==="gauge"?100:999));return {id,name:String(d.name||id),icon:String(d.icon||"📊"),kind,min,max,defaultValue:clamp(Number.isFinite(Number(d.defaultValue))?Number(d.defaultValue):0,min,max),visible:d.visible!==false,editMode:["points","free","runtime"].includes(d.editMode)?d.editMode:"points",usage:String(d.usage||""),description:String(d.description||""),effects:Array.isArray(d.effects)?cp(d.effects):[]}}
function statsRoot(p=profile()){
 if(!p?.rpgUniverse)return null;const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
 let list=(Array.isArray(s.customStats)?s.customStats:[]).map(norm).filter(Boolean);const by=new Map(list.map(x=>[x.id,x]));
 for(const core of CORE){const old=by.get(core.id),merged=norm({...core,...(old||{}),id:core.id,name:String(old?.name||core.name),icon:String(old?.icon||core.icon),description:String(old?.description||core.description)});by.set(core.id,merged)}
 list=[...by.values()];const active=[];for(const raw of Array.isArray(s.active)?s.active:[]){const id=canon(raw);if(id&&!active.includes(id))active.push(id)};for(const c of CORE)if(!active.includes(c.id))active.push(c.id);
 s.customStats=list;s.active=active;s[SCHEMA]=true;return s;
}
function persistProfile(p=profile()){if(!p)return false;const all=profiles(),i=all.findIndex(x=>String(x?.id||"")===String(p.id||""));if(i<0)return false;all[i]=p;return saveProfiles(all)}
function definitions(){return statsRoot()?.customStats||[]}
function definition(id){id=canon(id);return definitions().find(d=>d.id===id)||null}
function activeIds(){return new Set((statsRoot()?.active||[]).map(canon))}
function isActive(id){return activeIds().has(canon(id))}
function setActive(id,on){const p=profile(),s=statsRoot(p);id=canon(id);if(!s||!id)return false;const a=new Set(s.active.map(canon));on?a.add(id):a.delete(id);s.active=[...a];return persistProfile(p)}
function heroState(hero){try{return R.loadState?.(hero)||null}catch(e){return null}}
function saveHero(hero,s){try{if(typeof R.key==="function")localStorage.setItem(R.key(hero),JSON.stringify(s));else R.saveState?.(hero,s);return true}catch(e){return false}}
function migrateState(hero,s=heroState(hero)){
 if(!s)return null;s.rpgAttributes=s.rpgAttributes&&typeof s.rpgAttributes==="object"?s.rpgAttributes:{};
 if(s.customStats&&typeof s.customStats==="object")for(const [raw,v] of Object.entries(s.customStats)){const id=canon(raw);if(!Number.isFinite(Number(s.rpgAttributes[id]))&&Number.isFinite(Number(v)))s.rpgAttributes[id]=Number(v)}
 if(s.rpgAttributes.agility!==undefined&&s.rpgAttributes.agilite===undefined)s.rpgAttributes.agilite=s.rpgAttributes.agility;
 if(s.rpgAttributes.spirit!==undefined&&s.rpgAttributes.esprit===undefined)s.rpgAttributes.esprit=s.rpgAttributes.spirit;
 if(s.rpgStatSpent&&typeof s.rpgStatSpent==="object"){
   s.rpgStatSpentById={...(s.rpgStatSpentById||{})};let total=0;for(const [raw,v] of Object.entries(s.rpgStatSpent)){const id=canon(raw),n=Math.max(0,Number(v)||0);s.rpgStatSpentById[id]=(Number(s.rpgStatSpentById[id])||0)+n;total+=n}s.rpgStatSpent=total;
 }
 if(!Number.isFinite(Number(s.rpgStatSpent)))s.rpgStatSpent=0;s.rpgStatSpentById=s.rpgStatSpentById&&typeof s.rpgStatSpentById==="object"?s.rpgStatSpentById:{};
 for(const d of definitions())if(!Number.isFinite(Number(s.rpgAttributes[d.id])))s.rpgAttributes[d.id]=d.defaultValue;
 return s;
}
function baseValue(hero,id){id=canon(id);const d=definition(id);if(!d)return 0;const s=migrateState(hero);if(!s)return d.defaultValue;if(id==="initiative"&&!Number.isFinite(Number(s.rpgAttributes[id])))return Number(R.CHARS?.[hero]?.dungeonStats?.initiative)||d.defaultValue;return clamp(Number(s.rpgAttributes[id]??d.defaultValue)||0,d.min,d.max)}
function equipmentBonus(id){try{return Number(R.dungeonEquipmentBonus?.(canon(id)))||0}catch(e){return 0}}
function talentBonus(id){try{return Number(R.dungeonSkillEffectTotal?.("attribute",null,canon(id)))||0}catch(e){return 0}}
function malus(id,hero){try{return Number(R.dungeonChallengeDebuffTotal067?.(canon(id),heroState(hero)))||0}catch(e){return 0}}
function value(hero,id){const d=definition(id);if(!d||!isActive(id))return 0;return clamp(baseValue(hero,id)+equipmentBonus(id)+talentBonus(id)+malus(id,hero),d.min,d.max)}
function setBaseValue(hero,id,n,{free=false}={}){id=canon(id);const d=definition(id),s=migrateState(hero);if(!d||!s||d.editMode==="runtime")return false;const old=baseValue(hero,id),next=clamp(Number(n)||0,d.min,d.max),delta=next-old;if(!delta)return true;
 if(d.editMode==="points"&&!free){const spentBy=Math.max(0,Number(s.rpgStatSpentById[id])||0);if(delta>0){const pts=Math.max(0,Number(s.statPoints)||0);if(delta>pts)return false;s.statPoints=pts-delta;s.rpgStatSpent=Math.max(0,Number(s.rpgStatSpent)||0)+delta;s.rpgStatSpentById[id]=spentBy+delta}else{const refund=Math.min(spentBy,-delta);if(refund<=0)return false;s.statPoints=Math.max(0,Number(s.statPoints)||0)+refund;s.rpgStatSpent=Math.max(0,(Number(s.rpgStatSpent)||0)-refund);s.rpgStatSpentById[id]=spentBy-refund}}
 s.rpgAttributes[id]=next;saveHero(hero,s);return true;
}
function change(id,delta){if(!dungeonContext())return false;const hero=String(R.current||"");if(!hero)return false;const ok=setBaseValue(hero,id,baseValue(hero,id)+Number(delta||0));if(ok){try{R.renderDungeonAttributes?.()}catch(e){}}return ok}
function describe(id){const d=definition(id);if(!d)return "";const links=[];try{for(const r of R.GensGenericStats167887?.rules?.()||[])if(r?.enabled!==false&&canon(r.source)===d.id)links.push(R.GensGenericStats167887?.targetCatalog?.().find(x=>x.id===r.target)?.name||r.target)}catch(e){}return {text:String(d.description||""),links:[...new Set(links)].join(" · ")}}
function renderSheet(){
 if(!D||!dungeonContext())return false;const host=D.getElementById("dungeonAttributeGrid"),hero=String(R.current||"");if(!host||!hero)return false;D.getElementById("gcsHeroStats")?.remove?.();
 const list=definitions().filter(d=>d.visible&&isActive(d.id));host.innerHTML=list.map(d=>{const base=baseValue(hero,d.id),gear=equipmentBonus(d.id),tal=talentBonus(d.id),v=value(hero,d.id),info=describe(d.id),extra=(gear?' · équipement '+(gear>0?'+':'')+gear:'')+(tal?' · talents '+(tal>0?'+':'')+tal:'');return '<div class="dungeonStatBox gss901Card" data-stat-id="'+attr(d.id)+'"><strong>'+esc((d.icon?d.icon+' ':'')+d.name)+'</strong><span>'+v+'</span><small style="display:block">Base '+base+extra+'</small>'+(info.text?'<small style="display:block;color:#d6c18a;margin:4px 0">'+esc(info.text)+'</small>':'')+(info.links?'<small style="display:block;color:#bdb19b;margin:4px 0">Influence : '+esc(info.links)+'</small>':'')+(d.editMode!=="runtime"?'<div class="controls"><button type="button" data-gss901="-1" data-stat="'+attr(d.id)+'">−</button><button type="button" data-gss901="1" data-stat="'+attr(d.id)+'">+</button></div>':'')+'</div>'}).join("");
 if(!host.dataset.gss901){host.dataset.gss901="1";host.addEventListener?.("click",e=>{const b=e.target?.closest?.("[data-gss901]");if(b)change(b.dataset.stat,Number(b.dataset.gss901)||0)})}const compact=D.getElementById("dungeonHeroStats");if(compact){compact.style.display="none";compact.innerHTML=""}return true;
}
function editorCard(d,i,active){return '<div class="v2LibCard gss901Def" data-i="'+i+'"><div class="v2LibHead"><strong>'+esc((d.icon?d.icon+' ':'')+d.name)+'</strong>'+(CORE.some(c=>c.id===d.id)?'':'<button type="button" data-gss901-remove="'+i+'">🗑️</button>')+'</div><div class="grid2"><label><input type="checkbox" data-f="active"'+(active?' checked':'')+'> Active</label><label>Nom<input data-f="name" value="'+attr(d.name)+'"></label><label>ID<input data-f="id" value="'+attr(d.id)+'"'+(CORE.some(c=>c.id===d.id)?' readonly':'')+'></label><label>Icône<input data-f="icon" value="'+attr(d.icon)+'"></label><label>Type<select data-f="kind"><option value="score"'+(d.kind==='score'?' selected':'')+'>Score</option><option value="gauge"'+(d.kind==='gauge'?' selected':'')+'>Jauge</option></select></label><label>Modification<select data-f="editMode"><option value="points"'+(d.editMode==='points'?' selected':'')+'>Points</option><option value="free"'+(d.editMode==='free'?' selected':'')+'>Libre</option><option value="runtime"'+(d.editMode==='runtime'?' selected':'')+'>Jeu seulement</option></select></label><label>Minimum<input type="number" data-f="min" value="'+d.min+'"></label><label>Maximum<input type="number" data-f="max" value="'+d.max+'"></label><label>Valeur de départ<input type="number" data-f="defaultValue" value="'+d.defaultValue+'"></label><label><input type="checkbox" data-f="visible"'+(d.visible?' checked':'')+'> Visible sur la fiche</label></div><label>Description<input data-f="description" value="'+attr(d.description)+'"></label></div>'}
function renderEditor(){
 if(!D||!editorOpen())return false;const old=D.getElementById("gcs167879Box");if(old)old.style.display="none";const primary=D.getElementById("rpgStatsList");if(primary){primary.innerHTML="";primary.style.display="none"}let box=D.getElementById("gss901Editor");const anchor=primary?.parentElement||D.getElementById("rpgTab_stats");if(!anchor)return false;if(!box){box=D.createElement("div");box.id="gss901Editor";box.className="v2MechanicBox";anchor.appendChild(box)}const defs=definitions(),active=activeIds();box.innerHTML='<div class="v2LibHead"><strong>🧩 Caractéristiques / statistiques</strong><button type="button" data-gss901-add>＋ AJOUTER</button></div><div class="small">Une seule définition sert à l’éditeur, à la fiche héros, aux équipements, aux sets et aux talents. Une statistique créée ici n’a pas besoin d’être codée dans le moteur.</div><div style="display:grid;gap:8px;margin-top:10px">'+defs.map((d,i)=>editorCard(d,i,active.has(d.id))).join('')+'</div><button type="button" class="startGameBtn" data-gss901-save>💾 ENREGISTRER LES CARACTÉRISTIQUES</button>';
 if(!box.dataset.bound){box.dataset.bound="1";box.addEventListener("click",e=>{if(e.target.closest("[data-gss901-add]")){addDefinition();return}const rm=e.target.closest("[data-gss901-remove]");if(rm){removeDefinition(Number(rm.dataset.gss901Remove));return}if(e.target.closest("[data-gss901-save]"))saveEditor()})}return true;
}
function collectEditor(){if(!D)return [];return [...D.querySelectorAll("#gss901Editor .gss901Def")].map(el=>norm({id:el.querySelector('[data-f="id"]')?.value,name:el.querySelector('[data-f="name"]')?.value,icon:el.querySelector('[data-f="icon"]')?.value,kind:el.querySelector('[data-f="kind"]')?.value,editMode:el.querySelector('[data-f="editMode"]')?.value,min:el.querySelector('[data-f="min"]')?.value,max:el.querySelector('[data-f="max"]')?.value,defaultValue:el.querySelector('[data-f="defaultValue"]')?.value,visible:el.querySelector('[data-f="visible"]')?.checked,description:el.querySelector('[data-f="description"]')?.value,active:el.querySelector('[data-f="active"]')?.checked})).filter(Boolean)}
function saveEditor(){const p=profile(),s=statsRoot(p);if(!p||!s)return false;const rows=[...D.querySelectorAll("#gss901Editor .gss901Def")],defs=collectEditor(),active=[];defs.forEach((d,i)=>{if(rows[i]?.querySelector('[data-f="active"]')?.checked)active.push(d.id)});for(const c of CORE)if(!defs.some(d=>d.id===c.id))defs.unshift(cp(c));s.customStats=defs;s.active=active;const ok=persistProfile(p);renderEditor();return ok}
function addDefinition(){const p=profile(),s=statsRoot(p);if(!s)return false;let id="nouvelle_stat",n=2;while(s.customStats.some(d=>d.id===id))id="nouvelle_stat_"+(n++);s.customStats.push(norm({id,name:"Nouvelle stat",icon:"📊",kind:"score",min:0,max:999,defaultValue:0,visible:true,editMode:"points",description:""}));s.active.push(id);persistProfile(p);renderEditor();return true}
function removeDefinition(i){const p=profile(),s=statsRoot(p);if(!s)return false;const d=s.customStats[Number(i)];if(!d||CORE.some(c=>c.id===d.id))return false;s.customStats.splice(Number(i),1);s.active=s.active.filter(x=>canon(x)!==d.id);persistProfile(p);renderEditor();return true}
let nativeAttr=null,nativeChange=null,nativeRender=null,nativeHeroStats=null,nativeEditor=null;
function installRuntime(){
 if(typeof R.dungeonAttributeValue==="function"&&!R.dungeonAttributeValue.__gss901){nativeAttr=R.dungeonAttributeValue;const w=function(id){return dungeonContext()&&definition(id)&&isActive(id)?value(String(R.current||""),id):nativeAttr.apply(this,arguments)};w.__gss901=true;R.dungeonAttributeValue=w}
 if(typeof R.changeDungeonAttribute==="function"&&!R.changeDungeonAttribute.__gss901){nativeChange=R.changeDungeonAttribute;const w=function(id,delta){return dungeonContext()&&definition(id)?change(id,delta):nativeChange.apply(this,arguments)};w.__gss901=true;R.changeDungeonAttribute=w}
 if(typeof R.renderDungeonAttributes==="function"&&!R.renderDungeonAttributes.__gss901){nativeRender=R.renderDungeonAttributes;const w=function(){if(!dungeonContext())return nativeRender.apply(this,arguments);let out;try{out=nativeRender.apply(this,arguments)}catch(e){}renderSheet();return out};w.__gss901=true;R.renderDungeonAttributes=w}
 if(typeof R.renderDungeonHeroStats==="function"&&!R.renderDungeonHeroStats.__gss901){nativeHeroStats=R.renderDungeonHeroStats;const w=function(){if(!dungeonContext())return nativeHeroStats.apply(this,arguments);renderSheet();return true};w.__gss901=true;R.renderDungeonHeroStats=w}
 if(typeof R.renderRpgUniverseEditor==="function"&&!R.renderRpgUniverseEditor.__gss901){nativeEditor=R.renderRpgUniverseEditor;const w=function(){const out=nativeEditor.apply(this,arguments);if(editorOpen())renderEditor();return out};w.__gss901=true;R.renderRpgUniverseEditor=w}
}
function neutralizeLegacy(){const api=R.GensCustomStats167879;if(api){api.defs=definitions;api.def=definition;api.activeIds=activeIds;api.isActive=isActive;api.value=(hero,id)=>value(hero,id);api.setValue=(hero,id,v,opt)=>setBaseValue(hero,id,v,opt||{});api.change=change;api.renderEditor=renderEditor;api.syncPrimaryList=()=>true;api.renderHero=renderSheet;api.__gss901=true}D?.getElementById("gcsHeroStats")?.remove?.();const old=D?.getElementById("gcs167879Box");if(old)old.style.display="none"}
function migrateProfiles(){const all=profiles();let changed=false;for(const p of all){if(!p?.rpgUniverse||p.gameStyle!=="dungeon")continue;const before=JSON.stringify(p.rpgUniverse.stats||{});statsRoot(p);if(JSON.stringify(p.rpgUniverse.stats||{})!==before)changed=true}if(changed)saveProfiles(all);return changed}
function install(){try{R.GENSRPG_VERSION=APP_VERSION;R.GENSRPG_STAT_SERVICE=SCHEMA}catch(e){}migrateProfiles();installRuntime();neutralizeLegacy();if(editorOpen())renderEditor();if(dungeonContext())renderSheet();return true}
R.GensRpgStatService167901={VERSION,APP_VERSION,SCHEMA,ALIASES,CORE,canon,captureContext,dungeonContext,profile,statsRoot,definitions,definition,activeIds,isActive,setActive,migrateState,baseValue,equipmentBonus,talentBonus,malus,value,setBaseValue,change,describe,renderSheet,renderEditor,saveEditor,addDefinition,removeDefinition,installRuntime,neutralizeLegacy,migrateProfiles,install};
R.GensCustomStatRuntimeProfile167889=R.GensRpgStatService167901;
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
