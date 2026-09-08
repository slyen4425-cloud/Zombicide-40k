/* GenSrpG V16.78.99 — final shared-stat bridge.
   Loaded last. It gives the shared stat service final UI/runtime authority without
   merging Dungeon classic with the authored/Builder engine. Outside Dungeon RPG,
   it is intentionally inert. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="5.1.0",APP_VERSION="16.78.99";
function service(){return R.GensStatService167899||null}
function contextAllowed(){try{return service()?.contextAllowed?.()===true}catch(e){return false}}
function editorContext(){try{return service()?.editorContext?.()===true}catch(e){return false}}
function runtimeContext(){try{return service()?.runtimeContext?.()===true}catch(e){return false}}
function syncLegacyBonusFields(){
 const s=service();if(!s?.bonusFields||!contextAllowed())return false;const fields=s.bonusFields().map(f=>({key:String(f.key),label:String(f.label)}));
 for(const api of [R.DungeonEquipmentHotfix167817,R.DungeonSetEditor]){const arr=api?.FIELDS;if(Array.isArray(arr)){arr.splice(0,arr.length,...fields)}}
 return true;
}
function clean(){
 if(!contextAllowed())return false;
 try{D?.getElementById("gcsHeroStats")?.remove?.()}catch(e){}
 try{D?.getElementById("gcs167879Box")?.remove?.()}catch(e){}
 try{D?.querySelectorAll?.('#rpgStatsList [data-gcs-primary="1"]').forEach(n=>n.remove())}catch(e){}
 return true;
}
function patchEquipmentOpen(){
 const old=R.openEquipmentEditor;if(typeof old!=="function"||old.__gss899Equipment)return false;
 const w=function(){if(!editorContext()&&!runtimeContext())return old.apply(this,arguments);syncLegacyBonusFields();const out=old.apply(this,arguments);syncLegacyBonusFields();try{R.DungeonEquipmentHotfix167817?.loadEditor?.(R.dungeonItems?.().find(x=>String(x?.id)===String(D?.getElementById("eqEditId")?.value||"")))}catch(e){}try{R.DungeonSetEditor?.syncEditorFromCurrentItem?.()}catch(e){}return out};
 w.__gss899Equipment=true;w.__original=old;R.openEquipmentEditor=w;return true;
}
function install(){
 const s=service();if(!s)return false;
 s.installRuntime?.();s.patchCompatibility?.();patchEquipmentOpen();
 if(contextAllowed()){syncLegacyBonusFields();clean();if(editorContext())s.renderEditor?.();if(runtimeContext())s.renderSheet?.()}
 try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
 return true;
}
R.GensCustomStatRuntimeProfile167889={VERSION,APP_VERSION,install,contextAllowed,editorContext,runtimeContext,syncLegacyBonusFields,clean,patchEquipmentOpen};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install();if(typeof setTimeout==="function")setTimeout(install,0)}
})();