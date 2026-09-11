import assert from 'node:assert/strict';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { createAllyRoster, createAllyRuntime, addAlly } from '../src/modes/rpg/ally-engine.js';
import { placeAlly, moveAlly, alliesNearEngager, buildAllyCombatants, syncAlliesFromCombat, finishAllyTurn, finishAllyCombat } from '../src/modes/rpg/ally-runtime.js';
import { createCombatState, markCombatantKo } from '../src/modes/rpg/combat-engine.js';

const definitions={
  stats:[{id:'move',name:'Mouvement',baseValue:3}],resources:[],skills:[],heroes:[],bestiary:[],
};
const mercDef={id:'merc',name:'Mercenaire',kind:'mercenary',sourceKind:'custom',controlMode:'player',statValues:{move:3},duration:{kind:'persistent'}};
const summonDef={id:'wolf',name:'Loup spectral',kind:'summon',sourceKind:'custom',controlMode:'player',ownerRequired:true,metadata:{ownerSelector:'hero'},statValues:{move:4},duration:{kind:'turns',value:2}};
const farDef={id:'escort',name:'Prisonnier',kind:'escort',sourceKind:'custom',controlMode:'ai',canJoinCombat:true,statValues:{move:2},duration:{kind:'combat',value:1}};

let roster=createAllyRoster();
let created=createAllyRuntime(mercDef,definitions,{instanceId:'merc-1',roomId:'room-a',x:0,y:0});
roster=addAlly(roster,created.runtime).roster;
created=createAllyRuntime(summonDef,definitions,{instanceId:'wolf-1',ownerActorId:'aldren',roomId:'room-a',x:1,y:0});
roster=addAlly(roster,created.runtime).roster;
created=createAllyRuntime(farDef,definitions,{instanceId:'escort-1',roomId:'room-a',x:8,y:8});
roster=addAlly(roster,created.runtime).roster;

let spatial=createSpatialState({zoneId:'room-a'});
spatial=setActorPosition(spatial,'aldren',{x:0,y:0,zoneId:'room-a'});
({roster,spatial}=placeAlly(roster,spatial,'merc-1',{x:0,y:1,zoneId:'room-a'}));
({roster,spatial}=placeAlly(roster,spatial,'wolf-1',{x:2,y:0,zoneId:'room-a'}));
({roster,spatial}=placeAlly(roster,spatial,'escort-1',{x:8,y:8,zoneId:'room-a'}));

let moved=moveAlly(roster,spatial,'wolf-1',{x:4,y:0,zoneId:'room-a'},{movementStatId:'move',defaultMovement:3});
assert.equal(moved.ok,true);
assert.equal(moved.distance,2);
roster=moved.roster; spatial=moved.spatial;

const nearby=alliesNearEngager(roster,spatial,'aldren',{combatAssistRange:3,requireSameZone:true});
assert.deepEqual(nearby.map(x=>x.instanceId),['merc-1']);

const combatants=buildAllyCombatants(roster,spatial,'aldren',{spatialConfig:{combatAssistRange:5,requireSameZone:true},initiativeResolver:r=>r.kind==='summon'?12:8});
assert.deepEqual(combatants.map(x=>x.id),['merc-1','wolf-1']);
assert.equal(combatants[1].initiative,12);
assert.equal(combatants[1].ownerActorId,'aldren');

let combat=createCombatState({combatants:[{id:'aldren',side:'heroes',initiative:15,state:{stats:{},resources:{}}},...combatants,{id:'orc',side:'enemies',initiative:5,state:{stats:{},resources:{}}}]});
assert.equal(combat.actors['wolf-1'].allyKind,'summon');
assert.equal(combat.actors['wolf-1'].controlMode,'player');
assert.equal(combat.actors['wolf-1'].ownerActorId,'aldren');
combat=markCombatantKo(combat,'wolf-1',true);
roster=syncAlliesFromCombat(roster,combat);
assert.equal(roster.actors['wolf-1'].actor.ko,true);
assert.equal(roster.actors['wolf-1'].actor.active,false);

let tick=finishAllyTurn(roster);
assert.equal(tick.roster.actors['wolf-1'].remaining,1);
tick=finishAllyTurn(tick.roster);
assert.equal(tick.roster.actors['wolf-1'].expired,true);

let combatEnd=finishAllyCombat(tick.roster);
assert.equal(combatEnd.roster.actors['escort-1'].expired,true);
assert.deepEqual(combatEnd.expiredInstanceIds,['escort-1']);
console.log('rpg ally runtime ok');
