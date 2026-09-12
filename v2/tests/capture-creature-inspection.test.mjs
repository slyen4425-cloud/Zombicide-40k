import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_CREATURE_INSPECTION_CONTRACT,
  buildCaptureCreatureInspection,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeCreatureData,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.derivesGameplayRules,false);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.supportsOptionalSpeciesData,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.isolatedFromRpg,true);

{
  const creature={
    instanceId:'owned-1',
    speciesId:'capture_descendre',
    nickname:'Draco',
    level:7,
    currentHp:18,
    maxHp:25,
    abilityCharges:{braise:2,pique:1},
    statuses:[{id:'burn'}],
    metadata:{capturedFrom:'wild_battle'},
  };
  const before=structuredClone(creature);
  const result=buildCaptureCreatureInspection(creature,{speciesDef:{name:'Descendre',elements:['Feu','Vent']}});
  assert.equal(result.ok,true);
  assert.equal(result.kind,'creature-inspection');
  assert.equal(result.title,'Draco');
  assert.equal(result.message,'Descendre');
  assert.equal(result.metadata.instanceId,'owned-1');
  assert.equal(result.metadata.speciesId,'capture_descendre');
  assert.deepEqual(result.fields,[
    {id:'species',label:'Espèce',value:'Descendre'},
    {id:'instance',label:'Instance',value:'owned-1'},
    {id:'level',label:'Niveau',value:'7'},
    {id:'hp',label:'PV',value:'18 / 25'},
    {id:'abilityCharges',label:'Capacités suivies',value:'2'},
    {id:'statuses',label:'Statuts actifs',value:'1'},
    {id:'elements',label:'Éléments',value:'Feu, Vent'},
  ]);
  assert.deepEqual(creature,before);
}

{
  const result=buildCaptureCreatureInspection({instanceId:'owned-2',speciesId:'capture_aquafin',level:1});
  assert.equal(result.ok,true);
  assert.equal(result.title,'capture_aquafin');
  assert.equal(result.message,'Détails de la créature');
  assert.equal(result.fields.some(field=>field.id==='hp'),false);
  assert.equal(result.fields.some(field=>field.id==='elements'),false);
}

assert.equal(buildCaptureCreatureInspection(null).reason,'capture-creature-inspection-creature-missing');
assert.equal(buildCaptureCreatureInspection({instanceId:'x'}).reason,'capture-creature-inspection-identity-missing');

const source=fs.readFileSync(new URL('../src/modes/capture/creature-inspection.js',import.meta.url),'utf8');
for(const forbidden of ['setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','setInterval(','requestAnimationFrame(','Date.now(','performance.now(','Math.random(']){
  assert.equal(source.includes(forbidden),false,`creature inspection must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/speciesById=\{\}/);
assert.match(pageSource,/data-capture-overlay-fields/);
assert.match(pageSource,/inspectCreature\(instanceId/);
assert.match(pageSource,/buildCaptureCreatureInspection\(creature/);
assert.match(pageSource,/api\.openOverlay\(/);
assert.equal(pageSource.includes("api.setBlocking(true)"),false);

console.log('capture-creature-inspection.test.mjs: ok');
