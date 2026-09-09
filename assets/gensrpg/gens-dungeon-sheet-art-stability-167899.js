/* GenSrpG V16.78.99 — built-in Dungeon hero art on the in-game character sheet.
   Explicit lifecycle hooks only: no global DOM observer. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.99";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const ROOT_SELECTOR="#sheet,#charSheet,#characterSheet,#dungeonHeroSheet,#dungeonSheet,#customSheet,[data-hero-sheet],[data-character-sheet],.heroSheet,.characterSheet,.dungeonHeroSheet,.dungeonSheet";
const IMAGE_SELECTOR="#charImage,#customSheetAvatar,#heroImage,#heroAvatar,#heroPortrait,#characterImage,#characterAvatar,#characterPortrait,#dungeonHeroImage,#dungeonHeroAvatar,#dungeonHeroPortrait,img[data-hero-art],img[data-hero-portrait],img[data-character-avatar],.heroPortrait img,.heroAvatar img,.characterPortrait img,.characterAvatar img";
let scheduled=false,installed=false;
function currentId(){const cur=String(R.current||"");if(ART[cur])return cur;return ""}
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function setImg(img,src,name){if(!img||!src)return 0;let n=0;try{const before=img.getAttribute?.("src")||img.src||"";if(!String(before).split("?")[0].endsWith(src)){img.src=src;img.setAttribute?.("src",src);n++}img.alt=name||img.alt||"";img.hidden=false;img.style.display="";img.style.visibility="visible";img.removeAttribute?.("aria-hidden")}catch(e){}return n}
function candidateImages(root,id){const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||"";const out=new Set();for(const el of root.querySelectorAll?.(IMAGE_SELECTOR)||[])out.add(el);for(const img of root.querySelectorAll?.("img")||[]){const meta=[img.id,img.className,img.alt,img.title,img.getAttribute?.("data-role"),img.getAttribute?.("data-type")].filter(Boolean).join(" ");if(/hero|character|portrait|avatar|sheet/i.test(meta)||(name&&new RegExp(name,"i").test(meta)))out.add(img)}return [...out]}
function repairSheet(){if(!D)return 0;let total=0;const roots=[...D.querySelectorAll(ROOT_SELECTOR)];if(!roots.length)return 0;for(const root of roots){let id=currentId();if(!id)id=idFromText([root.getAttribute?.("data-hero-id"),root.getAttribute?.("data-character-id"),root.getAttribute?.("aria-label"),root.textContent].filter(Boolean).join(" "));if(!ART[id])continue;const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||id;for(const img of candidateImages(root,id))total+=setImg(img,ART[id],name)}return total}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{repairSheet()}catch(e){}},0);setTimeout(()=>{try{repairSheet()}catch(e){}},80)}
function wrap(name){const old=R[name];if(typeof old!=="function"||old.__gdss167899)return false;const w=function(){const out=old.apply(this,arguments);schedule();return out};w.__gdss167899=true;w.__original=old;R[name]=w;return true}
function hookAll(){for(const n of ["openChar","openCharacter","openHeroSheet","showHeroSheet","renderCharacterSheet","renderDungeonHeroSheet","renderDungeonHeroStats","renderDungeonAttributes"])wrap(n);return true}
function install(){if(installed)return true;installed=true;hookAll();schedule();let tries=0;const retry=()=>{hookAll();if(tries++<30)setTimeout(retry,100)};setTimeout(retry,50);return true}
R.GensDungeonSheetArtStability167899={VERSION,APP_VERSION,ART,ROOT_SELECTOR,IMAGE_SELECTOR,currentId,idFromText,repairSheet,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
