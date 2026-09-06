/* GenSrpG Dungeon — final authored bootstrap 16.78.49.
   Ensures the authored World Builder runtime owns the first visible Explore click,
   and loads secondary zone links/cache guards in production. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const PRIMARY_KEY="gensrpg_dungeon_primary_selection_v167833";
const VERSION="1.0.0",APP_VERSION="16.78.49";
let installed=false;
function primary(){try{const p=ROOT.DungeonWorldSessionBridge167832?.primary?.();if(p)return p}catch(e){}try{return JSON.parse(localStorage.getItem(PRIMARY_KEY)||"null")}catch(e){return null}}
function builtSelected(){const p=primary();return String(p?.kind||"")==="world"&&!!p?.id}
function loadScript(id,src,ready){if(!DOC){ready?.();return}if(ROOT[id]){ready?.();return}const existing=DOC.querySelector?.('script[data-authored-bootstrap="'+id+'"]');if(existing){if(ready)existing.addEventListener("load",ready,{once:true});return}const s=DOC.createElement("script");s.dataset.authoredBootstrap=id;s.src=src;s.async=false;if(ready)s.addEventListener("load",ready,{once:true});DOC.body?.appendChild(s)}
function ensureExtras(){loadScript("DungeonZoneLinks167846","assets/dungeon/dungeon-zone-links-167846.js?v=167848",()=>{try{ROOT.DungeonZoneLinks167846?.install?.()}catch(e){}});loadScript("DungeonAuthoredCacheGuard167849","assets/dungeon/dungeon-authored-cache-guard-167849.js?v=167849",()=>{try{ROOT.DungeonAuthoredCacheGuard167849?.install?.()}catch(e){}})}
function repair(){if(!builtSelected())return false;try{ROOT.DungeonAuthoredRuntime167839?.install?.();ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.();ROOT.DungeonZoneLinks167846?.install?.();ROOT.DungeonAuthoredCacheGuard167849?.install?.()}catch(e){}return !!ROOT.DungeonAuthoredRuntime167839?.active?.()}
function intercept(e){const btn=e?.target?.closest?.("#dc01Explore");if(!btn||!builtSelected())return;const A=ROOT.DungeonAuthoredRuntime167839;if(!A?.active?.()){repair();if(!A?.active?.()){e.preventDefault();e.stopImmediatePropagation();try{ROOT.showToast?.("⏳ Chargement du donjon construit…") }catch(err){}setTimeout(repair,0);return}}
 e.preventDefault();e.stopImmediatePropagation();try{A.travel?.()}catch(err){console.warn("Authored bootstrap travel",err)}}
function install(){if(!DOC)return false;ensureExtras();repair();if(!installed){DOC.addEventListener("click",intercept,true);DOC.addEventListener("click",()=>setTimeout(repair,0),true);installed=true}for(const ms of [0,50,250,1000])setTimeout(()=>{ensureExtras();repair()},ms);return true}
ROOT.DungeonAuthoredBootstrap167849={VERSION,APP_VERSION,primary,builtSelected,ensureExtras,repair,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
