const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const editor=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-hotfix-167827.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const asset=path.join(root,'assets','dungeon','creatures','dng_wall_block.jpg');
const siteIndex=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;

function jpegSize(buf){
  assert.ok(Buffer.isBuffer(buf),'wall asset must be binary data');
  assert.equal(buf[0],0xff,'wall asset must start with JPEG SOI');
  assert.equal(buf[1],0xd8,'wall asset must start with JPEG SOI');
  let i=2;
  const sof=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while(i+8<buf.length){
    if(buf[i]!==0xff){i++;continue}
    while(i<buf.length&&buf[i]===0xff)i++;
    const marker=buf[i++];
    if(marker===0xd8||marker===0xd9||marker===0x01)continue;
    if(i+1>=buf.length)break;
    const len=buf.readUInt16BE(i);
    if(len<2||i+len>buf.length)break;
    if(sof.has(marker))return {height:buf.readUInt16BE(i+3),width:buf.readUInt16BE(i+5)};
    i+=len;
  }
  throw new Error('wall asset JPEG SOF marker not found');
}

assert.doesNotThrow(()=>new Function(runtime),'runtime visual bridge must stay syntactically valid');
assert.match(editor,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.doesNotMatch(editor,/dungeon_wall\.png/);

assert.match(runtime,/APP_VERSION="16\.78\.73"/);
assert.match(runtime,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/);
assert.match(runtime,/DungeonRoomCreator100\?\.findRoom/,'runtime must read the original authored room');
assert.match(runtime,/roomCells=Array\.isArray\(room\?\.cells\)/,'runtime must use authored room cells');
assert.match(runtime,/String\(source\.terrain\|\|""\)==="wall"/,'runtime must use authored terrain for walls');
assert.match(runtime,/room\?\.theme\|\|x\?\.last\?\.map\?\.environment/,'runtime must use authored theme');
assert.match(runtime,/dng_floor_"\+t\+"_"\+variant\+"\.png/,'runtime floor theme assets missing');
assert.match(runtime,/dav167870WallCell/,'runtime wall-cell class missing');
assert.match(runtime,/setProperty\("background-image"/,'runtime must paint the live cell background directly');
assert.match(runtime,/enemyTokenRoot\(cell,img\)/,'actor wrapper centering helper missing');
assert.match(runtime,/dav167870EnemyToken/,'actor token class missing');
assert.match(runtime,/right:auto!important;bottom:auto!important/,'legacy Core 3.10 corner anchoring must be neutralized');
assert.match(runtime,/width:76%!important/,'actor token must retain the validated small-room CSS fallback');
assert.match(runtime,/place-items:center!important/,'actor token must be centered');
assert.match(runtime,/const ACTOR_RATIO=\.76/,'large visual cells keep the validated ratio');
assert.match(runtime,/ACTOR_RATIO_MEDIUM=\.82/,'medium cells need perceptual compensation');
assert.match(runtime,/ACTOR_RATIO_COMPACT=\.88/,'compact large-room cells need stronger perceptual compensation');
assert.match(runtime,/function actorRatioForSide/,'actor ratio must adapt to live cell side');
assert.match(runtime,/n>0&&n<=54/,'compact-cell threshold must be explicit');
assert.match(runtime,/n>54&&n<=82/,'medium-cell threshold must be explicit');
assert.match(runtime,/side\*actorRatioForSide\(side\)/,'token size must use adaptive ratio');
assert.match(runtime,/getBoundingClientRect/,'actor size must use the live rendered cell dimensions');
assert.match(runtime,/function heroCellIndexes/,'hero tokens must use the same responsive sizing as enemies');
assert.match(runtime,/function actorCellIndexes/,'hero and enemy cells must share one responsive sizing path');
assert.match(runtime,/style\.setProperty\("right","auto","important"\)/,'inline Core 3.10 enemy anchor must be cleared');
assert.match(runtime,/style\.setProperty\("bottom","auto","important"\)/,'inline Core 3.10 enemy anchor must be cleared');
assert.match(runtime,/function refitDc310Tokens/,'late Core 3.10 tokens must have a dedicated refit path');
assert.match(runtime,/\.dc310Hero,\.dc310Enemy/,'Core 3.10 token classes must be targeted explicitly');
assert.match(runtime,/function installTokenMutationSync/,'late token recreation must be observed');
assert.match(runtime,/new ROOT\.MutationObserver/,'board-local token observer must be installed');
assert.match(runtime,/obs\.observe\(board,\{childList:true,subtree:true\}\)/,'observer must stay scoped to the tactical board');
assert.match(runtime,/style\.setProperty\("object-fit","cover"/,'actor art must fill the token frame');
assert.match(runtime,/ACTOR_ZOOM=1\.12/,'actor art framing zoom must remain validated');
assert.match(runtime,/ResizeObserver/,'token sizing must be recalculated when the tactical grid resizes');
assert.doesNotMatch(runtime,/className="dav167867Wall"/,'old wall overlay must not be used anymore');
assert.doesNotMatch(runtime,/dungeon_wall\.png/);

assert.ok(fs.existsSync(asset),'validated wall block asset must exist');
const wallBytes=fs.readFileSync(asset);
assert.ok(wallBytes.length>5000,'wall block asset must not be the old tiny placeholder');
const dims=jpegSize(wallBytes);
assert.ok(dims.width>=256&&dims.height>=256,`wall block asset must be at least 256x256, got ${dims.width}x${dims.height}`);
for(const theme of ['stone','cave','forest','ice','lava']){
  assert.ok(fs.existsSync(path.join(root,'assets','dungeon','creatures',`dng_floor_${theme}_01.png`)),`missing ${theme} floor asset`);
}
assert.match(sw,/gensrpg-cache-16\.78\.74-ui-cleanup/);
assert.match(sw,/dungeon-authored-cache-visual-167852\.js/);
assert.match(sw,/dungeon-ui-cleanup-167874\.js/);
assert.match(sw,/dng_floor_forest_01\.png/);
assert.match(sw,/dng_floor_ice_01\.png/);
assert.match(sw,/dng_floor_lava_01\.png/);

if(siteIndex){
  assert.match(siteIndex,/dungeon-authored-cache-visual-167852\.js\?v=167870/,'runtime terrain/token bridge must remain injected in deployed index');
}

console.log(`Dungeon authored wall ${dims.width}x${dims.height} + late Core 3.10 actor refit preserved under V16.78.74 UI cleanup: OK`);
