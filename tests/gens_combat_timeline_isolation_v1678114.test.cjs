const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets/gensrpg/gens-combat-flow-1678111.js'),'utf8');

function runModern(){
  const raf=[];let renders=0,legacyRuns=0,legacyAdvance=0;
  const modal={classList:{contains:n=>n==='open'}};
  const legacyRunner=()=>legacyRuns++, legacyAdv=()=>legacyAdvance++;
  const ctx={console,Promise,setTimeout:()=>{throw new Error('modern runtime must not schedule legacy install timers')},requestAnimationFrame:fn=>{raf.push(fn)},document:{getElementById:id=>id==='attackDiceModal'?modal:null}};
  ctx.window=ctx;ctx.globalThis=ctx;ctx.__dc214RenderCombat=()=>{};ctx.__dc302RenderCombat=()=>{};
  ctx.renderDungeonCombatRound=()=>{renders++};ctx.dungeonRunAi156=legacyRunner;ctx.dungeonAdvanceTurn156=legacyAdv;
  vm.runInNewContext(src,ctx,{filename:'combat-flow'});
  assert.equal(ctx.GensCombatFlow1678111.APP_VERSION,'16.78.114');
  assert.equal(ctx.dungeonRunAi156,legacyRunner,'modern runtime must leave retired AI runner untouched');
  assert.equal(ctx.dungeonAdvanceTurn156,legacyAdv,'modern runtime must leave retired advance untouched');
  for(let i=0;i<50;i++)ctx.renderDungeonCombatRound();
  assert.equal(renders,0,'renders while result modal is open must be deferred');
  assert.equal(raf.length,1,'many hot-path renders must coalesce to one frame');
  raf.shift()();assert.equal(renders,1);
  modal.classList.contains=()=>false;ctx.renderDungeonCombatRound();assert.equal(renders,2,'closed result modal renders immediately');
  for(let i=0;i<100;i++)ctx.GensCombatFlow1678111.install();
  assert.equal(ctx.dungeonRunAi156,legacyRunner);assert.equal(ctx.dungeonAdvanceTurn156,legacyAdv);
}

function runLegacy(){
  let scheduled=[];const runner=function(){setTimeout(()=>{},250)},advance=function(){};
  const ctx={console,Promise,document:{getElementById:()=>null},setTimeout:(fn,ms)=>{scheduled.push(ms);return 1}};
  ctx.window=ctx;ctx.globalThis=ctx;ctx.renderDungeonCombatRound=()=>{};ctx.dungeonRunAi156=runner;ctx.dungeonAdvanceTurn156=advance;ctx.dungeonTurn156={active:false,aiBusy:false};ctx.dungeonCurrentTurn156=()=>null;
  vm.runInNewContext(src,ctx,{filename:'combat-flow-legacy'});
  const r1=ctx.dungeonRunAi156,a1=ctx.dungeonAdvanceTurn156;ctx.GensCombatFlow1678111.install();
  assert.equal(ctx.dungeonRunAi156,r1,'legacy runner wraps once');assert.equal(ctx.dungeonAdvanceTurn156,a1,'legacy advance wraps once');
  ctx.dungeonRunAi156();assert.ok(scheduled.includes(25),'legacy fallback may shorten the one historical 250 ms start delay');
}
runModern();runLegacy();
console.log('OK V16.78.114 combat timeline isolation/render coalescing');
