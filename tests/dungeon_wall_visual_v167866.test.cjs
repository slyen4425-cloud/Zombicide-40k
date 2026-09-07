const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const editor=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const asset=path.join(root,'assets','dungeon','creatures','dng_wall_block.jpg');
const siteIndex=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;

assert.match(editor,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.doesNotMatch(editor,/dungeon_wall\.png/);

assert.match(runtime,/APP_VERSION="16\.78\.69"/);
assert.match(runtime,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.match(runtime,/DungeonRoomCreator100\?\.findRoom/,'runtime must read the original authored room');
assert.match(runtime,/roomCells=Array\.isArray\(room\?\.cells\)/,'runtime must use authored room cells');
assert.match(runtime,/String\(source\.terrain\|\|""\)==="wall"/,'runtime must use authored terrain for walls');
assert.match(runtime,/room\?\.theme\|\|x\?\.last\?\.map\?\.environment/,'runtime must use authored theme');
assert.match(runtime,/dng_floor_"\+t\+"_"\+variant\+"\.png/,'runtime floor theme assets missing');
assert.match(runtime,/dav167869WallCell/,'runtime wall-cell class missing');
assert.match(runtime,/setProperty\("background-image"/,'runtime must paint the live cell background directly');
assert.doesNotMatch(runtime,/className="dav167867Wall"/,'old wall overlay must not be used anymore');
assert.doesNotMatch(runtime,/dungeon_wall\.png/);

assert.ok(fs.existsSync(asset),'validated wall block asset must exist');
assert.ok(fs.statSync(asset).size>1000,'wall block asset must not be empty');
for(const theme of ['stone','cave','forest','ice','lava']){
  assert.ok(fs.existsSync(path.join(root,'assets','dungeon','creatures',`dng_floor_${theme}_01.png`)),`missing ${theme} floor asset`);
}
assert.match(sw,/gensrpg-cache-16\.78\.69-runtime-terrain/);
assert.match(sw,/dungeon-authored-cache-visual-167852\.js/);
assert.match(sw,/dng_floor_forest_01\.png/);
assert.match(sw,/dng_floor_ice_01\.png/);
assert.match(sw,/dng_floor_lava_01\.png/);

if(siteIndex){
  assert.match(siteIndex,/dungeon-authored-cache-visual-167852\.js\?v=167869/,'runtime terrain bridge must be injected in deployed index');
}

console.log('Dungeon authored runtime terrain V16.78.69 regression: OK');
