/* GenSrpG V16.78.98 — hard-pin built-in Dungeon hero art at the actual room render boundary. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const BY_NAME={aldren:"dungeon_aldren",lyra:"dungeon_lyra",brom:"dungeon_brom"};
let retries=0;
function same(a,b){return String(a||"").split("?")[0].split("#")[0].endsWith(String(b||""))}
function pinDefs(){let n=0;for(const [id,src] of Object.entries(ART)){const c=R.CHARS?.[id];if(!c)continue;if(c.image!==src){c.image=src;n++}if(c.avatar!==src){c.avatar=src;n++}}return n}
function heroIdForToken(t){const txt=String(t?.title||t?.querySelector?.("img")?.alt||t?.textContent||"").trim().toLowerCase();for(const [name,id] of Object.entries(BY_NAME))if(txt===name||txt.startsWith(name+" "))return id;return ""}
function pinToken(t,id){const src=ART[id],img=t?.querySelector?.("img");if(!src||!img)return 0;const cur=img.getAttribute?.("src")||img.src||"";if(same(cur,src))return 0;img.src=src;img.setAttribute?.("src",src);img.alt=R.CHARS?.[id]?.name||id;return 1}
function repairLiveTokens(){if(!D)return 0;let n=0;for(const t of D.querySelectorAll("#dc047RoomBoard .dc310Hero,.dc310Hero")){const id=heroIdForToken(t);if(id)n+=pinToken(t,id)}return n}
function wrapCore(){const core=R.DungeonCore01;if(!core)return false;let found=false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"){continue}found=true;if(old.__gih167898)continue;const w=function(){pinDefs();const out=old.apply(this,arguments);repairLiveTokens();return out};w.__gih167898=true;w.__original=old;core[name]=w}return found}
function install(){pinDefs();const ok=wrapCore();repairLiveTokens();if(!ok&&retries++<60&&typeof setTimeout==="function")setTimeout(install,100);return ok}
R.GensDungeonIngameHeroArt167898={ART,pinDefs,heroIdForToken,repairLiveTokens,wrapCore,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
