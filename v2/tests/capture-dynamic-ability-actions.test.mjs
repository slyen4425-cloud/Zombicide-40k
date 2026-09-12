import assert from 'node:assert/strict';
import {
  createCaptureBattleState,
  moveCaptureBattleActor,
  resolveCaptureAbilityAction,
} from '../src/modes/capture/dynamic-combat.js';
import {
  initializeCreatureAbilityState,
} from '../src/modes/capture/abilities.js';

const team=[{
  instanceId:'owned-1',
  speciesId:'capture_braiseau',
  abilityIds:['ember'],
}];
const abilityDefs=[{
  id:'ember',
  name:'Braise',
  chargeMax:2,
  cooldown:3,
  range:2,
  effect:{type:'damage',power:7},
}];
let abilityState=initializeCreatureAbilityState(team[0],abilityDefs);
assert.equal(abilityState.ember.charges,2);

let battle=createCaptureBattleState({
  encounter:{type:'wild',speciesId:'capture_aquafin'},
  activeTeam:team,
  playerPosition:{x:0,y:0,zoneId:'capture-battle'},
  opponentPosition:{x:3,y:0,zoneId:'capture-battle'},
});

const outOfRange=resolveCaptureAbilityAction({
  battle,
  abilityDef:abilityDefs[0],
  abilityState,
  effectResolver:()=>({ok:true,outcome:{damage:7}}),
});
assert.equal(outOfRange.ok,false);
assert.equal(outOfRange.reason,'capture-target-out-of-range');
assert.equal(outOfRange.distance,3);
assert.equal(outOfRange.abilityState.ember.charges,2);
assert.equal(battle.actionLog.length,0);

const moved=moveCaptureBattleActor(battle,'player',{x:1,y:0,zoneId:'capture-battle'},{movement:3});
assert.equal(moved.ok,true);
battle=moved.battle;

const resolved=resolveCaptureAbilityAction({
  battle,
  abilityDef:abilityDefs[0],
  abilityState,
  effectResolver:({action,ability})=>({
    ok:true,
    outcome:{kind:'configured_damage',damage:ability.effect.power,abilityId:action.abilityId},
  }),
});
assert.equal(resolved.ok,true);
assert.equal(resolved.abilityState.ember.charges,1);
assert.equal(resolved.abilityState.ember.cooldownRemaining,3);
assert.equal(resolved.action.resolved,true);
assert.deepEqual(resolved.action.outcome,{kind:'configured_damage',damage:7,abilityId:'ember'});
assert.equal(resolved.battle.actionLog.length,1);
assert.equal(resolved.battle.actionLog[0].abilityId,'ember');

const cooldownBlocked=resolveCaptureAbilityAction({
  battle:resolved.battle,
  abilityDef:abilityDefs[0],
  abilityState:resolved.abilityState,
});
assert.equal(cooldownBlocked.ok,false);
assert.equal(cooldownBlocked.reason,'capture_ability_cooldown');
assert.equal(cooldownBlocked.abilityState.ember.charges,1);

const defaultResolution=resolveCaptureAbilityAction({
  battle,
  abilityDef:{id:'pulse',range:3,effect:{type:'status',id:'slow'}},
  abilityState:{pulse:{charges:null,chargeMax:null,cooldownRemaining:0,cost:null}},
});
assert.equal(defaultResolution.ok,true);
assert.deepEqual(defaultResolution.action.outcome,{type:'declared_effect',effect:{type:'status',id:'slow'}});

const src=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/modes/capture/dynamic-combat.js',import.meta.url),'utf8'));
assert.equal(src.includes("modes/rpg"),false);
assert.equal(src.includes('turnSequence'),false);
assert.equal(src.includes('d100'),false);

console.log('capture-dynamic-ability-actions.test.mjs: ok');
