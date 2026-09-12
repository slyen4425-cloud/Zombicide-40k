import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_CREATURE_INSPECTION_CONTRACT,
  buildCaptureCreatureInspection,
} from '../src/modes/capture/runtime.js';

const assetRegistry=JSON.parse(fs.readFileSync(new URL('../docs/capture-creature-assets.json',import.meta.url),'utf8'));

assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeCreatureData,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeVitals,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeStatuses,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeAbilityState,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsAuthoritativeReactionState,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.readsCanonicalCaptureAssetRegistry,true);
assert.equal(CAPTURE_CREATURE_INSPECTION_CONTRACT.neverUsesRpgOrDungeonFallback,true);
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
    abilityState:{
      braise:{charges:2,chargeMax:4,cooldownRemaining:1,cost:1},
      pique:{charges:1,chargeMax:1,cooldownRemaining:0},
    },
    statuses:[
      {id:'burn',name:'Brûlure',stacks:2,remainingDuration:3,effects:[{type:'damage',amount:99}]},
      {id:'focus',name:'Concentration'},
    ],
    reactionState:{
      dodge:{resource:2,cooldownRemaining:0},
      counter:{resource:0,cooldownRemaining:3},
    },
    metadata:{capturedFrom:'wild_battle'},
  };
  const before=structuredClone(creature);
  const result=buildCaptureCreatureInspection(creature,{speciesDef:{name:'Descendre',elements:['Feu','Vent']},assetRegistry});
  assert.equal(result.ok,true);
  assert.equal(result.kind,'creature-inspection');
  assert.equal(result.title,'Draco');
  assert.equal(result.message,'Descendre');
  assert.equal(result.metadata.instanceId,'owned-1');
  assert.equal(result.metadata.speciesId,'capture_descendre');
  assert.equal(result.metadata.ko,false);
  assert.deepEqual(result.fields,[
    {id:'species',label:'Espèce',value:'Descendre'},
    {id:'instance',label:'Instance',value:'owned-1'},
    {id:'level',label:'Niveau',value:'7'},
    {id:'hp',label:'PV',value:'18 / 25'},
    {id:'statuses',label:'Statuts actifs',value:'Brûlure ×2 · reste 3 · Concentration'},
    {id:'abilities',label:'Capacités',value:'braise · charges 2/4 · recharge 1 · pique · charges 1/1 · recharge 0'},
    {id:'reactions',label:'Réactions',value:'dodge · prête côté cooldown · ressource 2 · counter · recharge 3 · ressource 0'},
    {id:'elements',label:'Éléments',value:'Feu, Vent'},
  ]);
  assert.deepEqual(creature,before);
}

{
  const ko=buildCaptureCreatureInspection({
    instanceId:'owned-ko',
    speciesId:'capture_braiseau',
    currentHp:-3,
    maxHp:20,
    abilityCharges:{ember:3},
    reactionState:{dodge:{resource:null,cooldownRemaining:null}},
  });
  assert.equal(ko.metadata.ko,true);
  assert.deepEqual(ko.fields.filter(field=>['hp','ko','abilities','reactions'].includes(field.id)),[
    {id:'hp',label:'PV',value:'0 / 20'},
    {id:'ko',label:'État',value:'KO'},
    {id:'abilities',label:'Capacités',value:'ember · charges 3'},
    {id:'reactions',label:'Réactions',value:'dodge'},
  ]);
}

{
  const result=buildCaptureCreatureInspection({instanceId:'owned-2',speciesId:'capture_aquafin',level:1},{assetRegistry});
  assert.equal(result.ok,true);
  assert.equal(result.title,'Aquafin');
  assert.equal(result.message,'Détails de la créature');
  assert.equal(result.metadata.speciesId,'capture_aquafin');
  assert.equal(result.fields.find(field=>field.id==='species')?.value,'Aquafin');
  assert.equal(result.fields.some(field=>field.id==='hp'),false);
  assert.equal(result.fields.some(field=>field.id==='statuses'),false);
  assert.equal(result.fields.some(field=>field.id==='abilities'),false);
  assert.equal(result.fields.some(field=>field.id==='reactions'),false);
  assert.equal(result.fields.some(field=>field.id==='elements'),false);
}

{
  const legacy={instanceId:'owned-legacy',speciesId:'crea_dracendre',level:2};
  const before=structuredClone(legacy);
  const result=buildCaptureCreatureInspection(legacy,{assetRegistry});
  assert.equal(result.ok,true);
  assert.equal(result.title,'Descendre');
  assert.equal(result.fields.find(field=>field.id==='species')?.value,'Descendre');
  assert.equal(result.metadata.speciesId,'capture_descendre');
  assert.deepEqual(legacy,before);
}

{
  const noRegistry=buildCaptureCreatureInspection({instanceId:'owned-old',speciesId:'capture_aquafin',level:1});
  assert.equal(noRegistry.title,'capture_aquafin');
  assert.equal(noRegistry.metadata.speciesId,'capture_aquafin');
}

assert.equal(buildCaptureCreatureInspection(null).reason,'capture-creature-inspection-creature-missing');
assert.equal(buildCaptureCreatureInspection({instanceId:'x'}).reason,'capture-creature-inspection-identity-missing');

const source=fs.readFileSync(new URL('../src/modes/capture/creature-inspection.js',import.meta.url),'utf8');
assert.match(source,/resolveCaptureSpeciesAsset/);
for(const forbidden of ['../rpg/','../dungeon/','setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','spendCaptureAbility','tickCaptureAbilityCooldowns','canUseCaptureAbility','spendCaptureReactionState','tickCaptureReactionStateMap','canUseCaptureReactionState','resolveCaptureReaction','addCaptureStatus','removeCaptureStatus','tickCaptureStatuses','resolveCaptureStatusEffect','setInterval(','requestAnimationFrame(','Date.now(','performance.now(','Math.random(']){
  assert.equal(source.includes(forbidden),false,`creature inspection must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/speciesById=\{\}/);
assert.match(pageSource,/assetRegistry=\{\}/);
assert.match(pageSource,/data-capture-overlay-fields/);
assert.match(pageSource,/inspectCreature\(instanceId/);
assert.match(pageSource,/buildCaptureCreatureInspection\(creature,\{speciesDef:species,assetRegistry\}\)/);
assert.match(pageSource,/api\.openOverlay\(/);
assert.equal(pageSource.includes("api.setBlocking(true)"),false);

console.log('capture-creature-inspection.test.mjs: ok');
