'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const equipped=read('assets/gensrpg/core/inventory-equipped-view-v1.js');
const bonusSets=read('assets/gensrpg/core/equipment-bonus-sets-v1.js');
const evolution=read('assets/gensrpg/core/equipment-evolution-v1.js');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');
const ui=read('assets/dungeon/dungeon-equipment-ui.js');
const setEditor=read('assets/dungeon/dungeon-set-editor-167818.js');
const heroEditor=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
const preaudit=read('docs/GENSRPG_PHASE4_INVENTORY_EQUIPMENT_SETS_PREAUDIT.md');

function ordered(source,names,label){
  let last=-1;
  for(const name of names){
    const pos=source.indexOf(name);
    assert.ok(pos>=0,label+': missing '+name);
    assert.ok(pos>last,label+': wrong order around '+name);
    last=pos;
  }
}

for(const [source,label] of [[pages,'Pages'],[preview,'preview']]){
  ordered(source,[
    'assets/gensrpg/core/inventory-equipped-view-v1.js',
    'assets/gensrpg/core/equipment-bonus-sets-v1.js',
    'assets/gensrpg/core/equipment-evolution-v1.js',
    'assets/dungeon/dungeon-equipment-hotfix-167817.js'
  ],label+' Inventory/Equipment Core load order');
}

assert.match(equipped,/function equippedItems\(/);
assert.match(equipped,/function reindexRefsAfterRemoval\(/);
assert.match(equipped,/ROOT\.GensInventoryEquippedViewV1=Object\.freeze/);

assert.match(bonusSets,/function directBonus\(/);
assert.match(bonusSets,/function setState\(/);
assert.match(bonusSets,/function totalBonus\(/);
assert.match(bonusSets,/ROOT\.GensEquipmentBonusSetsV1=Object\.freeze/);

assert.match(evolution,/function itemBonus\(/);
assert.match(evolution,/function totalBonus\(/);
assert.match(evolution,/ROOT\.GensEquipmentEvolutionV1=Object\.freeze/);

assert.match(hotfix,/const equippedView=ROOT\.GensInventoryEquippedViewV1/);
assert.match(hotfix,/equippedView\.equippedItems\(/);

assert.match(cleanup,/core=R\.GensEquipmentBonusSetsV1/);
assert.match(cleanup,/core\.totalBonus\(items,key,R\.DUNGEON_EQUIPMENT_SETS\|\|\{\}\)/);
assert.match(cleanup,/core=R\.GensEquipmentEvolutionV1/);
assert.match(cleanup,/core\.totalBonus\(equippedItemsCached\(\),key,xp\)/);

const evolutionHelperRefs=(cleanup.match(/evolutionBonusForItem/g)||[]).length;
assert.equal(evolutionHelperRefs,2,
  'local evolution helper may remain defined/exported but must not be used by the active cache path');

assert.match(perf,/function isEquipmentInvalidator\(name\)\{return name==="save"\|\|name==="dc214Equip"\|\|name==="removeInventoryEntry"\}/);
assert.match(perf,/GensEquipmentStatCleanup1678102\?\.invalidateEquipmentBonusCache/);

assert.ok(!ui.includes('fallbackSetStates('),
  'local Equipment UI set-state fallback must stay retired');
assert.match(ui,/function setStates\(items=equippedItems\(\)\)/);
assert.match(ui,/ROOT\.dungeonSetStateFromItems316/);

assert.match(heroEditor,/function hasWrapFlag\(fn,flag\)/);
assert.match(heroEditor,/hasWrapFlag\(old,flag\)/);

assert.match(preaudit,/stockage et UI restent hors du premier micro-lot Core/i);
assert.match(preaudit,/UI\/Builders séparés/i);

assert.match(ui,/new ROOT\.MutationObserver/);
assert.match(ui,/DOC\.addEventListener\?\.\("change"/);
assert.match(setEditor,/ROOT\.saveEquipmentEditor/);
assert.match(cleanup,/function persistSetRaw\(/);

assert.ok(!/assets\/gensrpg\/core\/.*dice/i.test(pages),
  'Dice Core must not already be silently introduced before its own preaudit');

assert.match(
  roadmap,
  /4\. inventaire\/équipement\/sets ;[\s\S]*5\. dés ;/i,
  'roadmap order must remain Inventory/Equipment/Sets then Dice'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Inventory Equipment exit audit',
  coreContracts:[
    'inventory-equipped-view-v1',
    'equipment-bonus-sets-v1',
    'equipment-evolution-v1'
  ],
  activeRuntimeDelegation:{
    equippedView:'Core',
    directAndSetBonus:'Core',
    evolutionOnCacheMiss:'Core',
    cacheInvalidation:'canonical performance boundaries'
  },
  retiredDuplicate:'Equipment UI local set-state fallback',
  remainingDebtClass:[
    'Builders/UI MutationObserver and document listeners',
    'Equipment editor open/save wrappers',
    'set editor persistence/writers',
    'UI decoration/bootstrap retries'
  ],
  remainingDebtBlocksCoreExit:false,
  nextRoadmapLot:'Phase 4.5 Dice preaudit',
  runtimeModified:false
},null,2));
