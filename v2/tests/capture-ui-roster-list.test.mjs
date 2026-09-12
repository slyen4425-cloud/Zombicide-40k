import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_ROSTER_LIST_CONTRACT,
  buildCaptureRosterLists,
  captureRosterListEntry,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeRosterData,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.exposesInspectionTarget,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesRoster,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.isolatedFromRpg,true);

{
  const creature={instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3};
  const before=structuredClone(creature);
  assert.deepEqual(captureRosterListEntry(creature,'active'),{
    instanceId:'a1',
    speciesId:'capture_aquafin',
    location:'active',
    title:'Aqua',
    subtitle:'capture_aquafin · Niv. 3',
    inspectable:true,
  });
  assert.deepEqual(creature,before);
}

{
  const state={
    activeTeam:[
      {instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3},
      {instanceId:'a2',speciesId:'capture_braiseau',level:1},
    ],
    reserve:[{instanceId:'r1',speciesId:'capture_descendre',nickname:'Draco',level:7}],
  };
  const before=structuredClone(state);
  const lists=buildCaptureRosterLists(state);
  assert.equal(lists.counts.active,2);
  assert.equal(lists.counts.reserve,1);
  assert.equal(lists.activeTeam[0].instanceId,'a1');
  assert.equal(lists.activeTeam[1].title,'capture_braiseau');
  assert.equal(lists.reserve[0].location,'reserve');
  assert.equal(lists.reserve[0].instanceId,'r1');
  assert.deepEqual(state,before);
}

assert.equal(captureRosterListEntry({instanceId:'x'},'active'),null);
assert.equal(captureRosterListEntry({speciesId:'capture_aquafin'},'active'),null);

const presenterSource=fs.readFileSync(new URL('../src/modes/capture/ui-roster-list.js',import.meta.url),'utf8');
for(const forbidden of ['moveCaptureRosterCreature','setCaptureTeam','setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','Math.random(','Date.now(']){
  assert.equal(presenterSource.includes(forbidden),false,`roster list presenter must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-active-list/);
assert.match(pageSource,/data-capture-reserve-list/);
assert.match(pageSource,/data-capture-inspect-instance/);
assert.match(pageSource,/buildCaptureRosterLists\(session\.state\)/);
assert.match(pageSource,/api\.inspectCreature\(instanceId\)/);
assert.match(pageSource,/activeList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.removeEventListener\('click',handleRosterInspectClick\)/);
assert.equal(pageSource.includes('moveCaptureRosterCreature('),false);
assert.equal(pageSource.includes('setCaptureTeam('),false);

console.log('capture-ui-roster-list.test.mjs: ok');
