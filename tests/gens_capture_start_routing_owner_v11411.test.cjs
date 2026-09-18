'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function block(id){
  const startTag='<script id="'+id+'">';
  const start=html.indexOf(startTag);
  assert.notEqual(start,-1,id+' block missing');
  const bodyStart=start+startTag.length;
  const end=html.indexOf('</script>',bodyStart);
  assert.notEqual(end,-1,id+' block end missing');
  return {start,body:html.slice(bodyStart,end)};
}

const capture=block('captureFix139');
const dungeon=block('dungeonCore200Rebuild');

assert.ok(capture.start<dungeon.start,'Capture launch owner must be installed before the later Dungeon routing layer');
assert.match(
  capture.body,
  /window\.startConfiguredGame=async function\(\)\{\s*if\(!isCaptureContext138\(\)\)return await start139\.apply\(this,arguments\);/,
  'captureFix139 must keep the dedicated Capture launch path'
);

assert.match(
  dungeon.body,
  /const startOutside200=window\.startConfiguredGame;/,
  'Dungeon Core 2.00 must preserve the previous startConfiguredGame chain'
);
assert.match(
  dungeon.body,
  /if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138==="function"&&isCaptureContext138\(\)\)\)return start\(\);/,
  'Dungeon Core 2.00 must only own true Dungeon launches, not Capture using the Dungeon substrate'
);
assert.doesNotMatch(
  dungeon.body,
  /if\(isDungeonMode\?\.\(\)\)return start\(\);/,
  'unconditional dungeon-mode routing would steal Capture from captureFix139'
);

console.log('GenSrpG Capture/Dungeon start routing owner: dedicated Capture chain preserved, true Dungeon stays Core 2.00');
