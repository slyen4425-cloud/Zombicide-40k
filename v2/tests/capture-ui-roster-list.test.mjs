import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_ROSTER_LIST_CONTRACT,
  buildCaptureRosterLists,
  captureRosterListEntry,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeRosterData,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeBattleActiveInstance,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeVitals,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.exposesInspectionTarget,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesRoster,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.isolatedFromRpg,true);

{
  const creature={instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3,currentHp:8,maxHp:12};
  const before=structuredClone(creature);
  assert.deepEqual(captureRosterListEntry(creature,'active'),{
    instanceId:'a1',
    speciesId:'capture_aquafin',
    location:'active',
    title:'Aqua',
    subtitle:'capture_aquafin · Niv. 3',
    inspectable:true,
    activeInBattle:false,
    hasVitals:true,
    currentHp:8,
    maxHp:12,
    hpLabel:'8 / 12',
    ko:false,
  });
  assert.equal(captureRosterListEntry(creature,'active',{activeBattleInstanceId:'a1'}).activeInBattle,true);
  assert.equal(captureRosterListEntry(creature,'reserve',{activeBattleInstanceId:'a1'}).activeInBattle,false);
  assert.deepEqual(creature,before);
}

{
  const ko=captureRosterListEntry({instanceId:'ko1',speciesId:'capture_braiseau',currentHp:0,maxHp:20},'active');
  assert.equal(ko.hasVitals,true);
  assert.equal(ko.hpLabel,'0 / 20');
  assert.equal(ko.ko,true);
  const negative=captureRosterListEntry({instanceId:'ko2',speciesId:'capture_braiseau',currentHp:-3,maxHp:20},'reserve');
  assert.equal(negative.hpLabel,'0 / 20');
  assert.equal(negative.ko,true);
}

{
  const unknown=captureRosterListEntry({instanceId:'u1',speciesId:'capture_moussado'},'active');
  assert.equal(unknown.hasVitals,false);
  assert.equal(unknown.currentHp,null);
  assert.equal(unknown.maxHp,null);
  assert.equal(unknown.hpLabel,null);
  assert.equal(unknown.ko,false);
  const currentOnly=captureRosterListEntry({instanceId:'u2',speciesId:'capture_moussado',currentHp:5},'active');
  assert.equal(currentOnly.hpLabel,'5');
  assert.equal(currentOnly.ko,false);
  const maxOnly=captureRosterListEntry({instanceId:'u3',speciesId:'capture_moussado',maxHp:10},'active');
  assert.equal(maxOnly.hpLabel,'? / 10');
  assert.equal(maxOnly.ko,false);
}

{
  const state={
    activeTeam:[
      {instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3,currentHp:7,maxHp:12},
      {instanceId:'a2',speciesId:'capture_braiseau',level:1,currentHp:0,maxHp:9},
    ],
    reserve:[{instanceId:'r1',speciesId:'capture_descendre',nickname:'Draco',level:7,currentHp:21,maxHp:25}],
    battle:{player:{activeInstanceId:'a2'}},
  };
  const before=structuredClone(state);
  const lists=buildCaptureRosterLists(state);
  assert.equal(lists.counts.active,2);
  assert.equal(lists.counts.reserve,1);
  assert.equal(lists.activeBattleInstanceId,'a2');
  assert.equal(lists.activeTeam[0].activeInBattle,false);
  assert.equal(lists.activeTeam[1].activeInBattle,true);
  assert.equal(lists.activeTeam[1].ko,true);
  assert.equal(lists.activeTeam[1].hpLabel,'0 / 9');
  assert.equal(lists.reserve[0].activeInBattle,false);
  assert.equal(lists.reserve[0].ko,false);
  assert.equal(lists.reserve[0].hpLabel,'21 / 25');
  assert.deepEqual(state,before);
}

{
  const lists=buildCaptureRosterLists({activeTeam:[{instanceId:'a1',speciesId:'capture_aquafin'}],reserve:[],battle:null});
  assert.equal(lists.activeBattleInstanceId,null);
  assert.equal(lists.activeTeam[0].activeInBattle,false);
  assert.equal(lists.activeTeam[0].hasVitals,false);
}

assert.equal(captureRosterListEntry({instanceId:'x'},'active'),null);
assert.equal(captureRosterListEntry({speciesId:'capture_aquafin'},'active'),null);

const presenterSource=fs.readFileSync(new URL('../src/modes/capture/ui-roster-list.js',import.meta.url),'utf8');
for(const forbidden of ['moveCaptureRosterCreature','setCaptureTeam','switchCaptureBattleCreature','setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','applyCaptureDamage','healCaptureVitals','Math.random(','Date.now(']){
  assert.equal(presenterSource.includes(forbidden),false,`roster list presenter must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-active-list/);
assert.match(pageSource,/data-capture-reserve-list/);
assert.match(pageSource,/data-capture-inspect-instance/);
assert.match(pageSource,/data-capture-active-in-battle/);
assert.match(pageSource,/data-capture-active-battle-badge/);
assert.match(pageSource,/Actif en combat/);
assert.match(pageSource,/data-capture-hp/);
assert.match(pageSource,/PV :/);
assert.match(pageSource,/data-capture-ko=/);
assert.match(pageSource,/data-capture-ko-badge/);
assert.match(pageSource,/>KO<\/span>/);
assert.match(pageSource,/is-ko/);
assert.match(pageSource,/buildCaptureRosterLists\(session\.state\)/);
assert.match(pageSource,/api\.inspectCreature\(instanceId\)/);
assert.match(pageSource,/beginCaptureBattleSession\(session,options\)/);
assert.match(pageSource,/finishCaptureBattleSession\(session,reason\)/);
assert.match(pageSource,/renderRosterLists\(\)/);
assert.match(pageSource,/activeList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.removeEventListener\('click',handleRosterInspectClick\)/);
assert.equal(pageSource.includes('moveCaptureRosterCreature('),false);
assert.equal(pageSource.includes('setCaptureTeam('),false);
assert.equal(pageSource.includes('switchCaptureBattleCreature('),false);
assert.equal(pageSource.includes('applyCaptureDamage('),false);
assert.equal(pageSource.includes('healCaptureVitals('),false);

console.log('capture-ui-roster-list.test.mjs: ok');
