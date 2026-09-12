import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_ROSTER_LIST_CONTRACT,
  buildCaptureRosterLists,
  captureRosterListEntry,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeReactionState,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesRoster,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.isolatedFromRpg,true);

{
  const creature={
    instanceId:'r1',
    speciesId:'capture_ailevent',
    reactionState:{
      dodge:{resource:2,cooldownRemaining:0},
      counter:{resource:0,cooldownRemaining:3},
      passive:{resource:null,cooldownRemaining:null},
    },
  };
  const before=structuredClone(creature);
  const entry=captureRosterListEntry(creature,'active');
  assert.deepEqual(entry.reactions,[
    {id:'dodge',resource:2,cooldownRemaining:0,readyByCooldown:true},
    {id:'counter',resource:0,cooldownRemaining:3,readyByCooldown:false},
    {id:'passive',resource:null,cooldownRemaining:null,readyByCooldown:null},
  ]);
  assert.deepEqual(creature,before);
}

{
  const entry=captureRosterListEntry({
    instanceId:'r2',
    speciesId:'capture_nocteceoc',
    reactionState:{dodge:{resource:-4,cooldownRemaining:-2}},
  },'reserve');
  assert.deepEqual(entry.reactions,[
    {id:'dodge',resource:0,cooldownRemaining:0,readyByCooldown:true},
  ]);
}

{
  const entry=captureRosterListEntry({instanceId:'r3',speciesId:'capture_rocorne'},'active');
  assert.deepEqual(entry.reactions,[]);
}

{
  const state={
    activeTeam:[{instanceId:'a1',speciesId:'capture_aquafin',reactionState:{dodge:{resource:1,cooldownRemaining:2}}}],
    reserve:[{instanceId:'b1',speciesId:'capture_braiseau',reactionState:{brace:{resource:null,cooldownRemaining:0}}}],
    battle:{player:{activeInstanceId:'a1'}},
  };
  const before=structuredClone(state);
  const lists=buildCaptureRosterLists(state);
  assert.equal(lists.activeTeam[0].reactions[0].readyByCooldown,false);
  assert.equal(lists.reserve[0].reactions[0].readyByCooldown,true);
  assert.deepEqual(state,before);
}

const presenterSource=fs.readFileSync(new URL('../src/modes/capture/ui-roster-list.js',import.meta.url),'utf8');
for(const forbidden of ['spendCaptureReactionState','tickCaptureReactionStateMap','canUseCaptureReactionState','resolveCaptureReaction','advanceCaptureBattleTime','Math.random(','Date.now(']){
  assert.equal(presenterSource.includes(forbidden),false,`roster presenter must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-reactions/);
assert.match(pageSource,/data-capture-reaction=/);
assert.match(pageSource,/data-capture-reaction-ready=/);
assert.match(pageSource,/capture-roster-reaction/);
assert.match(pageSource,/entry\.reactions\.map\(rosterReactionHtml\)/);
assert.match(pageSource,/prête côté cooldown/);
assert.match(pageSource,/ressource/);
for(const forbidden of ['spendCaptureReactionState(','tickCaptureReactionStateMap(','canUseCaptureReactionState(','resolveCaptureReaction(','advanceCaptureBattleTime(']){
  assert.equal(pageSource.includes(forbidden),false,`capture page must not include ${forbidden}`);
}

console.log('capture-ui-roster-reactions.test.mjs: ok');
