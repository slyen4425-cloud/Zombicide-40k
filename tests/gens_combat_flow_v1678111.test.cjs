const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-combat-flow-1678111.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.111"/);
assert.match(src,/AI_START_MS=90/);
assert.match(src,/LEGACY_AI_START_MS=250/);
assert.match(bridge,/gens-combat-flow-1678111\.js\?v=1678111/);

const scheduled=[];
function realTimeout(fn,delay){scheduled.push(Number(delay)||0);return scheduled.length}
const context={console,setTimeout:realTimeout,clearTimeout(){},window:null,called:0};context.window=context;
vm.createContext(context);
vm.runInContext("dungeonRunAi156=function(){called++;setTimeout(function(){},250);setTimeout(function(){},450);return 'ok'}",context);
vm.runInContext(src,context);
const api=context.GensCombatFlow1678111;assert.ok(api);
// Remove install/reinstall timers from the assertion surface.
scheduled.length=0;
const out=context.dungeonRunAi156({kind:'enemy'});
assert.equal(out,'ok');assert.equal(context.called,1);
assert.deepEqual(scheduled,[90,450],'only the deliberate 250 ms AI startup delay must be shortened');
assert.equal(context.setTimeout,realTimeout,'global setTimeout must be restored immediately after runner scheduling');
console.log('V16.78.111 combat flow: 250 ms AI startup -> 90 ms, unrelated timers untouched OK');
