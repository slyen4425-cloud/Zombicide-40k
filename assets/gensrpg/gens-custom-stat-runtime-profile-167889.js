/* GenSrpG V16.78.95 — canonical custom-stat authority + active profile bridge.
   This keeps rpgUniverse.stats as the only persisted source. It repairs legacy V81-V94
   profiles where Furtivité was force-activated while other created stats could stay out
   of stats.active, then autosaves future custom-stat activation/definition changes.
   No movement/spawn/timeline/combat hooks, no observer, timer or dynamic loader. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="2.0.0",APP_VERSION="16.78.95",MIGRATION_KEY="customStatAuthorityV167895";
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function activeProfile(){try{return R.getActiveGameProfile?.()||null}catch(e){return null}}
function contextProfile(){
  try{
    if(editorOpen()&&typeof R.currentRpgProfile==="function")return R.currentRpgProfile()||activeProfile();
    return activeProfile()||(typeof R.currentRpgProfile==="function"?R.currentRpgProfile():null);
  }catch(e){return activeProfile()}
}
function profileStats(p){
  if(!p?.rpgUniverse)return null;
  p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
  const s=p.rpgUniverse.stats;
  s.active=Array.isArray(s.active)?s.active.map(String):[];
  s.customStats=Array.isArray(s.customStats)?s.customStats:[];
  return s;
}
function saveProfile(p){
  try{
    if(!p)return false;
    const all=R.loadGameProfiles?.()||[],i=all.findIndex(x=>String(x?.id||"")===String(p.id||""));
    if(i<0)return false;all[i]=p;R.saveGameProfiles?.(all);return true;
  }catch(e){return false}
}
function migrateProfile(p){
  const s=profileStats(p);if(!s||s[MIGRATION_KEY]===true)return false;
  const active=new Set(s.active.map(String));
  // V81-V94 created a new custom stat as active by default. Repair old profiles once so
  // every already-created characteristic receives the same treatment as Furtivité.
  for(const d of s.customStats){const id=String(d?.id||"");if(id)active.add(id)}
  s.active=[...active];s[MIGRATION_KEY]=true;return true;
}
function migrateProfiles(){
  try{
    const all=R.loadGameProfiles?.()||[];let changed=false;
    for(const p of all)if(p?.gameStyle==="dungeon"&&migrateProfile(p))changed=true;
    if(changed)R.saveGameProfiles?.(all);
    return changed;
  }catch(e){return false}
}
function rawActiveSet(p=contextProfile()){
  const s=profileStats(p);return new Set((s?.active||[]).map(String));
}
function setActive(id,enabled){
  const p=contextProfile(),s=profileStats(p);id=String(id||"");if(!s||!id)return false;
  const active=new Set(s.active.map(String));enabled?active.add(id):active.delete(id);s.active=[...active];
  const ok=saveProfile(p);
  try{R.GensGenericStats167887?.patchSheetTexts?.()}catch(e){}
  try{R.renderDungeonAttributes?.();R.renderDungeonHeroStats?.()}catch(e){}
  return ok;
}
function patchCanonicalApi(){
  const api=R.GensCustomStats167879;if(!api||api.__gcsAuthority167895)return false;
  const redirectNames=["value","setValue","change","syncHero"];
  for(const name of redirectNames){
    const old=api[name];if(typeof old!=="function"||old.__gcsAuthority167895)continue;
    const wrapped=function(){
      if(editorOpen()||typeof R.currentRpgProfile!=="function"||typeof R.getActiveGameProfile!=="function")return old.apply(api,arguments);
      const prior=R.currentRpgProfile,p=contextProfile(),before=[...rawActiveSet(p)];
      try{
        R.currentRpgProfile=function(){return p||prior()};
        return old.apply(api,arguments);
      }finally{
        R.currentRpgProfile=prior;
        const s=profileStats(p);if(s&&s[MIGRATION_KEY]===true)s.active=before;
      }
    };
    wrapped.__gcsAuthority167895=true;wrapped.__original=old;api[name]=wrapped;
  }
  // Do not call the legacy activeIds/isActive implementation: it invokes the V81
  // ensure() routine that force-adds Furtivité. stats.active is authoritative now.
  api.activeIds=function(){return rawActiveSet()};
  api.isActive=function(id){return rawActiveSet().has(String(id))};
  const oldDefs=api.defs;
  if(typeof oldDefs==="function"){
    api.defs=function(){
      const p=contextProfile(),before=[...rawActiveSet(p)],prior=R.currentRpgProfile;
      try{
        if(!editorOpen()&&p&&typeof prior==="function")R.currentRpgProfile=function(){return p};
        return oldDefs.apply(api,arguments);
      }finally{
        if(typeof prior==="function")R.currentRpgProfile=prior;
        const s=profileStats(p);if(s&&s[MIGRATION_KEY]===true)s.active=before;
      }
    };
  }
  api.def=function(id){return (api.defs?.()||[]).find(x=>String(x?.id||"")===String(id))||null};
  api.__gcsAuthority167895=true;return true;
}
function bindEditorAutosave(){
  if(!D)return false;
  const primary=D.getElementById("rpgStatsList");
  if(primary&&!primary.dataset.gcsAuthority167895){
    primary.dataset.gcsAuthority167895="1";
    primary.addEventListener("change",event=>{
      const input=event.target?.closest?.('[data-gcs-primary="1"] input[type="checkbox"]');
      if(input)setActive(input.value,!!input.checked);
    });
  }
  const custom=D.getElementById("gcs167879Box");
  if(custom&&!custom.dataset.gcsAuthority167895){
    custom.dataset.gcsAuthority167895="1";
    custom.addEventListener("change",event=>{
      const t=event.target;if(!t?.matches?.("[data-gcs],[data-e]"))return;
      try{R.GensCustomStats167879?.persist?.()}catch(e){console.warn("GenSrpG V16.78.95 autosave stat",e)}
    });
  }
  return true;
}
function patchEditorRenderer(){
  const old=R.renderRpgUniverseEditor;if(typeof old!=="function"||old.__gcsAuthority167895)return false;
  const wrapped=function(){const out=old.apply(this,arguments);try{R.GensCustomStats167879?.syncPrimaryList?.()}catch(e){}bindEditorAutosave();return out};
  wrapped.__gcsAuthority167895=true;wrapped.__original=old;R.renderRpgUniverseEditor=wrapped;return true;
}
function refreshSheet(){try{return R.GensGenericStats167887?.patchSheetTexts?.()||false}catch(e){return false}}
function install(){
  try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
  migrateProfiles();patchCanonicalApi();patchEditorRenderer();
  try{R.GensCustomStats167879?.syncPrimaryList?.()}catch(e){}
  bindEditorAutosave();refreshSheet();return true;
}
R.GensCustomStatRuntimeProfile167889={VERSION,APP_VERSION,MIGRATION_KEY,editorOpen,activeProfile,contextProfile,profileStats,migrateProfile,migrateProfiles,rawActiveSet,setActive,patchCanonicalApi,bindEditorAutosave,patchEditorRenderer,refreshSheet,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
