const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const labRoot = process.env.COMBAT_LAB_ROOT;
assert.ok(labRoot, 'COMBAT_LAB_ROOT must identify the pinned official checkout');
const PIN = '65e21792ff74aea9862e528c8dbfdb22797b6693';
assert.equal(execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), PIN);

function clock() {
  let time = 0, id = 0;
  const timers = new Map();
  return {
    now: () => time,
    setTimer(fn, ms) {const key=++id; timers.set(key, {fn, at:time+ms}); return key;},
    clearTimer(key) {timers.delete(key);},
    advance(ms) {
      const end = time + ms;
      let count = 0;
      for (;;) {
        const next = [...timers].sort((a,b)=>a[1].at-b[1].at)[0];
        if (!next || next[1].at > end) break;
        assert.ok(++count < 10000, 'unbounded timer loop');
        time = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      time = end;
    },
    count: () => timers.size
  };
}

async function setup({aiEnabled=false, mountBattle=()=>({dispose(){}}),configureExport=()=>{},configureSnapshot=()=>{}}={}) {
  const ctx = {};
  for (const file of ['battle-bridge-contract-v1.js','lab-ownership-port-v1.js',
    'manual-battle-trigger-v1.js','temporary-encounter-source-v1.js',
    'temporary-zone-controller-v1.js','temporary-zone-session-v1.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root,'assets/gensrpg/capture',file),'utf8'),ctx);
  }
  const {loadCombatLabEngineV1} = await import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
  const {createCombatLabProviderV1} = await import('../assets/gensrpg/capture/combat-lab-provider-v1.mjs');
  const engine = await loadCombatLabEngineV1(pathToFileURL(path.resolve(labRoot)+path.sep));
  const input = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/capture-lab-1v1-export-v1.json')));
  configureExport(input);
  const native = engine.adaptCaptureCombatExportStackV1(input);
  const snapshot = {sides: input.actors.map(actor=>({name:actor.displayName, active:[actor.actorId], creatures:[{
    instanceId:actor.actorId,creatureId:actor.creatureId,
    hp:24,maxHp:24,abilityIds:input.creatures.find(c=>c.id===actor.creatureId).skillIds
  }]}))};
  configureSnapshot(snapshot);
  const time = clock();
  let battle, destroyed=0;
  const provider = createCombatLabProviderV1({engine, clock:time,
    resolveBattle:()=>({nativeCombatSource:native, actorIds:['player','opponent'], aiEnabled}),
    mountBattle(handle,context) {battle=handle;const view=mountBattle(handle,context);return {
      render:state=>view.render?.(state),dispose(){destroyed++;view.dispose();}
    };}
  });
  const port = ctx.GensCaptureLabOwnershipPortV1;
  port.install(provider);
  const trigger = ctx.GensCaptureManualBattleTriggerV1.create(port,ctx.GensCaptureBattleBridgeContractV1);
  const returns=[];
  const session = ctx.GensCaptureTemporaryZoneSessionV1.create({trigger,width:3,height:2,
    encounterAt:(x,y)=>x===1&&y===0?'wild':null,
    resolveEncounter:key=>({encounterId:key,snapshot}),onBattleReturn:event=>returns.push(event)});
  return {engine,native,snapshot,provider,port,session,time,returns,
    battle:()=>battle,destroyed:()=>destroyed};
}

const flush = () => new Promise(resolve=>setImmediate(resolve));

test('real Lab Core: zone → port → preparation/cost/impact/KO → automatic validated return',async()=>{
  const s=await setup();
  assert.equal(s.session.move(1,0).encounter.ready,true);
  assert.equal(s.session.state().zone.locked,true);
  const battle=s.battle();
  assert.equal(battle.useSkill('preview-strike').ok,true);
  assert.equal(battle.state().fighters.player.energy,9);
  s.time.advance(350);
  assert.equal(battle.state().fighters.opponent.hp,24,'no damage before native impact');
  s.time.advance(200);
  assert.equal(battle.state().fighters.opponent.hp,12);
  assert.equal(battle.useSkill('preview-strike').ok,true);
  s.time.advance(550);
  await flush();
  assert.equal(s.returns.length,1);
  assert.equal(s.returns[0].result.outcome,'victory');
  assert.equal(s.returns[0].result.creatures.find(c=>c.instanceId==='opponent').hp,0);
  assert.equal(s.session.state().zone.locked,false);
  assert.equal(s.port.status().battleActive,false);
  assert.equal(s.time.count(),0);
  assert.equal(s.destroyed(),1);
  assert.equal(s.session.move(0,1).moved,true);
  assert.throws(()=>s.session.complete({outcome:'victory',creatures:[]}),/No pending/);
  s.session.stop();s.port.uninstall(s.provider);
});

test('official AI drives a real enemy action using the same runtime clock',async()=>{
  const s=await setup({aiEnabled:true});
  s.session.move(1,0);
  s.time.advance(1800);
  assert.ok(s.battle().state().fighters.player.hp<24);
  s.battle().flee();await flush();
  assert.equal(s.returns[0].result.outcome,'flee');
  assert.equal(s.time.count(),0);
  s.session.stop();s.port.uninstall(s.provider);
});

test('exit during preparation cancels once, ignores late completion and releases every timer',async()=>{
  const s=await setup();s.session.move(1,0);const battle=s.battle();
  battle.useSkill('preview-strike');s.time.advance(50);
  s.session.stop();await flush();s.time.advance(5000);
  assert.equal(s.returns.length,1);
  assert.equal(s.returns[0].cancelled,true);
  assert.equal(s.time.count(),0);
  assert.equal(s.destroyed(),1);
  assert.equal(s.port.status().battleActive,false);
  assert.equal(battle.useSkill('preview-strike').ok,false);
  s.port.uninstall(s.provider);
});

test('state presentation failure returns control and never persists a fabricated result',async()=>{
  const s=await setup({mountBattle:()=>({render(){throw new Error('broken view')},dispose(){}})});
  s.session.move(1,0);await flush();
  assert.equal(s.session.state().zone.locked,false);
  assert.equal(s.returns.length,1);
  assert.equal(s.returns[0].cancelled,true);
  assert.match(s.returns[0].error,/broken view/);
  assert.equal(s.time.count(),0);
  assert.equal(s.port.status().battleActive,false);
  s.session.stop();s.port.uninstall(s.provider);
});

test('1v1 adapter refuses reserves, mismatched identities, HP and skill drift before start',async()=>{
  const s=await setup();const source=structuredClone(s.snapshot);
  const context={encounterId:'invalid',snapshot:source};
  source.sides[0].creatures.push({...source.sides[0].creatures[0],instanceId:'reserve'});
  assert.throws(()=>s.provider.createBattle(context),/1v1/);
  source.sides[0].creatures.pop();source.sides[0].active=['other'];
  assert.throws(()=>s.provider.createBattle(context),/active/);
  source.sides[0].active=['player'];source.sides[0].creatures[0].maxHp=999;
  assert.throws(()=>s.provider.createBattle(context),/HP/);
  source.sides[0].creatures[0].maxHp=24;source.sides[0].creatures[0].abilityIds=['unknown'];
  assert.throws(()=>s.provider.createBattle(context),/skill/);
  assert.equal(s.time.count(),0);s.session.stop();s.port.uninstall(s.provider);
});

test('initial Capture HP and foreign instance identities survive the real defeat return',async()=>{
  const s=await setup({aiEnabled:true,configureSnapshot(snapshot){
    snapshot.sides[0].creatures[0].hp=4;
    for(const [i,side] of snapshot.sides.entries()){
      side.creatures[0].instanceId='capture-instance-'+i;side.active=['capture-instance-'+i];
    }
  }});
  const before=JSON.stringify(s.snapshot);
  s.session.move(1,0);
  assert.equal(s.battle().state().fighters.player.hp,4,'profile HP wins over authored initialHp=24');
  s.time.advance(1800);await flush();
  assert.equal(s.returns[0].result.outcome,'defeat');
  assert.equal(s.returns[0].result.creatures.find(c=>c.instanceId==='capture-instance-0').hp,0);
  assert.equal(JSON.stringify(s.snapshot),before,'input DTO is never mutated');
  assert.equal(s.time.count(),0);s.session.stop();s.port.uninstall(s.provider);
});

test('authored zero-duration action uses native resolution and leaves no startup timer',async()=>{
  const s=await setup({configureExport(exported){
    Object.assign(exported.skills[0].definition,{preparationMs:0,travelMs:0,recoveryMs:0,effect:{damage:24}});
  }});
  s.session.move(1,0);s.battle().useSkill('preview-strike');await flush();
  assert.equal(s.returns.length,1);
  assert.equal(s.returns[0].result.outcome,'victory');
  assert.equal(s.time.count(),0);s.session.stop();s.port.uninstall(s.provider);
});

test('invalid asynchronous provider result unlocks the zone and applies no result',async()=>{
  const s=await setup();s.port.uninstall(s.provider);
  let disposed=0;
  const invalid={...s.provider,createBattle:()=>({completion:Promise.resolve({outcome:'victory',creatures:[]})}),
    startBattle(){},stopBattle(){},disposeBattle(){disposed++;}};
  s.port.install(invalid);s.session.move(1,0);await flush();
  assert.equal(s.session.state().zone.locked,false);
  assert.equal(s.returns.length,1);assert.equal(s.returns[0].cancelled,true);
  assert.match(s.returns[0].error,/Incomplete/);assert.equal(s.returns[0].result,undefined);
  assert.equal(disposed,1);s.session.stop();s.port.uninstall(invalid);
});
