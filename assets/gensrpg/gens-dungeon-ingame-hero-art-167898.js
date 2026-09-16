/* GenSrpG V16.78.98 — legacy Dungeon room-art compatibility helper.
   Canonical CHARS data owns hero art. This retired layer performs only a one-shot token
   repair from that data and never wraps DungeonCore or hard-pins built-in art. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const BY_NAME={aldren:"dungeon_aldren",lyra:"dungeon_lyra",brom:"dungeon_brom"};
let installed=false;
function canonicalArt(id){const c=R.CHARS?.[id]||{};for(const key of ["image","avatar","portrait","art","image_data","imageData","token","tokenImage","token_image"]){const v=String(c[key]||"").trim();if(v)return v}return ART[id]||""}
function pinDefs(){return 0}
function heroIdForToken(t){const txt=String(t?.title||t?.querySelector?.("img")?.alt||t?.textContent||"").trim().toLowerCase();for(const [name,id] of Object.entries(BY_NAME))if(txt===name||txt.startsWith(name+" "))return id;return ""}
function pinToken(t,id){const src=canonicalArt(id),img=t?.querySelector?.("img");if(!src||!img)return 0;const cur=String(img.getAttribute?.("src")||img.src||"");if(cur===String(src))return 0;img.src=src;img.setAttribute?.("src",src);img.alt=R.CHARS?.[id]?.name||id;return 1}
function repairLiveTokens(){if(!D)return 0;let n=0;for(const t of D.querySelectorAll("#dc047RoomBoard .dc310Hero,.dc310Hero")){const id=heroIdForToken(t);if(id)n+=pinToken(t,id)}return n}
function install(){if(installed)return true;installed=true;try{repairLiveTokens()}catch(e){}return true}
R.GensDungeonIngameHeroArt167898={ART,canonicalArt,pinDefs,heroIdForToken,repairLiveTokens,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
