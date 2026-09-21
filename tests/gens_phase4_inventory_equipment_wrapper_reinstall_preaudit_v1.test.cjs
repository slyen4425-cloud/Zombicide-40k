'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const hero=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const loader=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');

assert.match(hero,/function wrap\(name,maker,flag="__canon101"\)/);
assert.match(hero,/wrap\("openEquipmentEditor"/);
assert.match(hero,/wrap\("saveEquipmentEditor"/);
assert.match(hero,/const retry=\(\)=>\{installWrappers\(\);forceBuiltinArt\(\);if\(tries\+\+<30\)setTimeout\(retry,100\)\}/);
assert.match(hero,/setTimeout\(retry,50\)/);

assert.match(cleanup,/function wrapOpen\(\)/);
assert.match(cleanup,/w\.__canonEq102=true;w\.__original=old/);
assert.match(cleanup,/wrapCacheInvalidator\("saveEquipmentEditor"\)/);
assert.match(cleanup,/w\.__eqCache1021=true;w\.__original=old/);
assert.match(cleanup,/if\(installed\)return true/);

const heroPos=loader.indexOf('loadScript(HERO_EDITOR_SRC');
const cleanupPos=loader.indexOf('loadScript(EQUIPMENT_CLEANUP_SRC');
assert.ok(heroPos>=0&&cleanupPos>heroPos,'Hero Editor Dynamic must initially load before Equipment Cleanup');

assert.doesNotMatch(
  hero,
  /old\.__canonEq102|old\.__eqCache1021/,
  'Hero Editor retry currently does not recognize Equipment Cleanup ownership markers'
);
assert.doesNotMatch(
  cleanup,
  /old\.__canon101/,
  'Equipment Cleanup currently does not recognize Hero Editor Dynamic ownership marker'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment wrapper reinstall static preaudit',
  initialDynamicOrder:['hero-editor-dynamic-167897','equipment-stat-cleanup-1678102'],
  heroMarker:'__canon101',
  cleanupOpenMarker:'__canonEq102',
  cleanupSaveMarker:'__eqCache1021',
  heroRetry:{firstMs:50,intervalMs:100,maxFollowups:31},
  crossOwnerMarkerAwareness:false,
  runtimeModified:false
},null,2));
