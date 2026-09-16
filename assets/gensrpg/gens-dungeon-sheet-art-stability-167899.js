/* GenSrpG V16.78.99 — Dungeon hero art compatibility helper for the in-game character sheet.
   The canonical hero data/render path owns the selected art. This module only repairs a
   visible sheet from that canonical value when explicitly asked; no delayed authority. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-hero-art-authority";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const ROOT_SELECTOR="#sheet,#charSheet,#characterSheet,#dungeonHeroSheet,#dungeonSheet,#customSheet,[data-hero-sheet],[data-character-sheet],.heroSheet,.characterSheet,.dungeonHeroSheet,.dungeonSheet";
const IMAGE_SELECTOR="#charImage,#customSheetAvatar,#heroImage,#heroAvatar,#heroPortrait,#characterImage,#characterAvatar,#characterPortrait,#dungeonHeroImage,#dungeonHeroAvatar,#dungeonHeroPortrait,img[data-hero-art],img[data-hero-portrait],img[data-character-avatar],.heroPortrait img,.heroAvatar img,.characterPortrait img,.characterAvatar img";
let installed=false;
function currentId(){const cur=String(R.current||"");if(ART[cur]||R.CHARS?.[cur])return cur;return ""}
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function canonicalArt(id){const c=R.CHARS?.[id]||{};for(const key of ["image","avatar","portrait","art","image_data","imageData","token","tokenImage","token_image"]){const v=String(c[key]||"").trim();if(v)return v}return ART[id]||""}
function setImg(img,src,name){if(!img||!src)return 0;let n=0;try{const before=img.getAttribute?.("src")||img.src||"";if(String(before)!==String(src)){img.src=src;img.setAttribute?.("src",src);n++}img.alt=name||img.alt||"";img.hidden=false;img.style.display="";img.style.visibility="visible";img.removeAttribute?.("aria-hidden")}catch(e){}return n}
function candidateImages(root,id){const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||"";const out=new Set();for(const el of root.querySelectorAll?.(IMAGE_SELECTOR)||[])out.add(el);for(const img of root.querySelectorAll?.("img")||[]){const meta=[img.id,img.className,img.alt,img.title,img.getAttribute?.("data-role"),img.getAttribute?.("data-type")].filter(Boolean).join(" ");if(/hero|character|portrait|avatar|sheet/i.test(meta)||(name&&new RegExp(name,"i").test(meta)))out.add(img)}return [...out]}
function repairSheet(){if(!D)return 0;let total=0;const roots=[...D.querySelectorAll(ROOT_SELECTOR)];if(!roots.length)return 0;for(const root of roots){let id=currentId();if(!id)id=idFromText([root.getAttribute?.("data-hero-id"),root.getAttribute?.("data-character-id"),root.getAttribute?.("aria-label"),root.textContent].filter(Boolean).join(" "));const src=canonicalArt(id);if(!src)continue;const name=R.CHARS?.[id]?.name||Object.keys(NAMES).find(k=>NAMES[k]===id)||id;for(const img of candidateImages(root,id))total+=setImg(img,src,name)}return total}
function install(){if(installed)return true;installed=true;try{repairSheet()}catch(e){}return true}
R.GensDungeonSheetArtStability167899={VERSION,APP_VERSION,ART,ROOT_SELECTOR,IMAGE_SELECTOR,currentId,idFromText,canonicalArt,repairSheet,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
