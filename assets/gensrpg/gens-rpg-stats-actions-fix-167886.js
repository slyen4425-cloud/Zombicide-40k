/* GenSrpG V16.78.86 — robust mobile actions for unified RPG stat editor. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const D=typeof document!=="undefined"?document:null;
const APP_VERSION="16.78.86",VERSION="1.0.0",ADV_KEY="unifiedEffects85";
function base(){return R.GensCleanRpgStats167874||null}
function unified(){return R.GensUnifiedStats167885||null}
function profile(){try{return R.currentRpgProfile?.()||R.getActiveGameProfile?.()||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfile(p){try{const a=profiles(),i=a.findIndex(x=>String(x?.id||"")===String(p?.id||""));if(i<0)return false;a[i]=p;R.saveGameProfiles?.(a);return true}catch(e){return false}}
function stats(){const p=profile();if(!p?.rpgUniverse)return null;return base()?.root?.(p)||p.rpgUniverse.stats||null}
function redraw(){try{unified()?.renderEditor?.()}catch(e){console.warn("GenSrpG stat actions redraw failed",e)}}
function addStat(){const p=profile(),s=stats(),b=base();if(!p||!s||!b)return false;s.dynamicDefinitions=Array.isArray(s.dynamicDefinitions)?s.dynamicDefinitions:[];s.active=Array.isArray(s.active)?s.active:[];let id="nouvelle_stat",n=2;while(b.def?.(id)||s.dynamicDefinitions.some(x=>String(x?.id||"")===id))id="nouvelle_stat_"+n++;s.dynamicDefinitions.push({id,name:"Nouvelle stat",icon:"📊",defaultValue:0,min:0,max:999,visible:true,description:""});if(!s.active.includes(id))s.active.push(id);const ok=saveProfile(p);redraw();return ok}
function addEffect(source){source=base()?.canon?.(source)||String(source||"");const p=profile(),s=stats();if(!p||!s||!source)return false;s[ADV_KEY]=Array.isArray(s[ADV_KEY])?s[ADV_KEY]:[];s[ADV_KEY].push({id:"u86_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),source,target:"damage:melee",mode:"step",step:1,gain:1,threshold:10,comparator:"gt",enabled:true});const ok=saveProfile(p);redraw();return ok}
function captureClick(e){const t=e?.target?.closest?.("[data-u85-newstat],[data-u85-add]");if(!t)return;if(t.matches?.("[data-u85-newstat]")){e.preventDefault?.();e.stopImmediatePropagation?.();addStat();return}if(t.matches?.("[data-u85-add]")){e.preventDefault?.();e.stopImmediatePropagation?.();addEffect(t.dataset?.u85Add||"")}}
function install(){if(!D||D.__gsActions167886)return !!D;D.__gsActions167886=true;D.addEventListener?.("click",captureClick,true);try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true}
R.GensRpgStatActions167886={VERSION,APP_VERSION,addStat,addEffect,captureClick,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
