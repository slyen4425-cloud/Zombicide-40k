import assert from 'node:assert/strict';
import {createCaptureBattleState,resolveCaptureAbilityAction} from '../src/modes/capture/dynamic-combat.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';
import {normalizeCaptureReaction,resolveCaptureReaction} from '../src/modes/capture/reactions.js';

const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['hit']}];
const encounter={type:'wild',speciesId:'capture_aquafin'};
const opponent={instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20};
const ability={id:'hit',range:3,chargeMax:2,cooldown:0,effect:{type:'damage',amount:7}};

{
  const reaction=normalizeCaptureReaction({id:'dodge-basic',type:'dodge'});
  assert.equal(reaction.id,'dodge-basic');
  assert.equal(reaction.negatesEffect,true);
  const unresolved=resolveCaptureReaction({battle:{},action:{},ability:{},reactionDef:reaction});
  assert.equal(unresolved.ok,true);
  assert.equal(unresolved.triggered,false);
}

{
  const battle=createCaptureBattleState({encounter,activeTeam:team,opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  const abilityState=initializeCreatureAbilityState(team[0],[ability]);
  let effectCalled=false;
  const result=resolveCaptureAbilityAction({
    battle,
    abilityDef:ability,
    abilityState,
    activeTeam:team,
    reactionDef:{id:'dodge-basic',type:'dodge',negatesEffect:true},
    reactionResolver:()=>({ok:true,triggered:true,outcome:{source:'test'}}),
    effectResolver:(args)=>{effectCalled=true;return resolveCaptureVitalEffect(args);},
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,true);
  assert.equal(effectCalled,false);
  assert.equal(result.battle.opponent.vitals.currentHp,20);
  assert.equal(result.abilityState.hit.charges,1);
  assert.equal(result.action.outcome.type,'reaction');
  assert.equal(result.action.outcome.negated,true);
}

{
  const battle=createCaptureBattleState({encounter,activeTeam:team,opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  const abilityState=initializeCreatureAbilityState(team[0],[ability]);
  const result=resolveCaptureAbilityAction({
    battle,
    abilityDef:ability,
    abilityState,
    activeTeam:team,
    reactionDef:{id:'dodge-basic',type:'dodge',negatesEffect:true},
    reactionResolver:()=>({ok:true,triggered:false}),
    effectResolver:resolveCaptureVitalEffect,
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,false);
  assert.equal(result.battle.opponent.vitals.currentHp,13);
  assert.equal(result.abilityState.hit.charges,1);
}

console.log('capture-reactions.test.mjs: ok');
