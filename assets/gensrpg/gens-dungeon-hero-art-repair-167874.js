/* GenSrpG V16.78.75 — visual-only repair for built-in Dungeon hero art.
   Built-in Dungeon heroes always use their official PNG assets, even when an older generated
   portrait or stale avatar path is still present. No stats, progression, combat or save schema changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const HERO_ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const HERO_NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const FINAL_EXIT_SRC="assets/dungeon/dungeon-authored-final-exit-167875.js?v=167875";
let scheduled=false,observer=null;
function same(a,b){return String(a||"").split("?")[0].split("#")[0].endsWith(String(b||""))}
function forceImg(img,art){if(!img||!art)return 0;const src=img.getAttribute?.("src")||img.src||"";if(same(src,art))return 0;try{img.src=art;img.setAttribute?.("src",art);return 1}catch(e){return 0}}
function repairDefs(){let n=0;for(const [id,art] of Object.entries(HERO_ART)){const c=R.CHARS?.[id];if(!c)continue;if(c.image!==art){c.image=art;n++}if(c.avatar!==art){c.avatar=art;n++}}return n}
function nameId(text){const t=String(text||"").trim();for(const [name,id] of Object.entries(HERO_NAMES))if(t===name||t.startsWith(name+" ")||t.startsWith(name+"\n"))return id;return ""}
function repairParticipants(){if(!D)return 0;let n=0;for(const row of D.querySelectorAll("#participantList .participantRow")){const id=nameId(row.querySelector(".participantName")?.textContent||row.textContent),art=HERO_ART[id];if(art)n+=forceImg(row.querySelector("img.participantAvatar, img"),art)}return n}
function repairPicks(){if(!D)return 0;let n=0;for(const card of D.querySelectorAll(".charPick,[data-hero-id],[data-character-id],[data-char-id]")){let id=String(card.dataset?.heroId||card.dataset?.characterId||card.dataset?.charId||"");if(!HERO_ART[id])id=nameId(card.querySelector("span,strong,.name,.heroName")?.textContent||card.textContent);const art=HERO_ART[id];if(art)n+=forceImg(card.querySelector("img"),art)}for(const [name,id] of Object.entries(HERO_NAMES)){const art=HERO_ART[id];for(const img of D.querySelectorAll('img[alt*="'+name+'" i],img[title*="'+name+'" i]'))n+=forceImg(img,art)}return n}
function repairSheet(){if(!D)return 0;const id=String(R.current||""),art=HERO_ART[id];if(!art)return 0;let n=0;for(const img of [D.getElementById("charImage"),D.getElementById("customSheetAvatar")])n+=forceImg(img,art);return n}
function repair(){return repairDefs()+repairParticipants()+repairPicks()+repairSheet()}
function loadFinalExit(){if(!D||R.DungeonAuthoredFinalExit167875||D.querySelector('script[data-daf167875]'))return false;const s=D.createElement("script");s.src=FINAL_EXIT_SRC;s.async=false;s.dataset.daf167875="1";(D.body||D.head||D.documentElement).appendChild(s);return true}
function schedule(){if(scheduled)return;scheduled=true;const run=()=>{scheduled=false;try{repair()}catch(e){}};typeof R.requestAnimationFrame==="function"?R.requestAnimationFrame(run):setTimeout(run,0)}
function hook(name){const old=R[name];if(typeof old!=="function"||old.__gdar167874)return;const w=function(){const out=old.apply(this,arguments);repairDefs();schedule();return out};w.__gdar167874=true;w.__original=old;R[name]=w}
function observe(){if(!D||observer||typeof R.MutationObserver!=="function")return;observer=new R.MutationObserver(m=>{for(const x of m){const t=x.target;if(t?.id==="participantList"||t?.id==="sheet"||t?.closest?.("#participantList,#sheet,#pregameSetup,#menu")||x.addedNodes?.length){schedule();break}}});observer.observe(D.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]})}
function install(){repairDefs();for(const n of ["ensureDungeonHeroes","renderParticipantSelector","renderMenu","openChar"])hook(n);observe();schedule();loadFinalExit();return true}
R.GensDungeonHeroArtRepair167874={HERO_ART,FINAL_EXIT_SRC,forceImg,repairDefs,repairParticipants,repairPicks,repairSheet,repair,loadFinalExit,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
