import assert from 'node:assert/strict';
import { createSpatialState,setActorPosition,getActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { createAllyRoster,addAlly } from '../src/modes/rpg/ally-engine.js';
import { transitionAlliesWithOwner,transitionIndependentAllies,finishRoomForAllies,removeExpiredAlliesFromSpatial,alliesInRoom } from '../src/modes/rpg/ally-room-runtime.js';

let roster=createAllyRoster();
const merc={instanceId:'merc-1',kind:'mercenary',ownerActorId:'aldren',followOwner:true,active:true,dismissed:false,expired:false,roomId:'room-a',x:1,y:1,durationKind:'persistent',remaining:null};
const summon={instanceId:'wolf-1',kind:'summon',ownerActorId:'aldren',followOwner:true,active:true,dismissed:false,expired:false,roomId:'room-a',x:2,y:1,durationKind:'room',remaining:1};
const escort={instanceId:'escort-1',kind:'escort',ownerActorId:null,followOwner:false,active:true,dismissed:false,expired:false,roomId:'room-a',x:0,y:0,durationKind:'persistent',remaining:null};
roster=addAlly(roster,merc).roster; roster=addAlly(roster,summon).roster; roster=addAlly(roster,escort).roster;
let spatial=createSpatialState({zoneId:'room-a'});
for(const ally of [merc,summon,escort]) spatial=setActorPosition(spatial,ally.instanceId,{x:ally.x,y:ally.y,zoneId:'room-a'});

let moved=transitionAlliesWithOwner(roster,spatial,{ownerActorId:'aldren',fromRoomId:'room-a',toRoomId:'room-b',entryPosition:{x:0,y:3}});
assert.deepEqual(moved.movedInstanceIds.sort(),['merc-1','wolf-1']);
assert.equal(moved.roster.actors['escort-1'].roomId,'room-a');
assert.equal(moved.roster.actors['merc-1'].roomId,'room-b');
assert.deepEqual(getActorPosition(moved.spatial,'merc-1'),{x:0,y:3,zoneId:'room-b'});
assert.deepEqual(alliesInRoom(moved.roster,'room-b').map(x=>x.instanceId).sort(),['merc-1','wolf-1']);

const independent=transitionIndependentAllies(moved.roster,{fromRoomId:'room-a',toRoomId:'room-b',instanceIds:['escort-1']});
assert.equal(independent.roster.actors['escort-1'].roomId,'room-b');
assert.equal(independent.roster.actors['escort-1'].x,null);

const expired=finishRoomForAllies(moved.roster,'room-b');
assert.equal(expired.roster.actors['wolf-1'].expired,true);
assert.equal(expired.roster.actors['merc-1'].expired,false);
const cleaned=removeExpiredAlliesFromSpatial(expired.roster,moved.spatial);
assert.equal(getActorPosition(cleaned.spatial,'wolf-1'),null);
assert.ok(cleaned.removedInstanceIds.includes('wolf-1'));

console.log('rpg ally room runtime ok');
