const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const LAB_PIN = '65e21792ff74aea9862e528c8dbfdb22797b6693';
const labRoot = process.env.COMBAT_LAB_ROOT;
assert.ok(labRoot, 'The official pinned Combat Lab checkout is mandatory');
assert.equal(execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), LAB_PIN);
const bridgeUrl = pathToFileURL(path.join(root, 'assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs')).href;
const {loadCombatLabEngineV1} = require('node:module').createRequire(__filename) ? {} : {};
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/capture-lab-1v1-export-v1.json'),'utf8'));
let enginePromise;
async function lab(){
  if(!enginePromise) enginePromise = Promise.all([
    import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs'),
    import('../assets/gensrpg/capture/combat-lab-provider-v1.mjs'),
    import(bridgeUrl)
  ]).then(async ([loader,provider,bridge])=>({
    engine:await loader.loadCombatLabEngineV1(pathToFileURL(path.resolve(labRoot)+path.sep)),
    makeProvider:provider.createCombatLabProviderV1,
    makeBridge:bridge.createCaptureSavedProfileBattleBridgeV1
  }));
  return enginePromise;
}
function clock(){
  let now=0,id=0;const timers=new Map();
  return {
    now:()=>now,setTimer(fn,ms){const token=++id;timers.set(token,{fn,at:now+ms});return token;},
    clearTimer(token){timers.delete(token);},
    advance(ms){const stop=now+ms;let count=0;for(;;){
      const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next||next[1].at>stop)break;
      assert.ok(++count<10000,'native combat timer must terminate');
      now=next[1].at;timers.delete(next[0]);next[1].fn();
    }now=stop;},
    count:()=>timers.size
  };
}
function persistedCaptureOwner(overrides={}){
  const storage=new Map(),heroId='trainer-profile-1';
  const initial={
    creatureTeam:[{uid:'ci_existing_player',entityId:'preview-player',hp:overrides.hp??24,maxHp:24,
      activeAbilityIds:['preview-strike'],knownAbilityIds:['preview-strike'],level:4,xp:17,
      statAlloc:{power:2},customUserValue:'keep'}],
    creatureReserve:[],unrelated:{inventory:[{id:'item',quantity:3}],gold:71}
  };
  Object.assign(initial,overrides);
  storage.set('save:'+heroId,JSON.stringify(initial));
  let writes=0;
  const ctx=vm.createContext({
    current:heroId,state:null,
    key:id=>'save:'+id,
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value);writes++;}},
    loadState:id=>JSON.parse(storage.get('save:'+id)),
    normalizeGameParticipants:()=>[heroId],
    loadSharedEntities:()=>fixture.creatures.map(c=>({id:c.id,name:c.displayName,hp:c.combat.maxHp,abilityIds:c.skillIds}))
  });
  const code=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'),'utf8');
  for(const part of [3,1]){
    const match=code.match(new RegExp('// BEGIN_CAPTURE_TEAM_SECTION_'+part+'\\n([\\s\\S]*?)// END_CAPTURE_TEAM_SECTION_'+part));
    assert.ok(match,'read the physical canonical Capture roster owner section '+part);
    vm.runInContext(match[1],ctx);
  }
  assert.equal(ctx.captureTeamEntityRoster().length,1,'real roster owner reads the saved team');
  return {heroId,ctx,get:()=>JSON.parse(storage.get('save:'+heroId)),getRaw:()=>storage.get('save:'+heroId),
    writes:()=>writes,replace:next=>storage.set('save:'+heroId,JSON.stringify(next)),
    load:id=>ctx.loadState(id),save:(id,state)=>ctx.saveHeroCreatureState(id,state)};
}
function resultGuard(){
  const ctx={};vm.runInNewContext(fs.readFileSync(
    path.join(root,'assets/gensrpg/capture/battle-bridge-contract-v1.js'),'utf8'),ctx);
  return ctx.GensCaptureBattleBridgeContractV1.result;
}
async function setup({hp=24,aiEnabled=false,mutate=()=>{},encounter}={}){
  const {engine,makeProvider,makeBridge}=await lab();
  const owner=persistedCaptureOwner({hp});
  const exportData=structuredClone(fixture);
  mutate({owner,exportData});
  const readEncounter=()=>encounter??{type:'wild',encounterId:'real-wild-001',creatureId:'preview-enemy'};
  const bridge=makeBridge({
    activeHeroId:()=>owner.ctx.captureActiveHeroId(),
    loadHeroState:owner.load,saveHeroState:owner.save,readEncounter,
    exported:exportData,adaptCombatExport:engine.adaptCaptureCombatExportStackV1,
    validateBattleResult:resultGuard()
  });
  const ticket=bridge.prepareEncounter();
  const time=clock(),events=[];
  let battle;
  const provider=makeProvider({
    engine,clock:time,
    resolveBattle:context=>ticket.resolveBattle(context),
    mountBattle:handle=>{battle=handle;return {dispose(){}};}
  });
  const ctx={};
  for(const name of ['battle-bridge-contract-v1.js','lab-ownership-port-v1.js',
    'manual-battle-trigger-v1.js','temporary-encounter-source-v1.js',
    'temporary-zone-controller-v1.js','temporary-zone-session-v1.js']){
    vm.runInNewContext(fs.readFileSync(path.join(root,'assets/gensrpg/capture',name),'utf8'),ctx);
  }
  const port=ctx.GensCaptureLabOwnershipPortV1;port.install(provider);
  const trigger=ctx.GensCaptureManualBattleTriggerV1.create(port,ctx.GensCaptureBattleBridgeContractV1);
  const session=ctx.GensCaptureTemporaryZoneSessionV1.create({
    trigger,width:3,height:2,encounterAt:(x,y)=>x===1&&y===0?'wild':null,
    resolveEncounter:()=>({encounterId:ticket.encounterId,snapshot:ticket.snapshot}),
    onBattleReturn:event=>{events.push(event);if(event.result)ticket.applyResult(event.result);}
  });
  return {owner,ticket,provider,port,session,events,time,battle:()=>battle,
    stop(){session.stop();port.uninstall(provider);}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('real saved Capture owner → official Core defeat → single save and complete reload',async()=>{
  const s=await setup({hp:3,aiEnabled:true});
  const before=s.owner.get();
  assert.equal(s.ticket.snapshot.sides[0].creatures[0].instanceId,'ci_existing_player');
  assert.equal(s.session.move(1,0).encounter.ready,true);
  assert.equal(s.battle().state().fighters.player.hp,3);
  s.time.advance(1800);await flush();
  assert.equal(s.events.length,1);assert.equal(s.events[0].result.outcome,'defeat');
  assert.equal(s.owner.get().creatureTeam[0].hp,0);
  assert.equal(s.owner.get().creatureTeam[0].uid,before.creatureTeam[0].uid);
  assert.equal(s.owner.get().creatureTeam[0].xp,17);
  assert.deepEqual(s.owner.get().unrelated,before.unrelated);
  assert.equal(s.owner.writes(),1);
  assert.equal(s.ticket.applyResult(s.events[0].result),false,'same result cannot be applied twice');
  assert.equal(s.owner.writes(),1);
  assert.equal(s.session.state().zone.locked,false);
  assert.equal(s.time.count(),0);
  s.stop();
});

test('real native impact and second strike give victory, profile identity remains intact',async()=>{
  const s=await setup({hp:20});
  const rawBefore=s.owner.getRaw();
  s.session.move(1,0);
  assert.equal(s.battle().useSkill('preview-strike').ok,true);
  assert.equal(s.owner.getRaw(),rawBefore,'no save before combat resolution');
  s.time.advance(550);
  assert.equal(s.battle().state().fighters.opponent.hp,12);
  assert.equal(s.battle().useSkill('preview-strike').ok,true);
  s.time.advance(550);await flush();
  assert.equal(s.events[0].result.outcome,'victory');
  assert.equal(s.owner.get().creatureTeam[0].hp,20);
  assert.equal(s.owner.writes(),1);
  assert.equal(s.ticket.applyResult(s.events[0].result),false);
  s.stop();
});

test('flee commits damaged current HP only; cancelled exit does not save',async()=>{
  const s=await setup({hp:20,aiEnabled:true});s.session.move(1,0);
  s.time.advance(1800);
  assert.ok(s.battle().state().fighters.player.hp<20);
  const hp=s.battle().state().fighters.player.hp;
  s.battle().flee();await flush();
  assert.equal(s.events[0].result.outcome,'flee');
  assert.equal(s.owner.get().creatureTeam[0].hp,hp);
  assert.equal(s.owner.writes(),1);
  s.stop();
  const c=await setup({hp:20});c.session.move(1,0);c.session.stop();await flush();
  assert.equal(c.owner.writes(),0);
  c.port.uninstall(c.provider);
});

test('a concurrent external save must never be overwritten by a stale combat result',async()=>{
  const s=await setup({hp:20});s.session.move(1,0);
  const changed=s.owner.get();changed.creatureTeam[0].hp=13;changed.unrelated.gold=95;
  s.owner.replace(changed);
  s.battle().flee();
  await assert.rejects(async()=>{await flush();},/./).catch(()=>{});
  assert.equal(s.owner.get().creatureTeam[0].hp,13);
  assert.equal(s.owner.get().unrelated.gold,95);
  assert.equal(s.owner.writes(),0);
  s.stop();
});

test('profile or authored mismatches are rejected, never mapped by guesswork',async()=>{
  const {engine,makeBridge}=await lab();const owner=persistedCaptureOwner();
  const opts={activeHeroId:()=>owner.heroId,loadHeroState:owner.load,saveHeroState:owner.save,
    readEncounter:()=>({type:'wild',encounterId:'wild',creatureId:'preview-enemy'}),
    adaptCombatExport:engine.adaptCaptureCombatExportStackV1,validateBattleResult:resultGuard()};
  const bridge=exported=>makeBridge({...opts,exported});
  const unknown=owner.get();unknown.creatureTeam[0].entityId='missing';
  owner.replace(unknown);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/authored|creature|catalog/i);
  owner.replace(persistedCaptureOwner().get());
  const two=owner.get();two.creatureTeam.push({...two.creatureTeam[0],uid:'second'});owner.replace(two);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/1v1|roster|team/i);
  owner.replace(persistedCaptureOwner().get());
  const badLoadout=owner.get();badLoadout.creatureTeam[0].activeAbilityIds=['unknown'];owner.replace(badLoadout);
  assert.throws(()=>bridge(structuredClone(fixture)).prepareEncounter(),/skill|loadout|ability/i);
  assert.equal(owner.writes(),0);
});
