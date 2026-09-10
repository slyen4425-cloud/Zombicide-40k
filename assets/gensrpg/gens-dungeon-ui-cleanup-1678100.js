/* GenSrpG V16.78.113 — targeted Dungeon UI cleanup without combat-hot hooks.
   Party-card art repair stays host-scoped; combat stat renderers never schedule UI scans. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.2.0",APP_VERSION="16.78.113";
const ART={dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",dungeon_brom:"assets/dungeon/creatures/dng_brom.png"};
const NAMES={Aldren:"dungeon_aldren",Lyra:"dungeon_lyra",Brom:"dungeon_brom"};
const LEGACY_IDS=["hcRpgForce","hcRpgAgility","hcRpgIntelligence","hcRpgSpirit","hcRpgEndurance","hcRpgDefense","hcRpgArmor","hcRpgInitiative","hcRpgMovement"];
let installed=false,scheduled=false,partyObserver=null,partyHost=null,repairingParty=false;
function same(a,b){return String(a||"").split("?")[0].split("#")[0].endsWith(String(b||""))}
function idFromText(v){const s=String(v||"");for(const [name,id] of Object.entries(NAMES))if(new RegExp("\\b"+name+"\\b","i").test(s))return id;return ""}
function forceImg(img,src,name){if(!img||!src)return 0;let n=0;try{const before=img.getAttribute?.("src")||img.src||"";if(!same(before,src)){img.src=src;img.setAttribute?.("src",src);n++}if(img.alt!==(name||img.alt||""))img.alt=name||img.alt||"";if(img.hidden)img.hidden=false;const want={display:"block",visibility:"visible",width:"100%",height:"92px","object-fit":"cover"};for(const [k,v] of Object.entries(want))if(img.style?.getPropertyValue?.(k)!==v)img.style?.setProperty?.(k,v,"important")}catch(e){}return n}
function repairPartyCards(){if(!D||repairingParty)return 0;const host=D.getElementById("dc01Heroes");if(!host)return 0;repairingParty=true;let n=0;try{for(const card of host.querySelectorAll(".dc01Hero")){const id=idFromText(card.textContent),src=ART[id];if(!src)continue;const name=Object.keys(NAMES).find(k=>NAMES[k]===id)||id;let img=card.querySelector("img");if(!img){img=D.createElement("img");img.className="gensOfficialHeroArt";card.insertBefore(img,card.firstChild||null);n++}n+=forceImg(img,src,name);const fallback=[...card.children].find(el=>el!==img&&el.tagName!=="IMG"&&/🧙/.test(el.textContent||""));if(fallback&&!fallback.hidden){fallback.hidden=true;fallback.style?.setProperty?.("display","none","important")}}}finally{repairingParty=false}return n}
function observePartyHost(){if(!D||typeof MutationObserver!=="function")return false;const host=D.getElementById("dc01Heroes");if(!host)return false;if(partyHost===host&&partyObserver)return true;try{partyObserver?.disconnect?.()}catch(e){}partyHost=host;partyObserver=new MutationObserver(()=>{if(!repairingParty)repairPartyCards()});partyObserver.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});repairPartyCards();return true}
function hideLegacyHeroInputs(){if(!D)return 0;let n=0;for(const id of LEGACY_IDS){const input=D.getElementById(id),label=input?.closest?.("label");if(!label)continue;if(!label.hidden){label.hidden=true;label.setAttribute("aria-hidden","true");label.dataset.gensLegacyHeroStat="1";label.style.setProperty("display","none","important");n++}}return n}
function cleanRuleSummary(){if(!D)return 0;const host=D.getElementById("dungeonCombatFormula");if(!host)return 0;let n=0;for(const line of host.querySelectorAll(".dungeonRuleLine")){const t=String(line.textContent||"").trim(),keep=/^(⭐|🎯\s*D100|🔷|❤️)/.test(t),shouldHide=!keep;if(line.hidden!==shouldHide){line.hidden=shouldHide;line.style.display=keep?"":"none";n++}}return n}
function run(){observePartyHost();repairPartyCards();hideLegacyHeroInputs();cleanRuleSummary();return true}
function schedule(){if(scheduled)return;scheduled=true;const fn=()=>{scheduled=false;try{run()}catch(e){}};typeof R.requestAnimationFrame==="function"?R.requestAnimationFrame(fn):setTimeout(fn,0)}
function wrap(obj,name){const old=obj?.[name];if(typeof old!=="function"||old.__gduc1678100)return false;const w=function(){const out=old.apply(this,arguments);schedule();return out};w.__gduc1678100=true;w.__original=old;obj[name]=w;return true}
function hookAll(){for(const n of ["openHeroCreator","hcRenderRpgStatsUsage","openChar","loadGame","loadDungeonGame","resumeDungeonGame"])wrap(R,n);const core=R.DungeonCore01;if(core)for(const n of ["render","show"])wrap(core,n);return true}
function install(){if(installed)return true;installed=true;observePartyHost();hookAll();schedule();setTimeout(hookAll,250);setTimeout(()=>{hookAll();observePartyHost()},1200);return true}
R.GensDungeonUiCleanup1678100={VERSION,APP_VERSION,ART,LEGACY_IDS,repairPartyCards,observePartyHost,hideLegacyHeroInputs,cleanRuleSummary,run,hookAll,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
