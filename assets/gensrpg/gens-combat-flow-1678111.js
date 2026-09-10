/* GenSrpG V16.78.114 — isolated Dungeon combat flow stability.
   Runtime 2.x/Core 3.03 owns the combat timeline. Do not wrap the retired
   dungeonTurn156/dungeonRunAi156 chain when that runtime is present.
   While the player result modal is open, coalesce expensive full combat renders
   to one animation-frame so the wound/result text can paint first. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="3.0.0",APP_VERSION="16.78.114",AI_START_MS=25,LEGACY_AI_START_MS=250;
let renderQueued=false,queuedRender=null;
function modernRuntime(){return typeof R.__dc302RenderCombat==="function"||typeof R.__dc214RenderCombat==="function"&&R.renderDungeonCombatRound!==R.__dc214RenderCombat}
function attackResultOpen(){try{return !!D?.getElementById?.("attackDiceModal")?.classList?.contains?.("open")}catch(e){return false}}
function scheduleRender(fn,ctx,args){queuedRender={fn,ctx,args};if(renderQueued)return false;renderQueued=true;const flush=()=>{renderQueued=false;const q=queuedRender;queuedRender=null;if(q?.fn)q.fn.apply(q.ctx,q.args)};if(typeof R.requestAnimationFrame==="function")R.requestAnimationFrame(flush);else R.setTimeout(flush,0);return true}
function wrapRender(){const old=R.renderDungeonCombatRound;if(typeof old!=="function"||old.__gcf114Render)return false;const wrapped=function(){if(attackResultOpen()){scheduleRender(old,this,arguments);return}return old.apply(this,arguments)};wrapped.__gcf114Render=true;wrapped.__original=old;R.renderDungeonCombatRound=wrapped;return true}
function wrapLegacyRunner(){if(modernRuntime())return false;const old=R.dungeonRunAi156;if(typeof old!=="function"||old.__gcf114Runner)return false;const wrapped=function(){const realTimeout=R.setTimeout;if(typeof realTimeout!=="function")return old.apply(this,arguments);R.setTimeout=function(fn,delay){const args=[...arguments];if(Number(delay)===LEGACY_AI_START_MS)args[1]=AI_START_MS;return realTimeout.apply(this,args)};try{return old.apply(this,arguments)}finally{R.setTimeout=realTimeout}};wrapped.__gcf114Runner=true;wrapped.__original=old;R.dungeonRunAi156=wrapped;return true}
function wrapLegacyAdvance(){if(modernRuntime())return false;const old=R.dungeonAdvanceTurn156;if(typeof old!=="function"||old.__gcf114Advance)return false;const wrapped=function(){const out=old.apply(this,arguments);const turn=R.dungeonTurn156,actor=typeof R.dungeonCurrentTurn156==="function"?R.dungeonCurrentTurn156():null;if(turn?.active&&!turn.aiBusy&&actor?.kind==="enemy"&&!(typeof R.dungeonShouldMjControl156==="function"&&R.dungeonShouldMjControl156(actor)))Promise.resolve().then(()=>{try{R.dungeonRunAi156?.(actor)}catch(e){}});return out};wrapped.__gcf114Advance=true;wrapped.__original=old;R.dungeonAdvanceTurn156=wrapped;return true}
function install(){wrapRender();if(!modernRuntime()){wrapLegacyRunner();wrapLegacyAdvance()}return true}
R.GensCombatFlow1678111={VERSION,APP_VERSION,AI_START_MS,LEGACY_AI_START_MS,modernRuntime,attackResultOpen,scheduleRender,wrapRender,install};
install();
})();
