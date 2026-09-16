/* GenSrpG V16.78.98 — Dungeon board hero-art compatibility helper.
   Canonical CHARS data owns hero art. This helper only repairs visible board tokens from
   that data and uses built-in PNGs as fallback when a hero has no configured art. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-hero-art-authority";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
let installed=false;
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function idFromNode(n){if(!n)return "";const d=n.dataset||{},raw=d.heroId||d.characterId||d.charId||d.unitId||d.actorId||d.participantId||"";if(ART[raw]||R.CHARS?.[raw])return raw;return idFromText([n.title,n.getAttribute?.("aria-label"),n.textContent].filter(Boolean).join(" "))}
function canonicalArt(id){const c=R.CHARS?.[id]||{};for(const key of ["image","avatar","portrait","art","image_data","imageData","token","tokenImage","token_image"]){const v=String(c[key]||"").trim();if(v)return v}return ART[id]||""}
function repairDefs(){return 0}
function forceImg(img,src,name){if(!img||!src)return 0;let n=0;try{if(String(img.getAttribute?.("src")||img.src||"")!==String(src)){img.setAttribute?.("src",src);img.src=src;n++}img.alt=name||img.alt||"";img.style.display="";img.hidden=false}catch(e){}return n}
function ensureTokenArt(node,id){const src=canonicalArt(id);if(!node||!src)return 0;const name=R.CHARS?.[id]?.name||Object.keys(NAMES).find(k=>NAMES[k]===id)||id;let n=0;if(node.tagName==="IMG")return forceImg(node,src,name);let img=node.querySelector?.("img");if(!img&&D){img=D.createElement("img");img.setAttribute("data-gens-hero-art-167898","1");node.insertBefore(img,node.firstChild||null);n++}if(img)n+=forceImg(img,src,name);try{node.style.removeProperty("background-image")}catch(e){}for(const fb of node.querySelectorAll?.(".dc310Fallback,[data-hero-fallback],.heroFallback")||[])fb.style.display="none";return n}
function repairBoard(){if(!D)return 0;let n=0;const direct=[...D.querySelectorAll('.dc310Hero,[data-hero-id],[data-character-id],[data-char-id],[data-unit-id],[data-actor-id],[data-participant-id]')];for(const node of direct){const id=idFromNode(node);if(id)n+=ensureTokenArt(node,id)}for(const [name,id] of Object.entries(NAMES)){const src=canonicalArt(id);if(!src)continue;for(const img of D.querySelectorAll('img[alt*="'+name+'" i],img[title*="'+name+'" i]'))n+=forceImg(img,src,R.CHARS?.[id]?.name||name);for(const node of D.querySelectorAll('[title*="'+name+'" i],[aria-label*="'+name+'" i]')){const cls=String(node.className||"").toLowerCase();if(/hero|token|pawn|actor|marker|participant|dc310/.test(cls))n+=ensureTokenArt(node,id)}}return n}
function install(){if(installed)return true;installed=true;try{repairBoard()}catch(e){}return true}
R.GensDungeonHeroIngameArt167898={VERSION,APP_VERSION,ART,idFromNode,canonicalArt,repairDefs,ensureTokenArt,repairBoard,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
