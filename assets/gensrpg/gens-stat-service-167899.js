/* GenSrpG V16.78.99 — shared RPG statistic service.
   Shared DATA/API only: Dungeon classic and authored/Builder keep their own movement,
   room, combat, spawn and navigation runtimes. Both consume this same stat registry.
   V16.78.99 isolation rule: outside Dungeon RPG/editor contexts, every wrapped legacy
   function delegates untouched to its original implementation. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.99",SCHEMA_VERSION=1;
const ALIASES={agility:"agilite",dexterity:"agilite",spirit:"esprit",wisdom:"esprit",strength:"force",constitution:"endurance"};
const CORE=[
 {id:"force",name:"Force",icon:"💪",kind:"score",min:0,max:999,defaultValue:3,visible:true,editMode:"points",description:"Dégâts physiques et précision de mêlée.",effects:[]},
 {id:"agilite",name:"Agilité",icon:"🏃",kind:"score",min:0,max:999,defaultValue:3,visible:true,editMode:"points",description:"Précision à distance, critique, esquive et réactions rapides.",effects:[]},
 {id:"intelligence",name:"Intelligence",icon:"🧠",kind:"score",min:0,max:999,defaultValue:3,visible:true,editMode:"points",description:"Dégâts et précision magiques.",effects:[]},
 {id:"esprit",name:"Esprit",icon:"✨",kind:"score",min:0,max:999,defaultValue:3,visible:true,editMode:"points",description:"Mana et résistance magique.",effects:[]},
 {id:"endurance",name:"Endurance",icon:"❤️",kind:"score",min:0,max:999,defaultValue:3,visible:true,editMode:"points",description:"Points de vie maximum et résistance physique.",effects:[]},
 {id:"initiative",name:"Initiative",icon:"⚡",kind:"score",min:-999,max:999,defaultValue:0,visible:true,editMode:"points",description:"Ordre d’action et tests d’initiative selon les règles de l’univers.",effects:[]}
];
const SYSTEM_BONUSES=[
 {key:"armor",label:"Armure"},{key:"defense",label:"Défense"},{key:"magicDefense",label:"Défense magique"},
 {key:"crit",label:"Critique %"},{key:"mana",label:"Mana"},{key:"dodge",label:"Esquive %"}
];
const clone=x=>{try{return x==null?x:JSON.parse(JSON.stringify(x))}catch(e){return x}};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const attr=esc;
const slug=v=>String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_ -]/g,"").replace(/[ -]+/g,"_").replace(/^_+|_+$/g,"");
const canon=id=>ALIASES[String(id||"")]||String(id||"");
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(list){try{R.saveGameProfiles?.(list);return true}catch(e){return false}}
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function profile(){
 try{
  if(editorOpen()&&R.rpgEditingId){const p=profiles().find(x=>String(x.id)===String(R.rpgEditingId));if(p)return p}
  if(editorOpen()){const edited=R.currentRpgProfile?.();if(edited)return edited}
  const active=R.getActiveGameProfile?.()||profiles().find(x=>String(x.id)===String(R.activeGameProfileId?.()));
  if(active)return active;
  return R.currentRpgProfile?.()||null;
 }catch(e){return null}
}
function dungeonProfile(p=profile()){return String(p?.gameStyle||"").toLowerCase()==="dungeon"&&!!p?.rpgUniverse}
function runtimeDungeon(){try{return typeof R.isDungeonMode==="function"&&R.isDungeonMode()===true}catch(e){return false}}
function runtimeContext(){return runtimeDungeon()&&dungeonProfile(profile())}
function editorContext(){return editorOpen()&&dungeonProfile(profile())}
function contextAllowed(){return runtimeContext()||editorContext()}
function normalizeDef(raw){
 if(!raw||typeof raw!=="object")return null;const id=canon(slug(raw.id||raw.name));if(!id)return null;
 const core=CORE.find(x=>x.id===id)||{},kind=raw.kind==="gauge"?"gauge":"score";
 const min=Number.isFinite(Number(raw.min))?Number(raw.min):(Number.isFinite(Number(core.min))?Number(core.min):0);
 const max=Math.max(min,Number.isFinite(Number(raw.max))?Number(raw.max):(Number.isFinite(Number(core.max))?Number(core.max):999));
 const dv=clamp(Number.isFinite(Number(raw.defaultValue))?Number(raw.defaultValue):(Number(core.defaultValue)||0),min,max);
 return {...clone(core),...clone(raw),id,name:String(raw.name||core.name||id),icon:String(raw.icon||core.icon||"📊"),kind,min,max,defaultValue:dv,visible:raw.visible!==false,editMode:["points","free","runtime"].includes(raw.editMode)?raw.editMode:(core.editMode||"points"),description:String(raw.description??core.description??""),effects:Array.isArray(raw.effects)?clone(raw.effects):[]};
}
function ensure(p=profile(),persist=false){
 if(!p?.rpgUniverse||!dungeonProfile(p))return null;const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
 const source=Array.isArray(s.definitions)?s.definitions:(Array.isArray(s.customStats)?s.customStats:[]);
 const defs=[];const seen=new Set();for(const raw of source){const d=normalizeDef(raw);if(d&&!seen.has(d.id)){defs.push(d);seen.add(d.id)}}
 for(const c of CORE){if(!seen.has(c.id)){defs.push(clone(c));seen.add(c.id)}}
 const active=[];for(const raw of Array.isArray(s.active)?s.active:[]){const id=canon(raw);if(id&&!active.includes(id))active.push(id)}
 if(!active.length)for(const c of CORE)active.push(c.id);
 s.definitions=defs;s.customStats=clone(defs);s.active=active;s.schemaVersion=SCHEMA_VERSION;
 if(persist){const all=profiles(),i=all.findIndex(x=>String(x.id)===String(p.id));if(i>=0){all[i]=p;saveProfiles(all)}}
 return s;
}
function migrateAll(){const all=profiles();let changed=false;for(const p of all){if(!dungeonProfile(p))continue;const before=JSON.stringify(p.rpgUniverse?.stats||{});ensure(p,false);if(before!==JSON.stringify(p.rpgUniverse?.stats||{}))changed=true}if(changed)saveProfiles(all);return changed}
function definitions(opt={}){if(!contextAllowed())return [];const s=ensure(profile(),false);let list=(s?.definitions||[]).map(clone);if(opt.activeOnly){const a=new Set((s?.active||[]).map(canon));list=list.filter(d=>a.has(d.id))}if(opt.visibleOnly)list=list.filter(d=>d.visible!==false);return list}
function definition(id){id=canon(id);return definitions().find(d=>d.id===id)||null}
function activeIds(){if(!contextAllowed())return new Set();return new Set((ensure(profile(),false)?.active||[]).map(canon))}
function isActive(id){return contextAllowed()&&activeIds().has(canon(id))}
function persistDefinitions(list,active=null){if(!editorContext())return false;const p=profile();if(!p)return false;const s=ensure(p,false),out=[],seen=new Set();for(const raw of list||[]){const d=normalizeDef(raw);if(d&&!seen.has(d.id)){out.push(d);seen.add(d.id)}}for(const c of CORE)if(!seen.has(c.id)){out.push(clone(c));seen.add(c.id)}s.definitions=out;s.customStats=clone(out);if(active)s.active=[...new Set([...active].map(canon).filter(Boolean))];return ensure(p,true)&&true}
function setActive(id,on){if(!editorContext())return false;id=canon(id);const p=profile(),s=ensure(p,false);if(!s||!id)return false;const a=new Set(s.active.map(canon));on?a.add(id):a.delete(id);s.active=[...a];ensure(p,true);renderSheet();return true}
function heroState(hero){try{if(String(hero)===String(R.current||"")&&R.state)return R.state;return R.loadState?.(hero)||null}catch(e){return null}}
function heroDefinitionBase(hero,id,def=definition(id)){id=canon(id);if(id==="initiative"){const x=Number(R.CHARS?.[hero]?.dungeonStats?.initiative);if(Number.isFinite(x))return x}try{if(CORE.some(c=>c.id===id)&&typeof R.dungeonBaseAttributeFromDefinition==="function")return Number(R.dungeonBaseAttributeFromDefinition(hero,id))||0}catch(e){}return Number(def?.defaultValue)||0}
function assignedValue(hero,id,def=definition(id)){if(!runtimeContext())return 0;id=canon(id);const st=heroState(hero);let v=Number(st?.rpgAttributes?.[id]);if(Number.isFinite(v))return v;v=Number(st?.customStats?.[id]);if(Number.isFinite(v))return v;return heroDefinitionBase(hero,id,def)}
function equipmentBonus(id){if(!runtimeContext())return 0;try{return Number(R.dungeonEquipmentBonus?.(canon(id)))||0}catch(e){return 0}}
function talentBonus(id){if(!runtimeContext())return 0;try{return Number(R.dungeonSkillEffectTotal?.("attribute",null,canon(id)))||0}catch(e){return 0}}
function temporaryBonus(id){if(!runtimeContext())return 0;try{return Number(R.dungeonChallengeDebuffTotal067?.(canon(id),R.state))||0}catch(e){return 0}}
function effectiveValue(hero,id){if(!runtimeContext())return 0;id=canon(id);const def=definition(id);if(!def)return 0;let v=assignedValue(hero,id,def);if(String(hero)===String(R.current||"")){v+=equipmentBonus(id)+talentBonus(id)+temporaryBonus(id)}try{const api=R.GensCustomStats167879;if(api?.applyEffects)v=Number(api.applyEffects(v,hero,"attribute:"+id,{min:def.min,max:def.max}))}catch(e){}return clamp(Number(v)||0,def.min,def.max)}
function saveHero(hero,st){if(!runtimeContext())return false;try{if(String(hero)===String(R.current||"")&&R.state===st){R.save?.();return true}if(typeof R.key==="function"){localStorage.setItem(R.key(hero),JSON.stringify(st));return true}if(typeof R.saveState==="function"){R.saveState(hero,st);return true}}catch(e){}return false}
function syncState(hero,st=heroState(hero)){if(!runtimeContext()||!st)return null;st.rpgAttributes=st.rpgAttributes&&typeof st.rpgAttributes==="object"?st.rpgAttributes:{};st.customStats=st.customStats&&typeof st.customStats==="object"?st.customStats:{};for(const d of definitions()){if(!Number.isFinite(Number(st.rpgAttributes[d.id]))){const v=assignedValue(hero,d.id,d);st.rpgAttributes[d.id]=v}st.customStats[d.id]=Number(st.rpgAttributes[d.id])||0}return st}
function change(hero,id,delta){
 if(!runtimeContext())return false;hero=String(hero||R.current||"");id=canon(id);delta=Number(delta)||0;if(!hero||!delta)return false;const def=definition(id),st=syncState(hero);if(!def||!st||def.editMode==="runtime")return false;
 try{R.dungeonSyncProgressionForState?.(hero,st)}catch(e){}
 const prog=R.dungeonActiveProgressionConfig?.()||{},free=prog.attributeEditMode==="free"||def.editMode==="free";
 st.rpgStatSpent=Math.max(0,Number(st.rpgStatSpent)||0);st.rpgStatSpentById=st.rpgStatSpentById&&typeof st.rpgStatSpentById==="object"?st.rpgStatSpentById:{};
 const base=heroDefinitionBase(hero,id,def),cur=assignedValue(hero,id,def),next=clamp(cur+delta,def.min,def.max),actual=next-cur;if(!actual)return false;
 if(!free){if(actual>0){if(Math.max(0,Number(st.statPoints)||0)<actual){try{R.alert?.("Aucun point de caractéristique disponible.")}catch(e){}return false}st.rpgStatSpent+=actual;st.rpgStatSpentById[id]=Math.max(0,Number(st.rpgStatSpentById[id])||0)+actual}else{if(cur<=base)return false;const own=Math.max(0,Number(st.rpgStatSpentById[id])||0),legacy=Math.max(0,st.rpgStatSpent),refund=Math.min(-actual,own||legacy);if(refund<=0)return false;st.rpgStatSpent=Math.max(0,legacy-refund);st.rpgStatSpentById[id]=Math.max(0,own-refund)}}
 st.rpgAttributes[id]=next;st.customStats[id]=next;try{R.dungeonSyncProgressionForState?.(hero,st)}catch(e){}
 if(id==="esprit"&&typeof st.mana==="number")try{st.mana=Math.min(st.mana,Number(R.dungeonMaxMana?.())||st.mana)}catch(e){}
 if(id==="endurance"&&typeof st.wounds==="number")try{st.wounds=Math.min(Math.max(0,st.wounds),Number(R.effectiveMaxWounds?.())||st.wounds)}catch(e){}
 saveHero(hero,st);renderSheet();try{R.renderDungeonHeroStats?.()}catch(e){}return true;
}
function setValue(hero,id,value,opt={}){if(!runtimeContext())return false;id=canon(id);const cur=assignedValue(hero,id,definition(id));if(opt.free){const d=definition(id),st=syncState(hero);if(!d||!st)return false;const n=clamp(Number(value)||0,d.min,d.max);st.rpgAttributes[id]=n;st.customStats[id]=n;saveHero(hero,st);renderSheet();return true}return change(hero,id,(Number(value)||0)-cur)}
function bonusFields(){if(!contextAllowed())return SYSTEM_BONUSES.map(clone);const out=SYSTEM_BONUSES.map(clone),seen=new Set(out.map(x=>x.key));for(const d of definitions()){if(!seen.has(d.id)){out.push({key:d.id,label:d.name});seen.add(d.id)}}return out}
function description(id){if(!contextAllowed())return {text:"",links:""};const d=definition(id);if(!d)return {text:"",links:""};const own=String(d.description||"").trim();let links="";try{links=String(R.GensGenericStats167887?.descriptionForSource?.(d.id)||"").trim()}catch(e){}return {text:own,links:links&&links!=="Aucune liaison automatique."?links:""}}
function renderEditor(){
 if(!D||!editorContext())return false;const host=D.getElementById("rpgStatsList");if(!host)return false;const s=ensure(profile(),false);if(!s)return false;D.getElementById("gcs167879Box")?.remove?.();
 const active=new Set(s.active.map(canon));host.dataset.gensStatService="167899";
 host.innerHTML='<div class="gss899Toolbar"><button type="button" id="gss899Add">＋ AJOUTER UNE STAT</button><small>Une seule liste : ces mêmes statistiques sont utilisées en jeu, par les talents, équipements et sets.</small></div>'+s.definitions.map(d=>'<details class="gss899Stat" data-stat-id="'+attr(d.id)+'"><summary><label onclick="event.stopPropagation()"><input type="checkbox" data-gss-active="1" '+(active.has(d.id)?'checked':'')+'> '+esc((d.icon?d.icon+' ':'')+d.name)+'</label><span>'+esc(d.id)+'</span></summary><div class="gss899Grid"><label>Nom<input data-gss="name" value="'+attr(d.name)+'"></label><label>Icône<input data-gss="icon" value="'+attr(d.icon)+'"></label><label>Minimum<input type="number" data-gss="min" value="'+d.min+'"></label><label>Maximum<input type="number" data-gss="max" value="'+d.max+'"></label><label>Valeur de départ<input type="number" data-gss="defaultValue" value="'+d.defaultValue+'"></label><label>Modification<select data-gss="editMode"><option value="points"'+(d.editMode==="points"?' selected':'')+'>Points</option><option value="free"'+(d.editMode==="free"?' selected':'')+'>Libre</option><option value="runtime"'+(d.editMode==="runtime"?' selected':'')+'>Jeu seulement</option></select></label></div><label>Description<textarea data-gss="description">'+esc(d.description||"")+'</textarea></label>'+(CORE.some(c=>c.id===d.id)?'':'<button type="button" data-gss-remove="1">🗑️ SUPPRIMER</button>')+'</details>').join("");
 if(!D.getElementById("gss899Style")){const st=D.createElement("style");st.id="gss899Style";st.textContent='.gss899Toolbar{display:grid;gap:6px;margin:8px 0 12px}.gss899Toolbar button{padding:10px;font-weight:900}.gss899Toolbar small{opacity:.7}.gss899Stat{border-bottom:1px solid #ffffff18;padding:7px 0}.gss899Stat summary{display:flex;justify-content:space-between;gap:10px;align-items:center;font-weight:800}.gss899Stat summary>span{opacity:.5;font-size:10px}.gss899Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.gss899Stat label{display:grid;gap:4px}.gss899Stat textarea{min-height:58px}.gss899Stat [data-gss-remove]{margin-top:8px}@media(max-width:620px){.gss899Grid{grid-template-columns:1fr}}';D.head?.appendChild(st)}
 bindEditor();return true;
}
function editorSnapshot(){if(!editorContext())return null;const host=D?.getElementById("rpgStatsList");if(!host)return null;const defs=definitions();const byId=new Map(defs.map(d=>[d.id,d]));const out=[],active=[];for(const row of host.querySelectorAll?.(".gss899Stat")||[]){const id=canon(row.dataset.statId),old=byId.get(id);if(!old)continue;const q=f=>row.querySelector?.('[data-gss="'+f+'"]');out.push(normalizeDef({...old,name:q("name")?.value,icon:q("icon")?.value,min:q("min")?.value,max:q("max")?.value,defaultValue:q("defaultValue")?.value,editMode:q("editMode")?.value,description:q("description")?.value}));if(row.querySelector?.('[data-gss-active="1"]')?.checked)active.push(id)}return {defs:out,active}}
function saveEditor(){if(!editorContext())return false;const snap=editorSnapshot();if(!snap)return false;const ok=persistDefinitions(snap.defs,snap.active);try{R.GensGenericStats167887?.renderLinksEditor?.()}catch(e){}renderSheet();return ok}
function addDefinition(){if(!editorContext())return false;const defs=definitions(),ids=new Set(defs.map(d=>d.id));let n=1,id="nouvelle_stat";while(ids.has(id))id="nouvelle_stat_"+(++n);defs.push({id,name:"Nouvelle stat",icon:"📊",kind:"score",min:0,max:30,defaultValue:0,visible:true,editMode:"points",description:"",effects:[]});const active=[...activeIds(),id];persistDefinitions(defs,active);renderEditor();return true}
function removeDefinition(id){if(!editorContext())return false;id=canon(id);if(CORE.some(c=>c.id===id))return false;const defs=definitions().filter(d=>d.id!==id),active=[...activeIds()].filter(x=>x!==id);persistDefinitions(defs,active);renderEditor();return true}
function bindEditor(){if(!editorContext())return false;const host=D?.getElementById("rpgStatsList");if(!host||host.dataset.gss899Bound)return false;host.dataset.gss899Bound="1";host.addEventListener("change",()=>saveEditor());host.addEventListener("click",e=>{if(e.target?.id==="gss899Add"){e.preventDefault();addDefinition()}const b=e.target?.closest?.('[data-gss-remove="1"]');if(b){e.preventDefault();const row=b.closest?.(".gss899Stat");if(row&&confirm("Supprimer cette statistique ?"))removeDefinition(row.dataset.statId)}});return true}
function renderSheet(){
 if(!D||!runtimeContext())return false;const host=D.getElementById("dungeonAttributeGrid");if(!host||!R.current||!R.state)return false;try{R.dungeonSyncProgressionForState?.(R.current,R.state)}catch(e){}
 const defs=definitions({activeOnly:true,visibleOnly:true});const p=R.dungeonActiveProgressionConfig?.()||{},free=p.attributeEditMode==="free";
 let banner=D.getElementById("dungeonStatPointsBanner073");if(!banner){banner=D.createElement("div");banner.id="dungeonStatPointsBanner073";host.parentNode?.insertBefore(banner,host)}banner.className="dungeonStatPointsBanner073 "+(free?"free":"points");banner.innerHTML=free?'<strong>🎭 MODE ROLEPLAY — CARACTÉRISTIQUES LIBRES</strong><small>Les + / − ne consomment aucun point.</small>':'<strong>📊 '+Math.max(0,Number(R.state.statPoints)||0)+' POINT'+(Number(R.state.statPoints)===1?'':'S')+' DE CARACTÉRISTIQUE À DISTRIBUER</strong><small>+1 consomme 1 point · −1 rembourse un point dépensé.</small>';
 host.innerHTML=defs.map(d=>{const base=assignedValue(R.current,d.id,d),gear=equipmentBonus(d.id),tal=talentBonus(d.id),v=effectiveValue(R.current,d.id),info=description(d.id),extra=(gear?' · équipement '+(gear>0?'+':'')+gear:'')+(tal?' · talents '+(tal>0?'+':'')+tal:'');return '<div class="dungeonStatBox gss899Card" data-stat-id="'+attr(d.id)+'"><strong>'+esc((d.icon?d.icon+' ':'')+d.name)+'</strong><span>'+v+'</span><small style="display:block">Base '+base+extra+'</small>'+(info.text?'<small class="gss899Description" style="display:block;color:#d6c18a;margin:4px 0">'+esc(info.text)+'</small>':'')+(info.links?'<small class="gss899Links" style="display:block;color:#bdb19b;margin:4px 0">Influence : '+esc(info.links)+'</small>':'')+(d.editMode!=="runtime"?'<div class="controls"><button data-gss-change="-1" data-stat="'+attr(d.id)+'">−</button><button data-gss-change="1" data-stat="'+attr(d.id)+'">+</button></div>':'')+'</div>'}).join("");
 host.dataset.gensStatService="167899";if(!host.dataset.gss899Click){host.dataset.gss899Click="1";host.addEventListener?.("click",sheetClickOnce)}const compact=D.getElementById("dungeonHeroStats");if(compact){compact.style.display="none";compact.innerHTML=""}return true;
}
function sheetClickOnce(e){if(!runtimeContext())return;const b=e.target?.closest?.("[data-gss-change]");if(!b)return;change(R.current,b.dataset.stat,Number(b.dataset.gssChange)||0)}
let nativeRenderAttributes=null,nativeRenderHeroStats=null,nativeEditor=null,nativeSaveStats=null,nativeAttributeValue=null,nativeChange=null;
function installRuntime(){
 if(typeof R.renderDungeonAttributes==="function"&&!R.renderDungeonAttributes.__gss899){nativeRenderAttributes=R.renderDungeonAttributes;const w=function(){if(!runtimeContext())return nativeRenderAttributes.apply(this,arguments);let out;try{out=nativeRenderAttributes.apply(this,arguments)}catch(e){console.warn("GenSrpG stat service native summary",e)}renderSheet();return out};w.__gss899=true;w.__gss899Original=nativeRenderAttributes;R.renderDungeonAttributes=w}
 if(typeof R.renderDungeonHeroStats==="function"&&!R.renderDungeonHeroStats.__gss899){nativeRenderHeroStats=R.renderDungeonHeroStats;const w=function(){if(!runtimeContext())return nativeRenderHeroStats.apply(this,arguments);renderSheet();const compact=D?.getElementById("dungeonHeroStats");if(compact){compact.style.display="none";compact.innerHTML=""}return true};w.__gss899=true;w.__gss899Original=nativeRenderHeroStats;R.renderDungeonHeroStats=w}
 if(typeof R.dungeonAttributeValue==="function"&&!R.dungeonAttributeValue.__gss899){nativeAttributeValue=R.dungeonAttributeValue;const w=function(id){if(!runtimeContext())return nativeAttributeValue.apply(this,arguments);const d=definition(id);return d?effectiveValue(String(R.current||""),id):nativeAttributeValue.apply(this,arguments)};w.__gss899=true;w.__gss899Original=nativeAttributeValue;R.dungeonAttributeValue=w}
 if(typeof R.changeDungeonAttribute==="function"&&!R.changeDungeonAttribute.__gss899){nativeChange=R.changeDungeonAttribute;const w=function(id,delta){if(!runtimeContext())return nativeChange.apply(this,arguments);return definition(id)?change(String(R.current||""),id,delta):nativeChange.apply(this,arguments)};w.__gss899=true;w.__gss899Original=nativeChange;R.changeDungeonAttribute=w}
 if(typeof R.renderRpgUniverseEditor==="function"&&!R.renderRpgUniverseEditor.__gss899){nativeEditor=R.renderRpgUniverseEditor;const w=function(){const out=nativeEditor.apply(this,arguments);if(editorContext())renderEditor();return out};w.__gss899=true;w.__gss899Original=nativeEditor;R.renderRpgUniverseEditor=w}
 if(typeof R.saveRpgUniverseStats==="function"&&!R.saveRpgUniverseStats.__gss899){nativeSaveStats=R.saveRpgUniverseStats;const w=function(){if(!editorContext())return nativeSaveStats.apply(this,arguments);saveEditor();return nativeSaveStats.apply(this,arguments)};w.__gss899=true;w.__gss899Original=nativeSaveStats;R.saveRpgUniverseStats=w}
 return true;
}
function patchCompatibility(){const api=R.GensCustomStats167879;if(api&&!api.__gss899Patched){const original={defs:api.defs,def:api.def,activeIds:api.activeIds,isActive:api.isActive,value:api.value,setValue:api.setValue,change:api.change,renderEditor:api.renderEditor,syncPrimaryList:api.syncPrimaryList,renderHero:api.renderHero,add:api.add,remove:api.remove,persist:api.persist};api.defs=()=>contextAllowed()?definitions():(original.defs?.()||[]);api.def=id=>contextAllowed()?definition(id):(original.def?.(id)||null);api.activeIds=()=>contextAllowed()?activeIds():(original.activeIds?.()||new Set());api.isActive=id=>contextAllowed()?isActive(id):!!original.isActive?.(id);api.value=(hero,id)=>runtimeContext()?assignedValue(hero,id,definition(id)):(Number(original.value?.(hero,id))||0);api.setValue=(hero,id,v,opt)=>runtimeContext()?setValue(hero,id,v,opt):!!original.setValue?.(hero,id,v,opt);api.change=(id,delta)=>runtimeContext()?change(String(R.current||""),id,delta):!!original.change?.(id,delta);api.renderEditor=()=>editorContext()?renderEditor():!!original.renderEditor?.();api.syncPrimaryList=()=>editorContext()?true:!!original.syncPrimaryList?.();api.renderHero=()=>runtimeContext()?renderSheet():!!original.renderHero?.();api.add=()=>editorContext()?addDefinition():original.add?.();api.remove=i=>{if(!editorContext())return original.remove?.(i);const d=definitions()[Number(i)];return d?removeDefinition(d.id):false};api.persist=()=>editorContext()?saveEditor():!!original.persist?.();api.__gss899Patched=true;api.__gss899Original=original}return true}
function install(){migrateAll();installRuntime();patchCompatibility();if(editorContext())renderEditor();if(runtimeContext()){try{nativeRenderAttributes?.();renderSheet()}catch(e){}}try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true}
R.GensStatService167899={VERSION,APP_VERSION,SCHEMA_VERSION,ALIASES,CORE,canon,profile,dungeonProfile,runtimeDungeon,runtimeContext,editorContext,contextAllowed,ensure,migrateAll,definitions,definition,activeIds,isActive,setActive,persistDefinitions,heroState,syncState,assignedValue,effectiveValue,change,setValue,bonusFields,description,renderEditor,saveEditor,addDefinition,removeDefinition,renderSheet,installRuntime,patchCompatibility,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();