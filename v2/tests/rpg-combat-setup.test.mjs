import assert from 'node:assert/strict';
import { createSpatialState,setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { createAllyRoster,createAllyRuntime,addAlly } from '../src/modes/rpg/ally-engine.js';
import { createCombatWithAllies } from '../src/modes/rpg/combat-setup.js';

const definitions={stats:[{id:'move',baseValue:3}],resources:[],skills:[],heroes:[],bestiary:[]};
const nearDef={id:'near',name:'Near ally',kind:'companion',sourceKind:'custom',controlMode:'player',statValues:{move:3},duration:{kind:'persistent'}};
const farDef={id:'far',name:'Far ally',kind:'companion',sourceKind:'custom',controlMode:'ai',statValues:{move:3},duration:{kind:'persistent'}};
let roster=createAllyRoster();
let created=createAllyRuntime(nearDef,definitions,{instanceId:'ally-near',roomId:'room-a',x:1,y:0});
roster=addAlly(roster,created.runtime).roster;
created=createAllyRuntime(farDef,definitions,{instanceId:'ally-far',roomId:'room-a',x:9,y:9});
roster=addAlly(roster,created.runtime).roster;

let spatial=createSpatialState({zoneId:'room-a'});
spatial=setActorPosition(spatial,'hero',{x:0,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'ally-near',{x:1,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'ally-far',{x:9,y:9,zoneId:'room-a'});

const out=createCombatWithAllies({
  combatants:[
    {id:'hero',side:'heroes',initiative:20,state:{stats:{},resources:{}}},
    {id:'enemy',side:'enemies',initiative:5,state:{stats:{},resources:{}}},
  ],
  allyRoster:roster,
  spatial,
  engagerId:'hero',
  spatialConfig:{combatAssistRange:3,requireSameZone:true},
  initiativeResolver:r=>r.instanceId==='ally-near'?12:1,
});
assert.deepEqual(out.addedAllyIds,['ally-near']);
assert.ok(out.combat.actors['ally-near']);
assert.equal(out.combat.actors['ally-far'],undefined);
assert.equal(out.combat.actors['ally-near'].controlMode,'player');
assert.equal(out.combat.actors['ally-near'].allyKind,'companion');
assert.deepEqual(out.combat.order,['hero','ally-near','enemy']);

const duplicate=createCombatWithAllies({
  combatants:[
    {id:'hero',side:'heroes',initiative:20,state:{stats:{},resources:{}}},
    {id:'ally-near',side:'heroes',initiative:99,state:{stats:{},resources:{}}},
    {id:'enemy',side:'enemies',initiative:5,state:{stats:{},resources:{}}},
  ],
  allyRoster:roster,
  spatial,
  engagerId:'hero',
  spatialConfig:{combatAssistRange:3,requireSameZone:true},
});
assert.deepEqual(duplicate.addedAllyIds,[]);
assert.equal(duplicate.combat.order.filter(id=>id==='ally-near').length,1);

console.log('rpg combat setup ok');
