/* GenSrpG V16.78.128 — targeted Dungeon UI cleanup without background observer.
   Built-in party-card art is repaired only from explicit Dungeon/UI render hooks. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.2.0",APP_VERSION="16.78.128";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const LEGACY_IDS=["hcRpgForce","hcRpgAgility","hcRpgIntelligence","hcRpgSpirit","hcRpgEndurance","hcRpgDefense","hcRpgArmor","hcRpgInitiative","hcRpgMovement"];
let installed=false,scheduled=false,repairingParty=false;
function same(a,b){return String(a||"").split("?")[0].split("#")[0].endsWith(String(b||""))}
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function forceImg(img,src,name){if(!img||!src)return 0;let n=0;try{const before=img.getAttribute?.("src")||img.src||"";if(!same(before,src)){img.src=src;img.setAttribute?.("src",src);n++}img.alt=name||img.alt||"";img.hidden=false;img.style.setProperty("display","block","important");img.style.setProperty("visibility","visible","important");img.style.setProperty("width","100%","important");img.style.setProperty("height","92px","important");img.style.setProperty("object-fit","cover","important")}catch(e){}return n}
function repairPartyCards(){if(!D||repairingParty)return 0;const host=D.getElementById("dc01Heroes");if(!host)return 0;repairingParty=true;let n=0;try{for(const card of host.querySelectorAll(".dc01Hero")){const id=idFromText(card.textContent),src=ART[id];if(!src)continue;const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||id;let img=card.querySelector("img");if(!img){img=D.createElement("img");img.className="gensOfficialHeroArt";card.insertBefore(img,card.firstChild||null);n++}n+=forceImg(img,src,name);const fallback=[...card.children].find(el=>el!==img&&el.tagName!=="IMG"&&/🧙/.test(el.textContent||""));if(fallback){fallback.hidden=true;fallback.style.setProperty("display","none","important")}}}finally{repairingParty=false}return n}
function hideLegacyHeroInputs(){if(!D)return 0;let n=0;for(const id of LEGACY_IDS){const input=D.getElementById(id),label=input?.closest?.("label");if(!label)continue;label.hidden=true;label.setAttribute("aria-hidden","true");label.dataset.gensLegacyHeroStat="1";label.style.setProperty("display","none","important");n++}return n}
function cleanRuleSummary(){if(!D)return 0;const host=D.getElementById("dungeonCombatFormula");if(!host)return 0;let n=0;for(const line of host.querySelectorAll(".dungeonRuleLine")){const t=String(line.textContent||"").trim();const keep=/^(⭐|🎯\s*D100|🔷|❤️)/.test(t);line.hidden=!keep;line.style.display=keep?"":"none";if(!keep)n++}return n}
function run(){repairPartyCards();hideLegacyHeroInputs();cleanRuleSummary();return true}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{run()}catch(e){}},0);setTimeout(()=>{try{repairPartyCards()}catch(e){}},100)}
function wrap(obj,name){const old=obj?.[name];if(typeof old!=="function"||old.__gduc1678100)return false;const w=function(){const out=old.apply(this,arguments);schedule();return out};w.__gduc1678100=true;w.__original=old;obj[name]=w;return true}
function hookAll(){for(const n of ["openHeroCreator","hcRenderRpgStatsUsage","renderDungeonHeroStats","renderDungeonAttributes","openChar","loadGame","loadDungeonGame","resumeDungeonGame"])wrap(R,n);const core=R.DungeonCore01;if(core){for(const n of ["render","show"])wrap(core,n)}return true}
function install(){if(installed)return true;installed=true;hookAll();schedule();let tries=0;const retry=()=>{hookAll();if(tries++<12)setTimeout(retry,120)};setTimeout(retry,60);return true}
R.GensDungeonUiCleanup1678100={VERSION,APP_VERSION,ART,LEGACY_IDS,repairPartyCards,hideLegacyHeroInputs,cleanRuleSummary,run,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
