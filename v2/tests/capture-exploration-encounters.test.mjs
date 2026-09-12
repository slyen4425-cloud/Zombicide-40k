import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  createCaptureBiome,
  buildCaptureBiomeIndex,
  validateCaptureBiomeSpecies,
  rollCaptureWildEncounter,
  biomeForCaptureRoom,
} from '../src/modes/capture/encounters.js';
import {
  createCaptureModeState,
  createCaptureWorldIndex,
  enterCaptureRoom,
  clearCaptureEncounter,
  captureStorageKeys,
} from '../src/modes/capture/capture.js';

const root=path.resolve(import.meta.dirname,'..');
const canonical=JSON.parse(fs.readFileSync(path.join(root,'docs','capture-creature-canonicalization.json'),'utf8'));
const captureSource=fs.readFileSync(path.join(root,'src','modes','capture','capture.js'),'utf8');
const encounterSource=fs.readFileSync(path.join(root,'src','modes','capture','encounters.js'),'utf8');

const marsh=createCaptureBiome({
  id:'marsh',
  name:'Marais',
  tags:['wet'],
  elementTags:['water','earth'],
  encounters:[
    {speciesId:'capture_aquafin',spawnPercent:40,rarity:'common'},
    {speciesId:'capture_maremachoire',spawnPercent:10,rarity:'rare'},
  ],
});
assert.equal(marsh.encounters.length,2);
assert.deepEqual(marsh.elementTags,['water','earth']);
assert.throws(()=>createCaptureBiome({id:'bad',encounters:[{speciesId:'capture_aquafin',spawnPercent:80},{speciesId:'capture_braiseau',spawnPercent:30}]}),/capture-biome-spawn-total-over-100/);

const biomeIndex=buildCaptureBiomeIndex([marsh]);
assert.equal(biomeIndex.marsh.name,'Marais');
assert.throws(()=>buildCaptureBiomeIndex([marsh,marsh]),/capture-duplicate-biome-id/);

const valid=validateCaptureBiomeSpecies([marsh],canonical);
assert.equal(valid.valid,true);
const invalid=validateCaptureBiomeSpecies([{...marsh,encounters:[{speciesId:'crea_pyrolynx',spawnPercent:5}]}],canonical);
assert.equal(invalid.valid,false);
assert.equal(invalid.errors[0].code,'unknown-capture-species');

const first=rollCaptureWildEncounter({biome:marsh,rng:()=>0.10});
assert.equal(first.encounter.speciesId,'capture_aquafin');
const second=rollCaptureWildEncounter({biome:marsh,rng:()=>0.45});
assert.equal(second.encounter.speciesId,'capture_maremachoire');
const none=rollCaptureWildEncounter({biome:marsh,rng:()=>0.90});
assert.equal(none.encounter,null);
assert.equal(none.reason,'no-encounter');

const {index,validation}=createCaptureWorldIndex({
  world:{id:'capture-world',name:'Monde Capture',startRoomId:'room-marsh',zones:['zone-a']},
  zones:[{id:'zone-a',name:'Zone A',roomIds:['room-marsh','room-town']}],
  rooms:[
    {id:'room-marsh',zoneId:'zone-a',name:'Marais sauvage',metadata:{captureBiomeId:'marsh'}},
    {id:'room-town',zoneId:'zone-a',name:'Village',metadata:{}},
  ],
});
assert.equal(validation.valid,true);
assert.equal(biomeForCaptureRoom(index.rooms['room-marsh'],biomeIndex).id,'marsh');
assert.equal(biomeForCaptureRoom(index.rooms['room-town'],biomeIndex),null);

const initial=createCaptureModeState({worldIndex:index,currentRoomId:'room-town'});
assert.equal(initial.exploration.freeMovement,true);
assert.equal(initial.exploration.turnSequence,null);
assert.equal(initial.battle,null);

const entered=enterCaptureRoom(initial,'room-marsh',{biomes:[marsh],rng:()=>0.10});
assert.equal(entered.ok,true);
assert.equal(entered.reason,'wild-encounter');
assert.equal(entered.state.exploration.currentRoomId,'room-marsh');
assert.equal(entered.state.encounter.speciesId,'capture_aquafin');
assert.equal(entered.state.battle,null,'encounter does not auto-create dynamic battle yet');

const blocked=enterCaptureRoom(entered.state,'room-town',{biomes:[marsh],rng:()=>0.90});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'encounter-active');
assert.equal(blocked.state.exploration.currentRoomId,'room-marsh');

const cleared=clearCaptureEncounter(entered.state);
assert.equal(cleared.encounter,null);
const town=enterCaptureRoom(cleared,'room-town',{biomes:[marsh],rng:()=>0.10});
assert.equal(town.ok,true);
assert.equal(town.reason,'room-without-biome');
assert.equal(town.state.encounter,null);
assert.equal(town.state.exploration.currentRoomId,'room-town');

assert.ok(captureStorageKeys.biomes('abc').startsWith('gensrpg:v2:capture:'));
assert.ok(!captureSource.includes("../rpg/"));
assert.ok(!encounterSource.includes("../rpg/"));
assert.ok(!captureSource.includes('turn-runtime'));
assert.ok(!encounterSource.includes('turnSequence'));

console.log('capture-exploration-encounters.test.mjs: ok');
