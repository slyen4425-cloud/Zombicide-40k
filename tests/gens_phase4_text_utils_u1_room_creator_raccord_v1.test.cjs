const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const roomPath='assets/dungeon/dungeon-room-creator-100.js';
const u1Path='assets/gensrpg/core/text-utils-v1.js';

const room=fs.readFileSync(path.join(root,roomPath),'utf8');
const u1=fs.readFileSync(path.join(root,u1Path),'utf8');
const main=fs.readFileSync(path.join(root,'.github/workflows/main.yml'),'utf8');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');

assert.ok(u1.includes('ROOT.GensTextUtilsV1=Object.freeze'),
  'Core Text Utils v1 API missing');
assert.ok(u1.includes('escapeHtml'),
  'Core Text Utils escapeHtml missing');

const pagesU1=main.indexOf('assets/gensrpg/core/text-utils-v1.js');
const pagesRoom=main.indexOf('assets/dungeon/dungeon-room-creator-100.js');
assert.ok(pagesU1>=0,
  'RED: GitHub Pages must load Text Utils v1');
assert.ok(pagesRoom>=0,
  'GitHub Pages Room Creator composition missing');
assert.ok(pagesU1<pagesRoom,
  'RED: GitHub Pages must load Text Utils v1 before Room Creator');

const previewU1=preview.indexOf('assets/gensrpg/core/text-utils-v1.js');
const previewRoom=preview.indexOf('assets/dungeon/dungeon-room-creator-100.js');
assert.ok(previewU1>=0,
  'RED: preview must load Text Utils v1');
assert.ok(previewRoom>=0,
  'preview Room Creator composition missing');
assert.ok(previewU1<previewRoom,
  'RED: preview must load Text Utils v1 before Room Creator');

assert.equal((room.match(/function esc\(v\)/g)||[]).length,0,
  'RED: Room Creator local esc implementation must be retired');
assert.match(room,/GensTextUtilsV1/,
  'RED: Room Creator must declare its Text Utils dependency');
assert.match(room,/escapeHtml/,
  'RED: Room Creator must use Core escapeHtml');
assert.doesNotMatch(room,/replace\(\/\[&<>["']\]\/g/,
  'RED: Room Creator must not retain a local HTML escaping implementation');

console.log(JSON.stringify({
  scenario:'Phase 4 U1 Room Creator raccord',
  pagesOrder:{textUtils:pagesU1,roomCreator:pagesRoom},
  previewOrder:{textUtils:previewU1,roomCreator:previewRoom},
  localEscRetired:true,
  explicitCoreDependency:true
},null,2));
