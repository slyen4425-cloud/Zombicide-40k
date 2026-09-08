/* GenSrpG V16.78.96 — canonical custom-stat authority + unified final hero renderer.
   rpgUniverse.stats remains the only persisted definition source. Legacy activation is
   repaired once, then one final renderer owns custom-stat cards in gameplay so old
   attrRow output cannot mask the configured cards/descriptions/buttons.
   No movement/spawn/timeline/combat hooks, no observer, timer or dynamic loader. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="3.0.0",APP_VERSION="16.78.96",MIGRATION_KEY="customStatAuthorityV167895";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
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
  refreshSheet();renderUnifiedStats();
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
  api.renderHero=renderUnifiedStats;
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
      try{R.GensCustomStats167879?.persist?.()}catch(e){console.warn("GenSrpG V16.78.96 autosave stat",e)}
    });
  }
  return true;
}
function patchEditorRenderer(){
  const old=R.renderRpgUniverseEditor;if(typeof old!=="function"||old.__gcsAuthority167895)return false;
  const wrapped=function(){const out=old.apply(this,arguments);try{R.GensCustomStats167879?.syncPrimaryList?.()}catch(e){}bindEditorAutosave();return out};
  wrapped.__gcsAuthority167895=true;wrapped.__original=old;R.renderRpgUniverseEditor=wrapped;return true;
}
function currentHero(){try{return String(R.current||"")}catch(e){return ""}}
function activeCustomDefs(){
  try{
    const api=R.GensCustomStats167879,p=contextProfile(),active=rawActiveSet(p),defs=api?.defs?.()||[];
    return defs.filter(d=>d&&d.id&&active.has(String(d.id))&&d.visible!==false);
  }catch(e){return []}
}
function renderUnifiedStats(){
  try{
    if(!D)return false;
    const grid=D.getElementById("dungeonAttributeGrid");if(!grid)return false;
    D.getElementById("gcsHeroStats")?.remove?.();
    grid.querySelectorAll?.(".gsrCustomStatCard")?.forEach?.(n=>n.remove?.());
    const heroId=currentHero(),api=R.GensCustomStats167879;if(!heroId||!api)return false;
    const state=R.loadState?.(heroId)||{},points=Math.max(0,Number(state.statPoints)||0),defs=activeCustomDefs();
    for(const d of defs){
      const id=String(d.id),value=Number(api.value?.(heroId,id));
      const v=Number.isFinite(value)?value:Number(d.defaultValue)||0,card=D.createElement("div");
      card.className="dungeonStatBox gsrCustomStatCard";card.dataset.statId=id;
      const mode=String(d.editMode||"free"),editable=mode!=="runtime",canAdd=mode!=="points"||points>0;
      const desc=String(d.description||"").trim();
      const links=String(R.GensGenericStats167887?.descriptionForSource?.(id)||"").trim();
      const descHtml=desc?'<small class="gsrCustomStatDescription" style="display:block;margin-top:10px;color:#d6c18a">'+esc(desc)+'</small>':'';
      const linksHtml=links&&links!=="Aucune liaison automatique."?'<small class="gsrCustomStatLinks" style="display:block;margin-top:6px;color:#bdb19b">Influence : '+esc(links)+'</small>':'';
      const poolHtml=mode==="points"?'<small class="gsrCustomStatPoints" style="display:block;margin-top:6px">Points disponibles : '+points+'</small>':'';
      const controls=editable?'<div class="gsrCustomStatControls" style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button type="button" onclick="GensCustomStatRuntimeProfile167889.change(\''+esc(id)+'\',-1)">−</button><button type="button" '+(canAdd?'':'disabled title="Aucun point de caractéristique disponible"')+' onclick="GensCustomStatRuntimeProfile167889.change(\''+esc(id)+'\',1)">＋</button></div>':'';
      card.innerHTML='<strong>'+esc((d.icon?d.icon+' ':'')+(d.name||id))+'</strong><div style="font-size:36px;font-weight:900;line-height:1.05;margin:4px 0">'+v+(d.kind==="gauge"?' / '+Number(d.max||0):'')+'</div><small>Base '+(Number(d.defaultValue)||0)+'</small>'+poolHtml+descHtml+linksHtml+controls;
      grid.appendChild(card);
    }
    grid.dataset.gensUnifiedCustomStats="167896";
    grid.dataset.gensActiveCustomStatIds=defs.map(d=>String(d.id)).join(",");
    return true;
  }catch(error){console.warn("GenSrpG V16.78.96 unified stat renderer",error);return false}
}
function change(id,delta){
  try{
    const ok=R.GensCustomStats167879?.change?.(String(id),Number(delta)||0)===true;
    renderUnifiedStats();
    return ok;
  }catch(e){return false}
}
function wrapAfter(name,host=R){
  const old=host?.[name];if(typeof old!=="function"||old.__gcsUnified167896)return false;
  const wrapped=function(){const out=old.apply(this,arguments);renderUnifiedStats();return out};
  wrapped.__gcsUnified167896=true;wrapped.__original=old;host[name]=wrapped;return true;
}
function patchSheetRenderers(){
  wrapAfter("renderDungeonAttributes",R);wrapAfter("renderDungeonHeroStats",R);
  const core=R.DungeonCore01;if(core){wrapAfter("render",core);wrapAfter("show",core)}
  return true;
}
function refreshSheet(){try{return R.GensGenericStats167887?.patchSheetTexts?.()||false}catch(e){return false}}
function install(){
  try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
  migrateProfiles();patchCanonicalApi();patchEditorRenderer();patchSheetRenderers();
  try{R.GensCustomStats167879?.syncPrimaryList?.()}catch(e){}
  bindEditorAutosave();refreshSheet();renderUnifiedStats();return true;
}
R.GensCustomStatRuntimeProfile167889={VERSION,APP_VERSION,MIGRATION_KEY,editorOpen,activeProfile,contextProfile,profileStats,migrateProfile,migrateProfiles,rawActiveSet,setActive,patchCanonicalApi,bindEditorAutosave,patchEditorRenderer,currentHero,activeCustomDefs,renderUnifiedStats,change,patchSheetRenderers,refreshSheet,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
