'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const hero=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');

assert.match(hero,/function wrap\(name,maker,flag="__canon101"\)/,
  'Hero Editor Dynamic generic wrapper marker must remain characterized');
assert.match(hero,/wrap\("openEquipmentEditor"/,
  'Hero Editor Dynamic must currently wrap openEquipmentEditor');
assert.match(hero,/wrap\("saveEquipmentEditor"/,
  'Hero Editor Dynamic must currently wrap saveEquipmentEditor');
assert.match(hero,/setTimeout\(retry,50\)/,
  'Hero Editor Dynamic initial retry delay changed');
assert.match(hero,/if\(tries\+\+<30\)setTimeout\(retry,100\)/,
  'Hero Editor Dynamic retry loop changed');
assert.match(hero,/if\(typeof old!=="function"\|\|old\[flag\]\)return false/,
  'Hero Editor Dynamic wrapper guard changed');

assert.match(cleanup,/function wrapOpen\(\)/,
  'Equipment Cleanup open wrapper must remain characterized');
assert.match(cleanup,/old\.__canonEq102/,
  'Equipment Cleanup open guard marker changed');
assert.match(cleanup,/w\.__canonEq102=true;w\.__original=old/,
  'Equipment Cleanup open wrapper marker changed');
assert.match(cleanup,/function wrapCacheInvalidator\(name\)/,
  'Equipment Cleanup cache invalidator wrapper must remain characterized');
assert.match(cleanup,/old\.__eqCache1021/,
  'Equipment Cleanup cache invalidator guard marker changed');
assert.match(cleanup,/w\.__eqCache1021=true;w\.__original=old/,
  'Equipment Cleanup cache invalidator marker changed');
assert.match(cleanup,/if\(installed\)return true/,
  'Equipment Cleanup must remain single-install in this characterization');

assert.notEqual('__canon101','__canonEq102');
assert.notEqual('__canon101','__eqCache1021');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment wrapper retry static preaudit',
  heroEditorMarker:'__canon101',
  cleanupOpenMarker:'__canonEq102',
  cleanupSaveMarker:'__eqCache1021',
  heroEditorRetry:{initialMs:50,repeatMs:100,maxRepeatGuard:'tries++ < 30'},
  cleanupInstall:'single-shot',
  risk:'a cleanup wrapper does not carry __canon101, so a later Hero Editor retry can wrap it again'
},null,2));
