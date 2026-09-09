/* GenSrpG V16.78.98 — hard guarantee for built-in hero art inside Dungeon boards.
   Repairs the data sources AND the actual hero token DOM, not only the selection screen. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.98";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const FIELDS=["image","avatar","portrait","art","image_data","imageData","token","tokenImage","token_image"];
let observer=null,scheduled=false;
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function idFromNode(n){if(!n)return "";const d=n.dataset||{},raw=d.heroId||d.characterId||d.charId||d.unitId||d.actorId||d.participantId||"";if(ART[raw])return raw;return idFromText([n.title,n.getAttribute?.("aria-label"),n.textContent].filter(Boolean).join(" "))}
function repairDefs(){let count=0;for(const [id,src] of Object.entries(ART)){const c=R.CHARS?.[id];if(!c)continue;for(const key of FIELDS)if(c[key]!==src){c[key]=src;count++}}return count}
function forceImg(img,src,name){if(!img||!src)return 0;let n=0;try{if(img.getAttribute("src")!==src){img.setAttribute("src",src);img.src=src;n++}img.alt=name||img.alt||"";img.style.display="";img.hidden=false}catch(e){}return n}
function ensureTokenArt(node,id){const src=ART[id];if(!node||!src)return 0;const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||id;let n=0;if(node.tagName==="IMG")return forceImg(node,src,name);let img=node.querySelector?.("img");if(!img&&D){img=D.createElement("img");img.setAttribute("data-gens-hero-art-167898","1");node.insertBefore(img,node.firstChild||null);n++}if(img)n+=forceImg(img,src,name);try{node.style.removeProperty("background-image")}catch(e){}for(const fb of node.querySelectorAll?.(".dc310Fallback,[data-hero-fallback],.heroFallback")||[])fb.style.display="none";return n}
function repairBoard(){if(!D)return 0;repairDefs();let n=0;const direct=[...D.querySelectorAll('.dc310Hero,[data-hero-id],[data-character-id],[data-char-id],[data-unit-id],[data-actor-id],[data-participant-id]')];for(const node of direct){const id=idFromNode(node);if(ART[id])n+=ensureTokenArt(node,id)}for(const [name,id] of Object.entries(NAMES)){for(const img of D.querySelectorAll('img[alt*="'+name+'" i],img[title*="'+name+'" i]'))n+=forceImg(img,ART[id],name);for(const node of D.querySelectorAll('[title*="'+name+'" i],[aria-label*="'+name+'" i]')){const cls=String(node.className||"").toLowerCase();if(/hero|token|pawn|actor|marker|participant|dc310/.test(cls))n+=ensureTokenArt(node,id)}}return n}
function schedule(){if(scheduled)return;scheduled=true;const run=()=>{scheduled=false;try{repairBoard()}catch(e){}};typeof R.requestAnimationFrame==="function"?R.requestAnimationFrame(run):setTimeout(run,0)}
function wrap(obj,name){const old=obj?.[name];if(typeof old!=="function"||old.__ghi167898)return false;const w=function(){repairDefs();const out=old.apply(this,arguments);schedule();return out};w.__ghi167898=true;w.__original=old;obj[name]=w;return true}
function hooks(){for(const name of ["renderDungeonMap","renderDungeonRoom","renderDungeon","render","show","openChar"]){wrap(R,name)}const core=R.DungeonCore01;if(core){wrap(core,"render");wrap(core,"show")}return true}
function observe(){if(!D||observer||typeof R.MutationObserver!=="function")return false;observer=new R.MutationObserver(m=>{for(const x of m){const t=x.target;if(t?.closest?.("#dc047RoomBoard,#dungeonMap,#dungeonBoard,.dungeonMap,.dungeonBoard")||[...x.addedNodes||[]].some(n=>n?.querySelector?.('.dc310Hero,[data-hero-id],[data-character-id],[data-char-id]'))){schedule();break}}});observer.observe(D.body||D.documentElement,{childList:true,subtree:true});return true}
function install(){repairDefs();hooks();schedule();observe();let tries=0;const retry=()=>{hooks();repairDefs();schedule();if(tries++<20)setTimeout(retry,100)};setTimeout(retry,50);return true}
R.GensDungeonHeroIngameArt167898={VERSION,APP_VERSION,ART,FIELDS,idFromNode,repairDefs,ensureTokenArt,repairBoard,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
