import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT,
  buildCaptureOpponentInspection,
  buildCaptureOpponentSummary,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalUiOpponentSummary,true);
assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalUiOpponentInspection,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeBattleOpponent,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeVitals,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeStatuses,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativePosition,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.exposesInspectionTarget,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.isolatedFromRpg,true);

const activeState={
  battle:{
    status:'active',
    mode:'wild',
    encounter:{speciesId:'capture_descendre'},
    opponent:{
      activeInstanceId:'wild:capture_descendre',
      actorId:'opponent:wild:capture_descendre',
      creature:{instanceId:'wild:capture_descendre',speciesId:'capture_descendre',wild:true},
      vitals:{currentHp:7,maxHp:20,ko:false},
      statuses:[
        {id:'slow',name:'Ralenti',stacks:2,remainingDuration:3,effects:[{type:'damage',amount:99}]},
        {id:'marked',name:'Marqué'},
      ],
    },
    spatial:{positions:{'opponent:wild:capture_descendre':{x:4,y:2,zoneId:'capture-battle'}}},
  },
};

{
  const before=structuredClone(activeState);
  assert.deepEqual(buildCaptureOpponentSummary(activeState),{
    instanceId:'wild:capture_descendre',
    speciesId:'capture_descendre',
    title:'capture_descendre',
    wild:true,
    currentHp:7,
    maxHp:20,
    hpLabel:'7 / 20',
    ko:false,
    statuses:[
      {id:'slow',name:'Ralenti',stacks:2,remainingDuration:3},
      {id:'marked',name:'Marqué',stacks:null,remainingDuration:null},
    ],
    position:{x:4,y:2,zoneId:'capture-battle'},
  });
  assert.deepEqual(activeState,before);
}

{
  const before=structuredClone(activeState);
  const inspection=buildCaptureOpponentInspection(activeState,{speciesDef:{name:'Descendre',elements:['Feu','Vent']}});
  assert.equal(inspection.ok,true);
  assert.equal(inspection.kind,'opponent-inspection');
  assert.equal(inspection.title,'Descendre');
  assert.equal(inspection.message,'Adversaire sauvage');
  assert.deepEqual(inspection.fields,[
    {id:'species',label:'Espèce',value:'Descendre'},
    {id:'instance',label:'Instance',value:'wild:capture_descendre'},
    {id:'hp',label:'PV',value:'7 / 20'},
    {id:'statuses',label:'Statuts',value:'Ralenti ×2 · reste 3 ; Marqué'},
    {id:'position',label:'Position',value:'4, 2'},
    {id:'elements',label:'Éléments',value:'Feu, Vent'},
  ]);
  assert.deepEqual(activeState,before);
}

{
  const state={
    battle:{status:'active',mode:'battle',opponent:{activeInstanceId:'enemy-1',creature:{speciesId:'capture_rocorne'},vitals:{currentHp:0,maxHp:12,ko:true},statuses:[]},spatial:{positions:{}}},
  };
  const summary=buildCaptureOpponentSummary(state);
  assert.equal(summary.wild,false);
  assert.equal(summary.ko,true);
  assert.equal(summary.hpLabel,'0 / 12');
  assert.equal(summary.position,null);
  const inspection=buildCaptureOpponentInspection(state);
  assert.equal(inspection.message,'Adversaire actif');
  assert.equal(inspection.fields.some(field=>field.id==='ko'&&field.value==='KO'),true);
}

assert.equal(buildCaptureOpponentSummary({battle:null}),null);
assert.equal(buildCaptureOpponentSummary({battle:{status:'ended',opponent:{}}}),null);
assert.equal(buildCaptureOpponentInspection({battle:null}).reason,'capture-opponent-inspection-unavailable');

const presenterSource=fs.readFileSync(new URL('../src/modes/capture/ui-opponent-summary.js',import.meta.url),'utf8');
for(const forbidden of ['moveCaptureBattleCreature','switchCaptureBattleCreature','useCaptureBattleAbility','runCaptureAiStep','attemptCaptureInBattle','applyCaptureDamage','healCaptureVitals','advanceCaptureTime','advanceCaptureDriver','Math.random(','Date.now(']){
  assert.equal(presenterSource.includes(forbidden),false,`opponent summary presenter must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-opponent-section/);
assert.match(pageSource,/data-capture-opponent-summary/);
assert.match(pageSource,/data-capture-opponent-hp/);
assert.match(pageSource,/data-capture-opponent-position/);
assert.match(pageSource,/data-capture-opponent-statuses/);
assert.match(pageSource,/data-capture-inspect-opponent/);
assert.match(pageSource,/buildCaptureOpponentSummary\(session\.state\)/);
assert.match(pageSource,/buildCaptureOpponentInspection\(session\.state/);
assert.match(pageSource,/api\.inspectOpponent\(\)/);
assert.match(pageSource,/renderOpponentSummary\(\)/);
assert.match(pageSource,/opponentSummaryNode\.addEventListener\('click',handleOpponentInspectClick\)/);
assert.match(pageSource,/opponentSummaryNode\.removeEventListener\('click',handleOpponentInspectClick\)/);
for(const forbidden of ['moveCaptureBattleCreature(','switchCaptureBattleCreature(','useCaptureBattleAbility(','runCaptureAiStep(','attemptCaptureInBattle(']){
  assert.equal(pageSource.includes(forbidden),false,`capture page must not include ${forbidden}`);
}

console.log('capture-ui-opponent-summary.test.mjs: ok');
