import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,createAdventureSessionV1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from '../assets/gensrpg/capture-v2/adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';

const cards=[{id:'crea_nature',name:'Ami',skills:[{state:'ready'}]},{id:'crea_ice',name:'Ennemi',skills:[{state:'ready'}]}];
const sha='b'.repeat(40);
function fixture(rules=DEFAULT_ADVENTURE_RULES_V1){
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))};
 const base=createAdventureSessionV1({bestiaryCards:cards,starterId:'crea_nature',rules,
  ids:{sessionId:'game-1',instanceId:'member-1'},now:'2026-11-05T00:00:00Z'});
 const world={id:'world-1'};
 const session={...base,status:'playing',world:{mapRef:world.id,position:null}};
 const publicationGrant=writeAdventurePublishedEncounterGrantV1({
  storage,session,world,bestiaryCards:cards,combatSha:sha
 });
 return {storage,session,world,publicationGrant,combatSha:sha};
}

test('RED: game vitrine uses 25% HP for all published creatures by default, not per creature',()=>{
 assert.equal(DEFAULT_ADVENTURE_RULES_V1.combat.hpMultiplier,0.25);
 assert.equal(normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1).combat.hpMultiplier,0.25);
 const f=fixture();
 const native=writeAdventurePlayingPartyV1(f);
 assert.equal(native.combatHpMultiplier,0.25);
 assert.deepEqual(native.active,{instanceId:'member-1',speciesId:'crea_nature',level:1,hp:null});
 assert.equal(f.session.rules.combat.hpMultiplier,0.25,'one durable game policy not a species mutation');
 assert.equal(JSON.parse(f.storage.getItem('gensrpg.capture.v2.active-party.v1:game-1')).combatHpMultiplier,0.25);
});

test('RED: global game HP setting may be 100%, and older saves without combat field retain original HP',()=>{
 const custom=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,combat:{hpMultiplier:1}});
 assert.equal(writeAdventurePlayingPartyV1(fixture(custom)).combatHpMultiplier,1);
 const {combat:_removed,...historical}=DEFAULT_ADVENTURE_RULES_V1;
 const old=normalizeAdventureRulesV1(historical);
 assert.equal(old.combat.hpMultiplier,1,'no silent re-scaling of games created before policy');
 assert.throws(()=>normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,combat:{hpMultiplier:0}}),/hpMultiplier/);
 assert.throws(()=>normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,combat:{hpMultiplier:1.5}}),/hpMultiplier/);
});

test('RED: saved remaining HP is preserved exactly, never quartered again after a battle',()=>{
 const f=fixture();
 const session={...f.session,party:{active:{...f.session.party.active,level:4,hp:33.47000000000003}}};
 const projected=writeAdventurePlayingPartyV1({...f,session});
 assert.equal(projected.active.hp,33.47000000000003);
 assert.equal(projected.combatHpMultiplier,0.25);
 assert.equal(session.party.active.hp,33.47000000000003);
});

test('RED: level 250 native party grant also carries the sole editable HP policy',()=>{
 const f=fixture();
 const grown={
  ...f.session,
  rules:{...f.session.rules,progression:{...f.session.rules.progression,maxLevel:250}},
  party:{active:{...f.session.party.active,level:250,hp:33.47000000000003}}
 };
 const native=writeAdventurePlayingPartyV1({...f,session:grown});
 assert.equal(native.active.level,250);
 assert.equal(native.active.hp,33.47000000000003);
 assert.equal(native.combatHpMultiplier,0.25);
});
