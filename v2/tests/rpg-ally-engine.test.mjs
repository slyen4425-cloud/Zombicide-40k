import assert from 'node:assert/strict';
import {createAllyDefinition,validateAllyDefinition,createAllyRuntime,createAllyRoster,addAlly,canPlayerControl,controllableAllies,combatEligibleAllies,dismissAlly,tickAllyDurations} from '../src/modes/rpg/ally-engine.js';
import {createHeroDefinition} from '../src/modes/rpg/hero-engine.js';
import {createCreatureDefinition} from '../src/modes/rpg/bestiary-engine.js';

const stats=[{id:'force',name:'Force',baseValue:3,min:0,max:20}];
const resources=[{id:'pv',name:'PV',min:0,maxFormula:{kind:'fixed',value:10}}];
const skills=[{id:'slash',name:'Taillade',enabled:true},{id:'bite',name:'Morsure',enabled:true}];
const heroes=[createHeroDefinition({id:'merc-template',name:'Rurik',statValues:{force:6},resourceValues:{pv:10},skillIds:['slash']})];
const bestiary=[createCreatureDefinition({id:'wolf',name:'Loup spectral',statValues:{force:4},resourceValues:{pv:8},skillIds:['bite']})];
const definitions={stats,resources,skills,heroes,bestiary};

const merc=createAllyDefinition({
  id:'merc-rurik',name:'Rurik le mercenaire',kind:'mercenary',sourceKind:'hero',sourceId:'merc-template',
  controlMode:'player',canJoinCombat:true,followOwner:true,duration:{kind:'persistent'},metadata:{contract:'paid'}
});
assert.equal(validateAllyDefinition(merc,definitions).valid,true);
let made=createAllyRuntime(merc,definitions,{instanceId:'merc-1',roomId:'roomA'});
assert.equal(made.ok,true);
assert.equal(made.runtime.kind,'mercenary');
assert.equal(made.runtime.actor.state.stats.force,6);
assert.equal(canPlayerControl(made.runtime,{playerActorIds:['aldren']}).ok,true);
let roster=createAllyRoster();
let added=addAlly(roster,made.runtime); assert.equal(added.ok,true); roster=added.roster;
assert.equal(addAlly(roster,made.runtime).reason,'duplicate-instance');

const summon=createAllyDefinition({
  id:'summon-wolf',name:'Loup invoqué',kind:'summon',sourceKind:'creature',sourceId:'wolf',
  controlMode:'player',ownerRequired:true,canJoinCombat:true,followOwner:true,dismissible:true,
  duration:{kind:'turns',value:3},metadata:{ownerSelector:'caster'}
});
assert.equal(validateAllyDefinition(summon,definitions).valid,true);
assert.equal(createAllyRuntime(summon,definitions,{instanceId:'wolf-1'}).reason,'owner-required');
made=createAllyRuntime(summon,definitions,{instanceId:'wolf-1',ownerActorId:'aldren',roomId:'roomA',x:2,y:1});
assert.equal(made.ok,true);
assert.equal(made.runtime.actor.creatureId,'wolf');
assert.equal(made.runtime.remaining,3);
assert.equal(canPlayerControl(made.runtime,{playerActorIds:['lyra']}).reason,'not-owner');
assert.equal(canPlayerControl(made.runtime,{playerActorIds:['aldren']}).ok,true);
added=addAlly(roster,made.runtime); roster=added.roster;
assert.equal(controllableAllies(roster,{playerActorIds:['aldren']}).length,2);
assert.equal(combatEligibleAllies(roster,{roomId:'roomA'}).length,2);

const escort=createAllyDefinition({id:'escort',name:'Prisonnier',kind:'escort',sourceKind:'custom',controlMode:'ai',canJoinCombat:false,followOwner:true,statValues:{force:1},resourceValues:{pv:5},duration:{kind:'room',value:1}});
assert.equal(validateAllyDefinition(escort,definitions).valid,true);
made=createAllyRuntime(escort,definitions,{instanceId:'escort-1',roomId:'roomA'}); added=addAlly(roster,made.runtime); roster=added.roster;
assert.equal(canPlayerControl(made.runtime).reason,'ai-controlled');
assert.equal(combatEligibleAllies(roster,{roomId:'roomA'}).length,2);

let tick=tickAllyDurations(roster,'turns',2); roster=tick.roster; assert.equal(roster.actors['wolf-1'].remaining,1); assert.deepEqual(tick.expiredInstanceIds,[]);
tick=tickAllyDurations(roster,'turns',1); roster=tick.roster; assert.deepEqual(tick.expiredInstanceIds,['wolf-1']); assert.equal(roster.actors['wolf-1'].active,false);
assert.equal(combatEligibleAllies(roster,{roomId:'roomA'}).length,1);

const dismissed=dismissAlly(roster,'merc-1'); assert.equal(dismissed.ok,true); roster=dismissed.roster; assert.equal(roster.actors['merc-1'].dismissed,true);

const broken=createAllyDefinition({id:'broken',name:'Cassé',sourceKind:'creature',sourceId:'ghost'});
const check=validateAllyDefinition(broken,definitions); assert.equal(check.valid,false); assert.equal(check.errors.some(e=>e.code==='missing-creature'),true);
console.log('rpg ally engine ok');
