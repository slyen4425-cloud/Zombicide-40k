/* GenSrpG V16.78.98 — built-in hero art scoped to Dungeon boards only.
   Character-sheet portraits are owned by the native index.html renderer. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-board-art-only";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const FIELDS=["image","avatar","portrait","art","image_data","imageData","token","tokenImage","token_image"];
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function idFromNode(n){if(!n)return "";const d=n.dataset||{},raw=d.heroId||d.characterId||d.charId||d.unitId||d.actorId||"";if(ART[raw])return raw;return idFromText([n.title,n.getAttribute?.("aria-label"),n.textContent].filter(Boolean).join(" "))}
function repairDefs(){let count=0;for(const [id,src] of Object.entries(ART)){const c=R.CHARS?.[id];if(!c)continue;for(const key of FIELDS)if(c[key]!==src){c[key]=src;count++}}return count}
function forceImg(img,src,name){if(!img||!src)return 0;let n=0;try{if(img.getAttribute("src")!==src){img.setAttribute("src",src);img.src=src;n++}img.alt=name||img.alt||"";img.style.display="";img.hidden=false}catch(e){}return n}
function ensureTokenArt(node,id){const src=ART[id];if(!node||!src)return 0;const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||id;let n=0;if(node.tagName==="IMG")return forceImg(node,src,name);let img=node.querySelector?.("img");if(!img&&D){img=D.createElement("img");img.setAttribute("data-gens-hero-art-167898","1");node.insertBefore(img,node.firstChild||null);n++}if(img)n+=forceImg(img,src,name);try{node.style.removeProperty("background-image")}catch(e){}for(const fb of node.querySelectorAll?.(".dc310Fallback,[data-hero-fallback],.heroFallback")||[])fb.style.display="none";return n}
function repairBoard(){if(!D)return 0;repairDefs();let n=0;const roots=[...D.querySelectorAll("#dc047RoomBoard,#dungeonMap,#dungeonBoard,.dungeonMap,.dungeonBoard")];for(const root of roots){for(const node of root.querySelectorAll?.(".dc310Hero,[data-dungeon-hero-token],[data-unit-id],[data-actor-id]")||[]){const id=idFromNode(node);if(ART[id])n+=ensureTokenArt(node,id)}}return n}
function wrap(obj,name){const old=obj?.[name];if(typeof old!=="function"||old.__ghi167898)return false;const w=function(){repairDefs();const out=old.apply(this,arguments);repairBoard();return out};w.__ghi167898=true;w.__original=old;obj[name]=w;return true}
function hooks(){for(const name of ["renderDungeonMap","renderDungeonRoom","renderDungeon"])wrap(R,name);const core=R.DungeonCore01;if(core){wrap(core,"render");wrap(core,"show")}return true}
function install(){repairDefs();hooks();repairBoard();return true}
R.GensDungeonHeroIngameArt167898={VERSION,APP_VERSION,ART,FIELDS,idFromNode,repairDefs,ensureTokenArt,repairBoard,hooks,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
