/* GenSrpG V16.79.03 — built-in Dungeon hero art recovery.
   Replaces obsolete generated SVG portraits with the real repository PNGs.
   Custom raster images remain untouched. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.79.03";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
function obsolete(src){src=String(src||"").trim();return !src||/^data:image\/svg/i.test(src)||/^idbasset:/i.test(src)}
function repairData(id){const c=R.CHARS?.[id],art=ART[id];if(!c||!art)return false;let changed=false;if(obsolete(c.image)){c.image=art;changed=true}if(obsolete(c.avatar)){c.avatar=art;changed=true}return changed}
function repairAll(){let n=0;for(const id of Object.keys(ART))if(repairData(id))n++;return n}
function repairParticipantDom(){if(!D)return 0;let n=0;for(const row of D.querySelectorAll("#participantList .participantRow")){const label=(row.querySelector(".participantName")?.textContent||"").trim();const name=Object.keys(NAMES).find(x=>label.startsWith(x));if(!name)continue;const id=NAMES[name],img=row.querySelector("img.participantAvatar");if(img&&obsolete(img.getAttribute("src"))){img.src=ART[id];n++}else if(img&&/^data:image\/svg/i.test(img.src||"")){img.src=ART[id];n++}}return n}
function repairSheetDom(){if(!D)return 0;const id=String(R.current||"");if(!ART[id])return 0;let n=0;for(const img of [D.getElementById("charImage"),D.getElementById("customSheetAvatar")]){if(img&&obsolete(img.getAttribute("src"))){img.src=ART[id];n++}}return n}
function schedule(){const run=()=>{repairAll();repairParticipantDom();repairSheetDom()};if(typeof R.requestAnimationFrame==="function")R.requestAnimationFrame(run);else setTimeout(run,0)}
function hook(name){const old=R[name];if(typeof old!=="function"||old.__gha903)return false;const w=function(){repairAll();const out=old.apply(this,arguments);schedule();return out};w.__gha903=true;w.__original=old;R[name]=w;return true}
function observe(){if(!D||typeof R.MutationObserver!=="function"||D.__gha903Obs)return;D.__gha903Obs=new R.MutationObserver(m=>{if(m.some(x=>x.target?.closest?.("#participantList,#sheet")||x.target?.id==="participantList"))schedule()});D.__gha903Obs.observe(D.documentElement,{childList:true,subtree:true})}
function install(){try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}repairAll();hook("ensureDungeonHeroes");hook("renderParticipantSelector");hook("openChar");observe();schedule();return true}
R.GensBuiltinHeroArtRecovery167903={VERSION,APP_VERSION,ART,obsolete,repairData,repairAll,repairParticipantDom,repairSheetDom,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
