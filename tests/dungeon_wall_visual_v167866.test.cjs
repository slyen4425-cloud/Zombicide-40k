const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const asset=path.join(root,'assets','dungeon','creatures','dng_wall_block.jpg');

assert.match(src,/APP_VERSION="16\.78\.66"/);
assert.match(src,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.match(src,/backgroundImage='url\("'\+WALL_ASSET\+'"\)'/);
assert.match(src,/\.drc100Cell\.wall\{background-size:cover!important/);
assert.doesNotMatch(src,/dungeon_wall\.png/);
assert.ok(fs.existsSync(asset),'validated wall block asset must exist');
assert.ok(fs.statSync(asset).size>1000,'wall block asset must not be empty');
assert.match(sw,/gensrpg-cache-16\.78\.66-wall-block-visual/);
assert.match(sw,/assets\/dungeon\/creatures\/dng_wall_block\.jpg/);

console.log('Dungeon wall visual V16.78.66 regression: OK');
