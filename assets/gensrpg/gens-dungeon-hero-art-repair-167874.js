/* GenSrpG V16.78.74 — visual-only repair for built-in Dungeon hero art.
   Restores PNG assets when an obsolete generated SVG/data URI is still stored.
   No statistics, progression, combat, movement or save schema changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const HERO_ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const HERO_NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
let scheduled=false,observer=null;
function obsolete(src){src=String(src||"").trim();return !src||/^data:image\/svg/i.test(src)}
function repairDefs(){let n=0;for(const [id,art] of Object.entries(HERO_ART)){const c=R.CHARS?.[id];if(!c)continue;if(obsolete(c.image)){c.image=art;n++}if(obsolete(c.avatar)){c.avatar=art;n++}}return n}
function repairParticipants(){if(!D)return 0;let n=0;for(const row of D.querySelectorAll("#participantList .participantRow")){const txt=(row.querySelector(".participantName")?.textContent||"").trim();const name=Object.keys(HERO_NAMES).find(x=>txt.startsWith(x));if(!name)continue;const img=row.querySelector("img.participantAvatar"),art=HERO_ART[HERO_NAMES[name]];if(img&&obsolete(img.getAttribute("src"))){img.src=art;n++}}return n}
function repairSheet(){if(!D)return 0;const id=String(R.current||""),art=HERO_ART[id];if(!art)return 0;let n=0;for(const img of [D.getElementById("charImage"),D.getElementById("customSheetAvatar")])if(img&&obsolete(img.getAttribute("src"))){img.src=art;n++}return n}
function repair(){return repairDefs()+repairParticipants()+repairSheet()}
function schedule(){if(scheduled)return;scheduled=true;const run=()=>{scheduled=false;try{repair()}catch(e){}};typeof R.requestAnimationFrame==="function"?R.requestAnimationFrame(run):setTimeout(run,0)}
function hook(name){const old=R[name];if(typeof old!=="function"||old.__gdar167874)return;const w=function(){if(name==="ensureDungeonHeroes")repairDefs();const out=old.apply(this,arguments);schedule();return out};w.__gdar167874=true;w.__original=old;R[name]=w}
function observe(){if(!D||observer||typeof R.MutationObserver!=="function")return;observer=new R.MutationObserver(m=>{for(const x of m){const t=x.target;if(t?.id==="participantList"||t?.closest?.("#participantList,#sheet")){schedule();break}}});observer.observe(D.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]})}
function install(){repairDefs();for(const n of ["ensureDungeonHeroes","renderParticipantSelector","openChar"])hook(n);observe();schedule();return true}
R.GensDungeonHeroArtRepair167874={HERO_ART,obsolete,repairDefs,repairParticipants,repairSheet,repair,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
