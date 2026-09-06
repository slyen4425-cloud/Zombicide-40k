/* GenSrpG Dungeon — cache editor stability 16.78.51.
   Prevents the legacy World Builder rerender from replacing the secondary-cache UI
   immediately after a mobile "Lier" action, and keeps the validation summary aligned
   with the actual secondary cache bindings. Authored World Builder only. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.51";
let installed=false,restoreTimer=0;
function builder(){return ROOT.DungeonWorldBuilder167821||null}
function links(){return ROOT.DungeonZoneLinks167846||null}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function currentGraph(){const B=builder();if(!B||!DOC)return null;const name=String(DOC.getElementById("drc300Name")?.value||"").trim();const list=B.loadLibrary?.()||[];return list.find(g=>String(g?.name||"")===name)||null}
function actualCacheCount(g){return (g?.cacheBindings||[]).filter(b=>String(b?.targetRoomId||"")||String(b?.targetNodeId||"")).length}
function syncSummary(){const B=builder(),g=currentGraph(),box=DOC?.getElementById("drc300Validation");if(!B||!g||!box)return false;let v=null;try{v=B.validation?.(g)||null}catch(e){}const errors=Array.isArray(v?.errors)?v.errors:[],warnings=Array.isArray(v?.warnings)?v.warnings:[],nodeCount=Number(v?.nodeCount??g.nodes?.length??0),edgeCount=Number(v?.edgeCount??g.edges?.length??0),cacheCount=actualCacheCount(g),valid=v?.valid!==false;box.className="drc300Status"+((errors.length||warnings.length)?" drc300Warn":"");box.innerHTML='<b>'+(valid?'Structure enregistrable':'Structure incomplète')+'</b> · '+nodeCount+' pièce(s) · '+edgeCount+' connexion(s) · '+cacheCount+' cache(s) liée(s)'+(errors.length?'<br>❌ '+errors.map(esc).join('<br>❌ '):'')+(warnings.length?'<br>⚠️ '+warnings.map(esc).join('<br>⚠️ '):'');return true}
function shieldLegacyOpen(){const B=builder();if(!B||typeof B.open!=="function"||B.open.__cacheShield167851)return false;const original=B.open;function noop(){return false}noop.__cacheShield167851=true;B.open=noop;clearTimeout(restoreTimer);restoreTimer=setTimeout(()=>{if(B.open===noop)B.open=original;try{links()?.refreshEditors?.();syncSummary()}catch(e){}},0);return true}
function captureLink(e){const btn=e?.target?.closest?.("#drc300Caches [data-zl-save]");if(!btn)return;shieldLegacyOpen();setTimeout(()=>{try{links()?.renderWorldCacheBindings?.();syncSummary()}catch(err){console.warn("Cache editor stability",err)}},0)}
function install(){if(!DOC||installed)return !!DOC;installed=true;DOC.addEventListener("click",captureLink,true);DOC.addEventListener("click",e=>{if(e?.target?.closest?.("#drc300Modal"))setTimeout(syncSummary,0)},true);for(const ms of [0,50,250,1000])setTimeout(()=>{try{links()?.refreshEditors?.();syncSummary()}catch(e){}},ms);return true}
ROOT.DungeonCacheEditorStability167851={VERSION,APP_VERSION,currentGraph,actualCacheCount,syncSummary,shieldLegacyOpen,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
