/* GenSrpG V16.78.87 — direct mobile actions for unified RPG stat editor.
   Fixes the two priority controls without changing stat/combat calculations. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const APP_VERSION="16.78.87",VERSION="1.0.0",ADV_KEY="unifiedEffects85";
let lastActionAt=0,lastActionKey="";
const canon=id=>R.GensCleanRpgStats167874?.canon?.(id)||String(id||"");
function profile(){try{return R.currentRpgProfile?.()||R.getActiveGameProfile?.()||null}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfile(p){const a=profiles(),i=a.findIndex(x=>String(x?.id)===String(p?.id));if(i<0)return false;a[i]=p;R.saveGameProfiles?.(a);return true}
function stats(){const p=profile();if(!p?.rpgUniverse)return null;const s=R.GensCleanRpgStats167874?.root?.(p)||p.rpgUniverse.stats;if(!s)return null;s.dynamicDefinitions=Array.isArray(s.dynamicDefinitions)?s.dynamicDefinitions:[];s.dynamicRules=Array.isArray(s.dynamicRules)?s.dynamicRules:[];s.active=Array.isArray(s.active)?s.active:[];s[ADV_KEY]=Array.isArray(s[ADV_KEY])?s[ADV_KEY]:[];return s}
function definitionExists(id){try{return !!R.GensCleanRpgStats167874?.def?.(id)}catch(e){return false}}
function rerender(){try{return R.GensUnifiedStats167885?.renderEditor?.()!==false}catch(e){console.warn("Stat editor rerender",e);return false}}
function addStat(){const p=profile(),s=stats();if(!p||!s)return false;let id="nouvelle_stat",n=2;while(definitionExists(id)||s.dynamicDefinitions.some(d=>canon(d?.id)===canon(id)))id="nouvelle_stat_"+n++;s.dynamicDefinitions.push({id,name:"Nouvelle stat",icon:"📊",defaultValue:0,min:0,max:999,visible:true,description:""});if(!s.active.some(x=>canon(x)===canon(id)))s.active.push(id);if(!saveProfile(p))return false;rerender();try{R.showToast?.("📊 Nouvelle stat ajoutée")}catch(e){}return true}
function addEffect(statId){const p=profile(),s=stats(),source=canon(statId);if(!p||!s||!source)return false;const id="u87_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6);s[ADV_KEY].push({id,source,target:"damage:melee",mode:"step",step:1,gain:1,threshold:10,comparator:"gt",enabled:true});if(!saveProfile(p))return false;rerender();try{R.showToast?.("🔗 Effet ajouté")}catch(e){}return true}
function dedupe(key){const now=Date.now();if(lastActionKey===key&&now-lastActionAt<450)return true;lastActionKey=key;lastActionAt=now;return false}
function act(target,event){if(!target?.closest)return false;const n=target.closest("[data-u85-newstat]");const a=target.closest("[data-u85-add]");if(!n&&!a)return false;const key=n?"new":"add:"+String(a?.dataset?.u85Add||"");if(dedupe(key))return true;try{event?.preventDefault?.();event?.stopPropagation?.();event?.stopImmediatePropagation?.()}catch(e){}return n?addStat():addEffect(a.dataset.u85Add)}
function wireButton(btn,key,handler){if(!btn||btn.dataset[key])return;btn.dataset[key]="1";const run=e=>{if(dedupe(key+":"+(btn.dataset.u85Add||"")))return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.()}catch(_){ }handler()};btn.addEventListener("pointerup",run,true);btn.addEventListener("click",run,true);btn.addEventListener("touchend",run,{capture:true,passive:false})}
function wire(){if(!D)return false;const host=D.getElementById("rpgStatsList");if(!host)return false;wireButton(host.querySelector("[data-u85-newstat]"),"u87direct",addStat);host.querySelectorAll("[data-u85-add]").forEach(btn=>wireButton(btn,"u87direct",()=>addEffect(btn.dataset.u85Add)));return true}
function install(){if(!D)return false;R.GENSRPG_VERSION=APP_VERSION;if(!D.__gsu167887Capture){D.__gsu167887Capture=true;const capture=e=>act(e.target,e);D.addEventListener("pointerup",capture,true);D.addEventListener("click",capture,true);D.addEventListener("touchend",capture,{capture:true,passive:false})}wire();if(typeof MutationObserver==="function"&&!D.__gsu167887Observer){D.__gsu167887Observer=new MutationObserver(()=>wire());D.__gsu167887Observer.observe(D.documentElement,{childList:true,subtree:true})}return true}
R.GensStatsActionsDirect167887={APP_VERSION,VERSION,stats,addStat,addEffect,wire,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install();for(const ms of [50,250,1000])setTimeout(install,ms)}
})();
