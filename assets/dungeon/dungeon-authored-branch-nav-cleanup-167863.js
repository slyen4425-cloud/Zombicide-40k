/* GenSrpG Dungeon — authored branch navigation cleanup 16.78.64.
   World Builder authored navigation owns room returns.
   - always hides/blocks the legacy numeric dc317BackRoom in authored worlds
   - while inside a secondary cache branch, keeps only the dedicated return button
   - restores legacy controls automatically outside authored context
   No movement, combat, content or grid changes. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.1.0",APP_VERSION="16.78.64";
let installed=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function currentNode(x,hero){const s=x?.authored167839||{},roomKey=String(Number(x?.room)||0);return String(s?.roomNodes?.[roomKey]||s?.heroNodes?.[hero]||x?.last?.worldNodeId||"")}
function authoredActive(){const x=readRt();return !!x?.last?.authoredRuntime167839}
function branchReturnActive(){const x=readRt();if(!x?.last?.authoredRuntime167839)return false;const hero=activeHero(x);if(!hero)return false;const stack=x?.authored167847ReturnStacks?.[hero];if(!Array.isArray(stack)||!stack.length)return false;const top=stack[stack.length-1];return !!top&&String(top.targetNodeId||"")===currentNode(x,hero)}
function norm(v){return String(v||"").replace(/\s+/g," ").trim().toUpperCase()}
function candidates(){if(!DOC)return[];return Array.from(DOC.querySelectorAll?.("button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn")||[])}
function isLegacyBranchNav(el){if(!el||el.id==="dwr167846Return"||el.id==="dwr167846Cache")return false;const t=norm(el.textContent||el.value);if(t.includes("SORTIE NON RELIÉE"))return true;if(/^↩?️?\s*(RETOUR\s+)?SALLE\s*\d+\b/.test(t))return true;return false}
function hide(el){if(el.dataset.abn167863Hidden!=="1"){el.dataset.abn167863Hidden="1";el.dataset.abn167863Display=el.style?.display||""}try{el.hidden=true;el.setAttribute?.("aria-hidden","true");el.style?.setProperty?.("display","none","important")}catch(e){}}
function restore(el){if(el.dataset.abn167863Hidden!=="1")return;try{el.hidden=false;el.removeAttribute?.("aria-hidden");el.style?.removeProperty?.("display");if(el.dataset.abn167863Display&&el.style)el.style.display=el.dataset.abn167863Display}catch(e){}delete el.dataset.abn167863Hidden;delete el.dataset.abn167863Display}
function sync(){const authored=authoredActive(),branch=branchReturnActive();for(const el of candidates()){if(el.id==="dc317BackRoom"){if(authored)hide(el);else restore(el);continue}if(isLegacyBranchNav(el)){if(branch)hide(el);else restore(el)}}const explore=DOC?.getElementById?.("dc01Explore");if(explore){if(branch)hide(explore);else restore(explore)}return {authored,branch}}
function block(e){const el=e?.target?.closest?.("button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn");if(!el)return;if(el.id==="dc317BackRoom"&&authoredActive()){e.preventDefault?.();e.stopImmediatePropagation?.();sync();return}if(!branchReturnActive()||el.id==="dwr167846Return")return;if(el.id==="dc01Explore"||isLegacyBranchNav(el)){e.preventDefault?.();e.stopImmediatePropagation?.();sync()}}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__abn167863)continue;const w=function(){const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__abn167863=true;w.__original=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("click",block,true);installed=true}for(const ms of [0,50,250])setTimeout(()=>{wrapCore();sync()},ms);return true}
ROOT.DungeonAuthoredBranchNavCleanup167863={VERSION,APP_VERSION,readRt,activeHero,currentNode,authoredActive,branchReturnActive,isLegacyBranchNav,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
