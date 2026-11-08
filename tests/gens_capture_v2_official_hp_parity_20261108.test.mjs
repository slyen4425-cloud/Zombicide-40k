import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureHpProjectorV1}
 from '../assets/gensrpg/capture-v2/adventure-hp-projection-v1.mjs';
import {projectCaptureEncounterOwnedStatsV1}
 from '../_site/vendor/combat-lab/src/adapters/input/capture/capture-encounter-owned-stats-v1.js';
import {projectCaptureStatEffectsV1}
 from '../_site/vendor/combat-lab/src/core/combat/capture-stat-effects-v1.js';
import {projectCaptureEncounterMaxHpV1,applyCaptureEncounterHpMultiplierV1}
 from '../_site/vendor/combat-lab/src/ui/capture-encounter-combat-source-v1.js';

const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
test('official Combat native fighter max and GenSRPG in-game card show IDENTICAL HP at any policy',()=>{
 const bundle=read('_site/vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json');
 const statRegistry=read('_site/vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json');
 const projector=createAdventureHpProjectorV1({
  creatureTransfers:bundle.creatureTransfers,statRegistry,
  projectOwnedStats:projectCaptureEncounterOwnedStatsV1,
  projectStatEffects:projectCaptureStatEffectsV1,
  projectMaxHp:projectCaptureEncounterMaxHpV1
 });
 for(const id of ['crea_ailevent','gorice','crea_crys_2']){
  const transfer=bundle.creatureTransfers.find(v=>v.draft.id===id);
  assert.ok(transfer,'missing official authored creature '+id);
  const authored=projectCaptureStatEffectsV1({registry:statRegistry,statValues:transfer.statValues});
  assert.equal(authored.hasMaxHpProjection,true);
  for(const policy of [0.25,0.4,1]){
   for(const savedHp of [null,0,46]){
    const projected=projector({actor:{speciesId:id,hp:savedHp,
     statAllocations:{}},hpMultiplier:policy});
    const actual=applyCaptureEncounterHpMultiplierV1({
     fighters:[{maxHp:authored.maxHp}],fighterConfigs:{test:{maxHp:authored.maxHp}}
    },policy);
    assert.equal(projected.maxHp,actual.fighters[0].maxHp,
     'the in-game card must agree with the true Combat fighter for '+id);
    assert.equal(projected.labMaxHp,authored.maxHp);
    assert.equal(projected.currentHp,savedHp===null?projected.maxHp:
     Math.min(savedHp,projected.maxHp));
   }
  }
 }
});
test('stat allocation is applied by official Combat BEFORE HP percentage, with no authored transfer edit',()=>{
 const bundle=read('_site/vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json');
 const statRegistry=read('_site/vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json');
 const projector=createAdventureHpProjectorV1({creatureTransfers:bundle.creatureTransfers,
  statRegistry,projectOwnedStats:projectCaptureEncounterOwnedStatsV1,
  projectStatEffects:projectCaptureStatEffectsV1,projectMaxHp:projectCaptureEncounterMaxHpV1});
 const id='crea_ailevent',transfer=bundle.creatureTransfers.find(v=>v.draft.id===id);
 const before=JSON.stringify(transfer);
 const noBonus=projector({actor:{speciesId:id,hp:null,statAllocations:{}},hpMultiplier:.25});
 const withBonus=projector({actor:{speciesId:id,hp:null,statAllocations:{health:5}},hpMultiplier:.25});
 assert.equal(withBonus.baseMaxHp,noBonus.baseMaxHp+5);
 assert.equal(withBonus.labMaxHp,noBonus.labMaxHp);
 assert.equal(withBonus.maxHp,projectCaptureEncounterMaxHpV1(noBonus.baseMaxHp+5,.25));
 assert.equal(JSON.stringify(transfer),before);
});
