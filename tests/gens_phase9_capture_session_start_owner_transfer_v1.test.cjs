'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const ownerRel='assets/gensrpg/capture/session-start-v1.js';
const ownerPath=path.join(root,ownerRel);

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

const c139=block('captureFix139');

assert.ok(fs.existsSync(ownerPath),
  'RED: Capture session start must move to assets/gensrpg/capture/session-start-v1.js');

const owner=read(ownerRel);

assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,1,
  'Capture session-start owner must be loaded exactly once');
assert.match(owner,/GensCaptureSessionStartV1/);
assert.match(owner,/function\s+install\s*\(/);
assert.match(owner,/async\s+function\s+start\s*\(/);
assert.match(owner,/function\s+dispose\s*\(/);
assert.match(owner,/function\s+status\s*\(/);
assert.doesNotMatch(owner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'new Capture session owner must consume explicit bindings and own no DOM/storage/timer authority');

assert.doesNotMatch(entry,/legacyStartConfiguredGame|Capture139 legacy start/);
assert.match(entry,/GensCaptureSessionStartV1|sessionStartOwner/);
assert.match(entry,/await\s+sessionStartOwner\.start\(\)/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);

assert.doesNotMatch(c139,/window\.startConfiguredGame\s*=/,
  'Capture139 must retire its global session-start wrapper');
assert.doesNotMatch(c139,/const\s+start139\s*=|gensCaptureStartConfiguredGame139V1/);
assert.doesNotMatch(c139,/_captureStarting139|setTimeout\([\s\S]*?1200/,
  'dead Capture139 launch timer/lock must be removed instead of migrated');
assert.doesNotMatch(c139,/const\s+participants\s*=\s*normalizeGameParticipants\(\)/,
  'Capture139 must no longer contain the session initialization body');
assert.match(c139,/GensCaptureSessionStartV1\.install\s*\(/,
  'Capture139 may only wire explicit historical dependencies into the new owner');
assert.match(c139,/GensCaptureV1\.install\s*\(\s*window\.GensCaptureSessionStartV1\s*\)/,
  'public Capture entry must bind the new owner, not a legacy global start wrapper');

assert.ok(contract.owns.includes('Capture session initialization'));
assert.ok(!contract.consumes.includes('temporary legacy Capture139 session start binding'));
assert.ok(contract.consumes.includes('Capture session-start owner public API'));
assert.ok(contract.invariants.some(x=>/Capture139 no longer owns session initialization/i.test(x)));

const calls=[];
const world={day:9,turnIndex:4,round:7,last:'old',locationId:'',locationName:''};
const cfg={turnOrder:true};
const context={console};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(owner,context,{filename:ownerRel});
const api=context.GensCaptureSessionStartV1;
assert.ok(api,'owner must expose GensCaptureSessionStartV1');

api.install({
  normalizeParticipants:()=>['trainer-a','trainer-b'],
  participantsReady:()=>true,
  activateParticipant:id=>calls.push(['activate',id]),
  saveParticipants:ids=>calls.push(['saveParticipants',[...ids]]),
  applyCustomHeroes:()=>calls.push(['customHeroes']),
  applyPregameGold:ids=>calls.push(['gold',[...ids]]),
  markSessionActive:()=>calls.push(['active']),
  loadWorld:()=>world,
  saveWorld:value=>calls.push(['saveWorld',{...value}]),
  ensureStarterKits:()=>calls.push(['starterKits']),
  readTurnOrderEnabled:()=>false,
  loadCustomization:()=>cfg,
  saveCustomization:value=>calls.push(['saveCfg',{...value}]),
  startTurnManager:()=>calls.push(['startTurns']),
  clearTurnManager:()=>calls.push(['clearTurns']),
  enterWorld:()=>calls.push(['enterWorld']),
  notify:message=>calls.push(['notify',message]),
  openParticipantSetup:()=>calls.push(['openSetup'])
});

(async()=>{
  assert.equal(await api.start(),true);
  assert.deepEqual(calls[0],['activate','trainer-a']);
  assert.deepEqual(calls.find(x=>x[0]==='saveParticipants'),['saveParticipants',['trainer-a','trainer-b']]);
  assert.equal(world.day,1);
  assert.equal(world.turnIndex,0);
  assert.equal(world.round,1);
  assert.equal(world.last,null);
  assert.equal(world.locationId,'cap_forest');
  assert.equal(world.locationName,'Forêt sauvage');
  assert.equal(cfg.turnOrder,false);
  assert.ok(calls.some(x=>x[0]==='clearTurns'));
  assert.ok(!calls.some(x=>x[0]==='startTurns'));
  assert.equal(calls.filter(x=>x[0]==='enterWorld').length,1,
    'session start must enter Capture world once; the obsolete delayed second entry is retired');

  api.dispose();
  assert.equal(api.status().installed,false);

  console.log(JSON.stringify({
    scenario:'Phase 9 Capture session-start owner transfer',
    owner:'GensCaptureSessionStartV1',
    capture139SessionOwnerRetired:true,
    legacyTimerRetired:true,
    shellUnchanged:true
  },null,2));
})().catch(err=>{console.error(err);process.exitCode=1});
