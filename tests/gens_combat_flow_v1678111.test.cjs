const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-combat-flow-1678111.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.112"/);
assert.match(src,/AI_START_MS=25/);
assert.match(src,/LEGACY_AI_START_MS=250/);
assert.match(src,/queueMicrotask/,'enemy handoff must be queued immediately after turn advance');
assert.match(bridge,/gens-combat-flow-1678111\.js\?v=1678112/);

const scheduled=[];
function realTimeout(fn,delay){scheduled.push(Number(delay)||0);return scheduled.length}
const context={console,setTimeout:realTimeout,clearTimeout(){},Promise,queueMicrotask:fn=>fn(),window:null,called:0,dungeonTurn156:{active:true,aiBusy:false},actor:{kind:'hero',id:'h1'}};context.window=context;
vm.createContext(context);
vm.runInContext("dungeonCurrentTurn156=function(){return actor};dungeonShouldMjControl156=function(){return false};dungeonRunAi156=function(){called++;dungeonTurn156.aiBusy=true;setTimeout(function(){},250);setTimeout(function(){},450);return 'ok'};dungeonAdvanceTurn156=function(){actor={kind:'enemy',id:'e1'};return 'advanced'}",context);
vm.runInContext(src,context);
const api=context.GensCombatFlow1678111;assert.ok(api);
scheduled.length=0;
const out=context.dungeonAdvanceTurn156();
assert.equal(out,'advanced');assert.equal(context.called,1,'enemy runner must start from the same handoff, not wait for the 700 ms watchdog');
assert.deepEqual(scheduled,[25,450],'only the runner startup pause is reduced; unrelated timer remains untouched');
assert.equal(context.setTimeout,realTimeout,'temporary timeout shim must be restored immediately');
context.called=0;context.dungeonTurn156.aiBusy=false;context.actor={kind:'enemy',id:'e2'};context.dungeonShouldMjControl156=()=>true;
assert.equal(api.kickEnemyNow(),false);assert.equal(context.called,0,'MJ-controlled enemy must never be auto-started');
console.log('V16.78.112 combat flow: immediate post-advance kick + 25 ms runner startup, MJ/ai guards preserved OK');
