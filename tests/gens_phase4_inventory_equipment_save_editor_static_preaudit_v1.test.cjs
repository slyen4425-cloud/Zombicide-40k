'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const count=(source,needle)=>source.split(needle).length-1;

const index=read('index.html');
const ownersRaw=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const owners=ownersRaw.files||ownersRaw;
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const setEditor=read('assets/dungeon/dungeon-set-editor-167818.js');
const artRepair=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const hero=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');

const nativeStart=index.indexOf('function saveEquipmentEditor(){');
const nativeEnd=index.indexOf('function resetDungeonItem(',nativeStart);
assert.ok(nativeStart>=0&&nativeEnd>nativeStart,'native saveEquipmentEditor owner must remain extractable from index.html');
const nativeSave=index.slice(nativeStart,nativeEnd);

const reachableHits=Object.keys(owners)
  .filter(p=>p.endsWith('.js')&&fs.existsSync(path.join(root,p)))
  .filter(p=>read(p).includes('saveEquipmentEditor'))
  .sort();
const expected=[
  'assets/dungeon/dungeon-equipment-hotfix-167817.js',
  'assets/dungeon/dungeon-set-editor-167818.js',
  'assets/gensrpg/gens-equipment-stat-cleanup-1678102.js',
  'assets/gensrpg/gens-hero-editor-dynamic-167897.js'
].sort();
assert.deepEqual(reachableHits,expected,'reachable external saveEquipmentEditor participants changed; re-audit before editing any writer');

function ordered(source,names,label){
  let last=-1;
  for(const name of names){
    const pos=source.indexOf(name);
    assert.ok(pos>=0,label+': missing '+name);
    assert.ok(pos>last,label+': wrong order around '+name);
    last=pos;
  }
}

ordered(workflow,[
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js'
],'Pages Equipment/save composition');
ordered(preview,[
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js'
],'preview Equipment/save composition');
ordered(artRepair,[
  'loadScript(HERO_EDITOR_SRC',
  'loadScript(EQUIPMENT_CLEANUP_SRC'
],'dynamic Equipment/save load order');

// Native owner: exactly one object persistence path is chosen.
assert.match(nativeSave,/const list=loadCustomEquipment\(\)/);
assert.match(nativeSave,/DUNGEON_ITEM_IDS\.includes\(String\(id\)\)/);
assert.match(nativeSave,/saveDungeonItemOverrides\(ovs\)/);
assert.match(nativeSave,/if\(!saveCustomEquipment\(list\)\)/);
assert.equal(count(nativeSave,'saveDungeonItemOverrides(ovs)'),1,'native builtin path must write overrides once');
assert.equal(count(nativeSave,'saveCustomEquipment(list)'),1,'native custom path must write the custom list once');
assert.equal(nativeSave.includes('rpgBonuses'),false,'native save must not silently become a second rpgBonuses owner');
assert.equal(nativeSave.includes('setPieceId'),false,'native save must not silently become a second set-membership owner');

// Historical hotfix: reads its editor fields after open, then writes rpgBonuses after native save.
assert.match(hotfix,/const bonuses=dungeon\?readEditorBonuses\(\):null;/);
assert.match(hotfix,/const result=baseSave\.apply\(this,arguments\);/);
assert.match(hotfix,/persistBonuses\(id,bonuses\)/);
assert.match(hotfix,/saveDungeonItemOverrides\(overrides\)/);
assert.match(hotfix,/saveCustomEquipment\(list\)/);
assert.match(hotfix,/wrapped\.__equipmentHotfix167817=true;wrapped\.__original=baseSave/);

// Set Editor: persists membership after the preceding save chain.
assert.match(setEditor,/const result=baseSave\.apply\(this,arguments\);/);
assert.match(setEditor,/persistItemMembership\(id,setId,piece\)/);
assert.match(setEditor,/saveDungeonItemOverrides\(overrides\)/);
assert.match(setEditor,/saveCustomEquipment\(list\)/);
assert.match(setEditor,/wrapped\.__setEditor167818=true;wrapped\.__original=baseSave/);

// Canonical Hero Editor: deferred canonical rpgBonuses writer targets custom equipment only.
assert.match(hero,/wrap\("saveEquipmentEditor"/);
assert.match(hero,/bonuses=readEquipmentBonuses\(\),out=old\.apply\(this,arguments\)/);
assert.match(hero,/setTimeout\(\(\)=>\{const list=R\.loadCustomEquipment/);
assert.match(hero,/target\.rpgBonuses=bonuses;R\.saveCustomEquipment\?\.\(list\)/);
const heroSaveStart=hero.indexOf('wrap("saveEquipmentEditor"');
const heroSaveEnd=hero.indexOf('for(const n of ["renderDungeonTalentEffectsEditor"',heroSaveStart);
const heroSave=hero.slice(heroSaveStart,heroSaveEnd);
assert.equal(heroSave.includes('saveDungeonItemOverrides'),false,'canonical Hero Equipment writer currently has no builtin override path');
assert.match(hero,/function hasWrapFlag\(fn,flag\)/);
assert.match(hero,/hasWrapFlag\(old,flag\)/);

// Cleanup is the outer synchronous invalidator; Hero persistence is deferred beyond old.apply().
assert.match(cleanup,/function wrapCacheInvalidator\(name\)/);
assert.match(cleanup,/invalidateEquipmentBonusCache\(\);const out=old\.apply\(this,arguments\);invalidateEquipmentBonusCache\(\);return out/);
assert.match(cleanup,/wrapCacheInvalidator\("saveEquipmentEditor"\)/);
assert.match(cleanup,/w\.__eqCache1021=true;w\.__original=old/);

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment saveEquipmentEditor static preaudit',
  nativeOwner:{builtinWrites:1,customWrites:1,rpgBonuses:false,setMembership:false},
  externalParticipants:reachableHits,
  stableOuterToInner:[
    'equipment-cleanup __eqCache1021',
    'hero-editor __canon101',
    'set-editor __setEditor167818',
    'equipment-hotfix __equipmentHotfix167817',
    'native index.html'
  ],
  predictedEquipmentWrites:{builtinOverrides:3,customList:4},
  characterizedRisks:[
    'canonical Hero rpgBonuses writer has no builtin override path',
    'canonical Hero rpgBonuses write is deferred after the cleanup synchronous post-invalidation'
  ],
  runtimeModified:false
},null,2));
