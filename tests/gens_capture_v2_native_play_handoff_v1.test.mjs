import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {startAdventureExplorationV1} from '../assets/gensrpg/capture-v2/adventure-play-bridge-v1.mjs';

const ready=[{id:'crea_nat_1',name:'Grainou',level:1,
 skills:[{slot:'skill-1',state:'ready'}]}];
const game=(sessionId='session-test-01')=>createAdventureSessionV1({
 bestiaryCards:ready,starterId:'crea_nat_1',rules:DEFAULT_ADVENTURE_RULES_V1,
 ids:{sessionId,instanceId:'creature-instance-01'},now:'2026-11-03T18:00:00.000Z'
});
const world={id:'official-world-01',initialAreaId:'area-one',
 areas:[{id:'area-one',width:504,height:504,spawns:[{x:24,y:24}]}]};
function fixture(session=game()){
 let current=session,saves=0,creates=0;
 const map=new Map();
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const store={
   load:()=>current,
   save:next=>{if(next.sessionId!==current.sessionId)throw Error('wrong save');
    current=next;saves++;return next;}
 };
 const navigation={
   readExplorationPlay:(_storage,doc,options)=>map.get(options.sessionId)??null,
   createNewExplorationPlay:(_storage,doc,options)=>{
     creates++;
     const point={sessionId:options.sessionId,worldId:doc.id,currentAreaId:'area-one',x:24,y:24};
     map.set(options.sessionId,point);
     return point;
   }
 };
 return {store,storage,navigation,map,counts:()=>({creates,saves})};
}

test('a configured AdventureSession launches only real Exploration navigation, with one owner per state',()=>{
 const f=fixture();
 const result=startAdventureExplorationV1({...f,world,now:'2026-11-03T18:01:00.000Z'});
 assert.equal(result.session.status,'playing');
 assert.equal(result.session.world.mapRef,world.id);
 assert.equal(result.session.world.position,null,'GenSRPG must NOT duplicate native hero coordinates');
 assert.equal(result.navigation.sessionId,'session-test-01');
 assert.deepEqual(f.counts(),{creates:1,saves:1});
 assert.equal(result.session.party.active.speciesId,'crea_nat_1');
 assert.equal(result.session.inventory.currency,0);
 assert.equal(result.session.party.active.xp,0);
});

test('Continue reuses exact native checkpoint without creating another or resetting movement',()=>{
 const f=fixture();
 startAdventureExplorationV1({...f,world,now:'2026-11-03T18:01:00.000Z'});
 f.map.set('session-test-01',{sessionId:'session-test-01',worldId:world.id,currentAreaId:'area-one',x:132,y:154});
 const resumed=startAdventureExplorationV1({...f,world,now:'2026-11-03T18:02:00.000Z'});
 assert.deepEqual([resumed.navigation.x,resumed.navigation.y],[132,154]);
 assert.deepEqual(f.counts(),{creates:1,saves:1});
 assert.equal(resumed.session.status,'playing');
});

test('two AdventureSessions never share a native Play checkpoint',()=>{
 const first=fixture(game('session-A')),second=fixture(game('session-B'));
 const storage=first.storage;
 const navigation=first.navigation;
 const a=startAdventureExplorationV1({store:first.store,storage,navigation,world,now:'2026-11-03T18:01:00.000Z'});
 const b=startAdventureExplorationV1({store:second.store,storage,navigation,world,now:'2026-11-03T18:01:00.000Z'});
 assert.notEqual(a.navigation.sessionId,b.navigation.sessionId);
 assert.equal(first.map.size,2);
});

test('missing WorldDocument or changed world must not destroy a saved AdventureSession',()=>{
 const f=fixture();
 assert.throws(()=>startAdventureExplorationV1({...f,world:null}),/monde|World Builder/i);
 assert.equal(f.store.load().status,'configured');
 assert.equal(f.counts().creates,0);
 startAdventureExplorationV1({...f,world});
 assert.throws(()=>startAdventureExplorationV1({...f,world:{...world,id:'different'}}),/monde|incompatible/i);
 assert.equal(f.store.load().world.mapRef,world.id);
 assert.equal(f.counts().creates,1);
});

test('missing/corrupted scoped checkpoint blocks Continue without generating a demo spawn',()=>{
 const f=fixture();
 startAdventureExplorationV1({...f,world});
 f.map.delete('session-test-01');
 assert.throws(()=>startAdventureExplorationV1({...f,world}),/checkpoint|position|sauvegarde|repren/i);
 assert.equal(f.store.load().status,'playing');
 assert.equal(f.counts().creates,1);
});

test('failed Core save is retriable with original navigation checkpoint and never overwrites it',()=>{
 const f=fixture();
 let broken=true;const safeStore=f.store;
 const store={load:safeStore.load,save:next=>{if(broken)throw Error('Core Storage blocked');
  return safeStore.save(next);}};
 assert.throws(()=>startAdventureExplorationV1({...f,store,world}),/Core Storage blocked/);
 assert.equal(f.counts().creates,1);
 assert.equal(f.store.load().status,'configured');
 broken=false;
 const result=startAdventureExplorationV1({...f,store,world});
 assert.equal(result.session.status,'playing');
 assert.equal(f.counts().creates,1);
});
