/* GenSrpG V16.79.02 — RPG stat UI reconciliation.
   No second registry/calculation engine: values and definitions always come from
   GensRpgStatService167901. This bridge only guarantees that the persisted active
   profile is applied after editing, the derived-rule editor stays visible, and
   authored stats are present on the real Dungeon hero sheet. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.79.02";
function explicitDungeon(){try{return !!R.isDungeonMode?.()&&!D?.body?.classList?.contains("gens-pure-capture")&&!D?.body?.classList?.contains("gens-capture-gameplay")}catch(e){return false}}
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function persistedProfile(){try{
 const all=R.loadGameProfiles?.()||[],edited=editorOpen()?R.currentRpgProfile?.():null;if(edited?.rpgUniverse)return all.find(p=>String(p.id)===String(edited.id))||edited;
 const id=String(R.activeGameProfileId?.()||""),active=all.find(p=>String(p?.id||"")===id&&p?.rpgUniverse);if(active)return active;
 const current=R.currentRpgProfile?.();if(current?.rpgUniverse)return all.find(p=>String(p.id)===String(current.id))||current;
 return all.find(p=>p?.gameStyle==="dungeon"&&p?.rpgUniverse)||null;
}catch(e){return null}}
function syncProfile(){const p=persistedProfile();if(!p)return null;try{R.applyGameProfile?.(p,false)}catch(e){}return p}
function showRules(){if(!D||!editorOpen())return false;try{const g=R.GensGenericStats167887;if(!g?.renderLinksEditor)return false;g.renderLinksEditor();const rules=D.getElementById("gsr167887Box"),defs=D.getElementById("gss901Editor");if(rules){rules.style.display="block";if(defs&&rules.previousElementSibling!==defs)defs.insertAdjacentElement("afterend",rules)}return !!rules}catch(e){return false}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function addMissingCards(){if(!D||!explicitDungeon())return false;const api=R.GensRpgStatService167901,host=D.getElementById("dungeonAttributeGrid"),hero=String(R.current||"");if(!api||!host||!hero)return false;
 let defs=[];try{defs=api.definitions?.()||[]}catch(e){}
 const persisted=persistedProfile()?.rpgUniverse?.stats?.customStats||[];
 if(persisted.some(p=>!defs.some(d=>String(d?.id)===String(p?.id)))){syncProfile();try{defs=api.definitions?.()||defs}catch(e){}}
 defs=defs.filter(d=>d?.visible!==false&&api.isActive?.(d.id));
 for(const d of defs){if(host.querySelector?.('[data-stat-id="'+String(d.id).replace(/"/g,'\\"')+'"]'))continue;let base=0,val=0,gear=0,talent=0;try{base=api.baseValue?.(hero,d.id)??0;val=api.value?.(hero,d.id)??base;gear=api.equipmentBonus?.(d.id)||0;talent=api.talentBonus?.(d.id)||0}catch(e){}
   const div=D.createElement("div");div.className="dungeonStatBox gss902RecoveredCard";div.dataset.statId=String(d.id);div.innerHTML='<strong>'+esc((d.icon?d.icon+' ':'')+(d.name||d.id))+'</strong><span>'+esc(val)+'</span><small style="display:block">Base '+esc(base)+(gear?' · équipement '+(gear>0?'+':'')+gear:'')+(talent?' · talents '+(talent>0?'+':'')+talent:'')+'</small>'+(d.description?'<small style="display:block;color:#d6c18a;margin:4px 0">'+esc(d.description)+'</small>':'')+(d.editMode!=="runtime"?'<div class="controls"><button type="button" data-gss902="-1" data-stat="'+esc(d.id)+'">−</button><button type="button" data-gss902="1" data-stat="'+esc(d.id)+'">+</button></div>':'');host.appendChild(div)
 }
 if(!host.dataset.gss902){host.dataset.gss902="1";host.addEventListener?.("click",e=>{const b=e.target?.closest?.("[data-gss902]");if(!b)return;R.GensRpgStatService167901?.change?.(b.dataset.stat,Number(b.dataset.gss902)||0);setTimeout(reconcileSheet,0)})}
 return true}
function reconcileSheet(){if(!explicitDungeon())return false;const api=R.GensRpgStatService167901;if(!api)return false;try{api.renderSheet?.()}catch(e){}return addMissingCards()}
function afterStatSave(){const p=syncProfile();try{R.GensRpgStatService167901?.neutralizeLegacy?.()}catch(e){}try{R.GensGenericStats167887?.ensureRules?.(p)}catch(e){}showRules();if(explicitDungeon())reconcileSheet()}
function hook(name,after){const old=R[name];if(typeof old!=="function"||old.__gss902)return false;const w=function(){const out=old.apply(this,arguments);try{after()}catch(e){}return out};w.__gss902=true;w.__original=old;R[name]=w;return true}
function install(){try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}hook("renderRpgUniverseEditor",()=>{setTimeout(()=>{showRules()},0)});hook("renderDungeonAttributes",()=>{setTimeout(reconcileSheet,0)});hook("renderDungeonHeroStats",()=>{setTimeout(reconcileSheet,0)});hook("openChar",()=>{setTimeout(reconcileSheet,0)});
 if(D&&!D.__gss902Bound){D.__gss902Bound=true;D.addEventListener("click",e=>{if(e.target?.closest?.("[data-gss901-save]"))setTimeout(afterStatSave,0)},true);D.addEventListener("change",e=>{if(e.target?.closest?.("#gss901Editor"))setTimeout(showRules,0)},true)}
 if(editorOpen())setTimeout(showRules,0);if(explicitDungeon())setTimeout(reconcileSheet,0);return true}
R.GensRpgStatReconcile167902={VERSION,APP_VERSION,explicitDungeon,persistedProfile,syncProfile,showRules,addMissingCards,reconcileSheet,afterStatSave,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
