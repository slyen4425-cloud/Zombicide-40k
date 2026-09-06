const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const editor=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const asset=path.join(root,'assets','dungeon','creatures','dng_wall_block.jpg');

assert.match(editor,/APP_VERSION="16\.78\.66"/);
assert.match(editor,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.match(editor,/backgroundImage='url\("'\+WALL_ASSET\+'"\)'/);
assert.match(editor,/\.drc100Cell\.wall\{background-size:cover!important/);
assert.doesNotMatch(editor,/dungeon_wall\.png/);

assert.match(runtime,/APP_VERSION="16\.78\.67"/);
assert.match(runtime,/WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/);
assert.match(runtime,/String\(mapCells\[i\]\|\|""\)!=="wall"/);
assert.match(runtime,/className="dav167867Wall"/);
assert.match(runtime,/enemyCellIndexes\(x\)/);
assert.match(runtime,/querySelectorAll\("img"\)/);
assert.match(runtime,/width:80%!important/);
assert.match(runtime,/object-position:50% 50%!important/);
assert.match(runtime,/transform:translate\(-50%,-50%\)!important/);
assert.doesNotMatch(runtime,/dungeon_wall\.png/);

assert.ok(fs.existsSync(asset),'validated wall block asset must exist');
assert.ok(fs.statSync(asset).size>1000,'wall block asset must not be empty');
assert.match(sw,/gensrpg-cache-16\.78\.66-wall-block-visual/);
assert.match(sw,/assets\/dungeon\/creatures\/dng_wall_block\.jpg/);

console.log('Dungeon wall/runtime visual V16.78.67 regression: OK');
