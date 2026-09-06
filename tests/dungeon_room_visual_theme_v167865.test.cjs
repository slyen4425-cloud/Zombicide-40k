const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');

assert.match(src,/APP_VERSION="16\.78\.66"/);
for(const theme of ['stone','cave','forest','ice','lava']){
  assert.match(src,new RegExp('"'+theme+'"'));
}
assert.match(src,/dng_floor_"\+themeName\+"_"\+variant\+"\.png/);
assert.match(src,/Math\.max\(0,Number\(index\)\|\|0\)%6/);
assert.match(src,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.doesNotMatch(src,/dungeon_wall\.png/);
assert.match(src,/DOC\.addEventListener\("change"/);
assert.match(src,/!e\.target\?\.closest\?\.\("\.drc100Cell"\)/);

console.log('Dungeon room visual theme V16.78.66 regression: OK');
