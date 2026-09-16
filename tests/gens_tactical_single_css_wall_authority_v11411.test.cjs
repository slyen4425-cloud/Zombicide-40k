const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const styleBlock=(source,label)=>{
  const start=source.indexOf('function ensureStyle(rt=R){');
  assert.ok(start>=0,`${label}: ensureStyle missing`);
  const end=source.indexOf('function ',start+'function ensureStyle(rt=R){'.length);
  assert.ok(end>start,`${label}: ensureStyle end missing`);
  return source.slice(start,end);
};

const historical=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js']
];
const forbidden=/WALL_ASSET|gtv2Cell\.blocked|drc100Grid|dav167870WallCell|gtv2112WallCell|background-image\s*:\s*url\([^)]*wall/i;
for(const [name,file] of historical){
  const style=styleBlock(read(file),name);
  assert.doesNotMatch(style,forbidden,`${name} must never regain CSS wall authority`);
}

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.png"/,'Tactical UI must own the canonical wall asset');
assert.match(ui,/function wallTileHtml\(/,'Tactical UI must own wall tile HTML');
assert.match(ui,/function ensureWallTile\(el\)/,'Tactical UI must own wall tile idempotence');
assert.match(ui,/function paintLiveWalls\(\)/,'Tactical UI must own live wall rendering');
assert.match(ui,/function hookDungeonRender\(/,'Tactical UI must own Dungeon wall render integration');

console.log('GenSrpG V114.11 single CSS wall authority OK: historical Tactical layers are clean; Tactical UI alone owns wall presentation');
