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
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeStatuses,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsAuthoritativeAbilityState,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.readsCanonicalCaptureAssetRegistry,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.neverUsesRpgOrDungeonFallback,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.exposesInspectionTarget,true);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesRoster,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_ROSTER_LIST_CONTRACT.isolatedFromRpg,true);

{
  const creature={
    instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3,currentHp:8,maxHp:12,
    statuses:[
      {id:'wet',name:'Mouillé',stacks:2,remainingDuration:3,effects:[{type:'damage',amount:99}]},
      {id:'guarded',name:'Protégé'},
    ],
    abilityState:{
      splash:{charges:2,chargeMax:4,cooldownRemaining:1,cost:1},
      dash:{charges:null,chargeMax:null,cooldownRemaining:0,cost:null},
    },
  };
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
    statuses:[
      {id:'wet',name:'Mouillé',stacks:2,remainingDuration:3},
      {id:'guarded',name:'Protégé',stacks:null,remainingDuration:null},
    ],
    abilities:[
      {id:'splash',charges:2,chargeMax:4,cooldownRemaining:1},
      {id:'dash',charges:null,chargeMax:null,cooldownRemaining:0},
    ],
    reactions:[],
  });
  assert.equal(captureRosterListEntry(creature,'active',{activeBattleInstanceId:'a1'}).activeInBattle,true);
  assert.equal(captureRosterListEntry(creature,'reserve',{activeBattleInstanceId:'a1'}).activeInBattle,false);
  assert.deepEqual(creature,before);
}

{
  const assetRegistry={
    assetRoot:'v2/assets/capture/creatures/',
    speciesAssets:[
      {speciesId:'capture_aquafin',displayName:'Aquafin',legacyAliases:['crea_aquafin'],mainArt:{status:'pending_import',path:null},iconArt:{status:'pending_import',path:null}},
      {speciesId:'capture_descendre',displayName:'Descendre',legacyAliases:['crea_dracendre'],mainArt:{status:'ready',path:'v2/assets/capture/creatures/descendre-main.webp'},iconArt:{status:'ready',path:'v2/assets/capture/creatures/descendre-icon.webp'}},
      {speciesId:'capture_rocorne',displayName:'Rocorne',legacyAliases:[],mainArt:{status:'ready',path:'v2/assets/rpg/rocorne.webp'},iconArt:{status:'ready',path:'assets/dungeon/creatures/rocorne.webp'}},
    ],
  };
  const pending=captureRosterListEntry({instanceId:'a1',speciesId:'crea_aquafin',level:2},'active',{assetRegistry});
  assert.equal(pending.speciesId,'capture_aquafin');
  assert.equal(pending.displayName,'Aquafin');
  assert.equal(pending.title,'Aquafin');
  assert.equal(pending.subtitle,'Aquafin · Niv. 2');
  assert.equal(pending.mainArt,null);
  assert.equal(pending.iconArt,null);

  const ready=captureRosterListEntry({instanceId:'d1',speciesId:'crea_dracendre',nickname:'Draco',level:7},'reserve',{assetRegistry});
  assert.equal(ready.speciesId,'capture_descendre');
  assert.equal(ready.displayName,'Descendre');
  assert.equal(ready.title,'Draco');
  assert.equal(ready.subtitle,'Descendre · Niv. 7');
  assert.equal(ready.iconArt.src,'./assets/capture/creatures/descendre-icon.webp');
  assert.equal(ready.mainArt.src,'./assets/capture/creatures/descendre-main.webp');

  const blocked=captureRosterListEntry({instanceId:'r1',speciesId:'capture_rocorne'},'active',{assetRegistry});
  assert.equal(blocked.displayName,'Rocorne');
  assert.equal(blocked.mainArt,null);
  assert.equal(blocked.iconArt,null);
}

{
  const legacy=captureRosterListEntry({instanceId:'l1',speciesId:'capture_braiseau',abilityCharges:{ember:3,wing:-2}},'active');
  assert.deepEqual(legacy.abilities,[
    {id:'ember',charges:3,chargeMax:null,cooldownRemaining:null},
    {id:'wing',charges:0,chargeMax:null,cooldownRemaining:null},
  ]);
}

{
  const statusFallback=captureRosterListEntry({instanceId:'s1',speciesId:'capture_lumino',statuses:[{id:'light-shield',stacks:0,remainingDuration:-2},{name:'Aura'}]},'active');
  assert.deepEqual(statusFallback.statuses,[
    {id:'light-shield',name:'light-shield',stacks:1,remainingDuration:0},
    {id:'',name:'Aura',stacks:null,remainingDuration:null},
  ]);
  const invalid=captureRosterListEntry({instanceId:'s2',speciesId:'capture_lumino',statuses:[{},null]},'active');
  assert.deepEqual(invalid.statuses,[]);
}

{
  const ko=captureRosterListEntry({instanceId:'ko1',speciesId:'capture_braiseau',currentHp:0,maxHp:20},'active');
  assert.equal(ko.hasVitals,true);
  assert.equal(ko.hpLabel,'0 / 20');
  assert.equal(ko.ko,true);
  assert.deepEqual(ko.statuses,[]);
  assert.deepEqual(ko.abilities,[]);
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
  assert.deepEqual(unknown.statuses,[]);
  assert.deepEqual(unknown.abilities,[]);
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
      {instanceId:'a1',speciesId:'capture_aquafin',nickname:'Aqua',level:3,currentHp:7,maxHp:12,statuses:[{id:'slow',name:'Ralenti',remainingDuration:2}],abilityState:{splash:{charges:1,chargeMax:4,cooldownRemaining:2}}},
      {instanceId:'a2',speciesId:'capture_braiseau',level:1,currentHp:0,maxHp:9,statuses:[{id:'burn',name:'Brûlure',stacks:3}],abilityCharges:{ember:0}},
    ],
    reserve:[{instanceId:'r1',speciesId:'capture_descendre',nickname:'Draco',level:7,currentHp:21,maxHp:25,statuses:[{id:'focus',name:'Concentration'}],abilityState:{wind:{charges:null,chargeMax:null,cooldownRemaining:0}}}],
    battle:{player:{activeInstanceId:'a2'}},
  };
  const before=structuredClone(state);
  const lists=buildCaptureRosterLists(state);
  assert.equal(lists.counts.active,2);
  assert.equal(lists.counts.reserve,1);
  assert.equal(lists.activeBattleInstanceId,'a2');
  assert.equal(lists.activeTeam[0].activeInBattle,false);
  assert.equal(lists.activeTeam[0].statuses[0].name,'Ralenti');
  assert.equal(lists.activeTeam[0].statuses[0].remainingDuration,2);
  assert.equal(lists.activeTeam[0].abilities[0].charges,1);
  assert.equal(lists.activeTeam[0].abilities[0].cooldownRemaining,2);
  assert.equal(lists.activeTeam[1].activeInBattle,true);
  assert.equal(lists.activeTeam[1].ko,true);
  assert.equal(lists.activeTeam[1].hpLabel,'0 / 9');
  assert.equal(lists.activeTeam[1].statuses[0].stacks,3);
  assert.equal(lists.activeTeam[1].abilities[0].charges,0);
  assert.equal(lists.reserve[0].activeInBattle,false);
  assert.equal(lists.reserve[0].ko,false);
  assert.equal(lists.reserve[0].hpLabel,'21 / 25');
  assert.equal(lists.reserve[0].statuses[0].id,'focus');
  assert.equal(lists.reserve[0].abilities[0].id,'wind');
  assert.deepEqual(state,before);
}

{
  const lists=buildCaptureRosterLists({activeTeam:[{instanceId:'a1',speciesId:'capture_aquafin'}],reserve:[],battle:null});
  assert.equal(lists.activeBattleInstanceId,null);
  assert.equal(lists.activeTeam[0].activeInBattle,false);
  assert.equal(lists.activeTeam[0].hasVitals,false);
  assert.deepEqual(lists.activeTeam[0].statuses,[]);
  assert.deepEqual(lists.activeTeam[0].abilities,[]);
}

assert.equal(captureRosterListEntry({instanceId:'x'},'active'),null);
assert.equal(captureRosterListEntry({speciesId:'capture_aquafin'},'active'),null);

const presenterSource=fs.readFileSync(new URL('../src/modes/capture/ui-roster-list.js',import.meta.url),'utf8');
for(const forbidden of ['moveCaptureRosterCreature','setCaptureTeam','switchCaptureBattleCreature','setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','applyCaptureDamage','healCaptureVitals','addCaptureStatus','removeCaptureStatus','tickCaptureStatuses','collectCaptureStatusEffects','resolveCaptureStatusEffect','spendCaptureAbility','tickCaptureAbilityCooldowns','canUseCaptureAbility','Math.random(','Date.now(','../rpg/','assets/dungeon/creatures']){
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
assert.match(pageSource,/data-capture-statuses/);
assert.match(pageSource,/data-capture-status=/);
assert.match(pageSource,/capture-roster-status/);
assert.match(pageSource,/entry\.statuses\.map\(rosterStatusHtml\)/);
assert.match(pageSource,/data-capture-abilities/);
assert.match(pageSource,/data-capture-ability=/);
assert.match(pageSource,/capture-roster-ability/);
assert.match(pageSource,/entry\.abilities\.map\(rosterAbilityHtml\)/);
assert.match(pageSource,/charges/);
assert.match(pageSource,/recharge/);
assert.match(pageSource,/buildCaptureRosterLists\(session\.state,\{assetRegistry\}\)/);
assert.match(pageSource,/data-capture-roster-art/);
assert.match(pageSource,/entry\.iconArt\|\|entry\.mainArt/);
assert.match(pageSource,/api\.inspectCreature\(instanceId\)/);
assert.match(pageSource,/beginCaptureBattleSession\(session,options\)/);
assert.match(pageSource,/finishCaptureBattleSession\(session,reason\)/);
assert.match(pageSource,/renderRosterLists\(\)/);
assert.match(pageSource,/activeList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.addEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handleRosterInspectClick\)/);
assert.match(pageSource,/reserveList\.removeEventListener\('click',handleRosterInspectClick\)/);
for(const forbidden of ['moveCaptureRosterCreature(','setCaptureTeam(','applyCaptureDamage(','healCaptureVitals(','addCaptureStatus(','tickCaptureStatuses(','resolveCaptureStatusEffect(','spendCaptureAbility(','tickCaptureAbilityCooldowns(','canUseCaptureAbility(']){
  assert.equal(pageSource.includes(forbidden),false,`capture page must not include ${forbidden}`);
}

console.log('capture-ui-roster-list.test.mjs: ok');
