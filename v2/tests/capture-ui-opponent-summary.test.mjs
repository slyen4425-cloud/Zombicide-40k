import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT,
  buildCaptureOpponentSummary,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalUiOpponentSummary,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeBattleOpponent,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeVitals,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativeStatuses,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.readsAuthoritativePosition,true);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT.isolatedFromRpg,true);

{
  const state={
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
  const before=structuredClone(state);
  assert.deepEqual(buildCaptureOpponentSummary(state),{
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
  assert.deepEqual(state,before);
}

{
  const summary=buildCaptureOpponentSummary({
    battle:{status:'active',mode:'battle',opponent:{activeInstanceId:'enemy-1',creature:{speciesId:'capture_rocorne'},vitals:{currentHp:0,maxHp:12,ko:true},statuses:[]},spatial:{positions:{}}},
  });
  assert.equal(summary.wild,false);
  assert.equal(summary.ko,true);
  assert.equal(summary.hpLabel,'0 / 12');
  assert.equal(summary.position,null);
}

assert.equal(buildCaptureOpponentSummary({battle:null}),null);
assert.equal(buildCaptureOpponentSummary({battle:{status:'ended',opponent:{}}}),null);

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
assert.match(pageSource,/buildCaptureOpponentSummary\(session\.state\)/);
assert.match(pageSource,/renderOpponentSummary\(\)/);
for(const forbidden of ['moveCaptureBattleCreature(','switchCaptureBattleCreature(','useCaptureBattleAbility(','runCaptureAiStep(','attemptCaptureInBattle(']){
  assert.equal(pageSource.includes(forbidden),false,`capture page must not include ${forbidden}`);
}

console.log('capture-ui-opponent-summary.test.mjs: ok');
