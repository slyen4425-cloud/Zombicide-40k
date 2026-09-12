import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  createCaptureModeState,
  executeCapturePlayerAbility,
  startCaptureBattle,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalPlayerAbilityAction,true);
assert.equal(typeof executeCapturePlayerAbility,'function');

const abilityDef={
  id:'ember',
  name:'Braise',
  chargeMax:2,
  cooldown:3,
  range:2,
  effect:{type:'damage',amount:5},
};
const player={
  instanceId:'p1',
  speciesId:'capture_braiseau',
  currentHp:20,
  maxHp:20,
  abilityState:{ember:{charges:2,chargeMax:2,cooldownRemaining:0,cost:null}},
};
let state=createCaptureModeState({activeTeam:[player],roster:[structuredClone(player)]});
state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
const started=startCaptureBattle(state,{
  opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:12,maxHp:12},
  opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
});
assert.equal(started.ok,true);

const used=executeCapturePlayerAbility(started.state,{abilityDef});
assert.equal(used.ok,true);
assert.equal(used.state.battle.opponent.vitals.currentHp,7);
assert.equal(used.state.activeTeam[0].abilityState.ember.charges,1);
assert.equal(used.state.activeTeam[0].abilityState.ember.cooldownRemaining,3);
assert.equal(used.state.roster[0].abilityState.ember.charges,1);

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/abilityDefs=\[\]/);
assert.match(pageSource,/abilityDefIndex=new Map/);
assert.match(pageSource,/data-capture-use-ability/);
assert.match(pageSource,/>Utiliser<\/button>/);
assert.match(pageSource,/executeCapturePlayerAbility\(session\.state,\{abilityDef\}\)/);
assert.match(pageSource,/battleActive&&entry\.location==='active'&&entry\.activeInBattle&&!entry\.ko/);
assert.match(pageSource,/blockedByCooldown/);
assert.match(pageSource,/blockedByCharges/);
assert.match(pageSource,/activeList\.addEventListener\('click',handleRosterAbilityClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handleRosterAbilityClick\)/);
assert.equal(pageSource.includes("reserveList.addEventListener('click',handleRosterAbilityClick)"),false);
assert.equal(pageSource.includes('useCaptureBattleAbility('),false);
assert.equal(pageSource.includes('initializeCreatureAbilityState('),false);
assert.equal(pageSource.includes('Math.random('),false);
assert.equal(pageSource.includes('../rpg/'),false);

console.log('capture-ui-player-ability-action.test.mjs: ok');
