const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);
  const end=source.indexOf(nextSig,start+startSig.length);assert.ok(end>start,`${label}: missing ${nextSig}`);
  return source.slice(start,end);
};

const files=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js']
];
const debt=[];
for(const [name,file] of files){
  const source=read(file);
  const style=block(source,'function ensureStyle(rt=R){','function ',`${name} ensureStyle`);
  const ownsWallCss=/WALL_ASSET|gtv2Cell\.blocked|drc100Grid|dav167870WallCell|gtv2112WallCell/.test(style);
  if(ownsWallCss)debt.push(name);
}
assert.deepEqual(debt,[],'historical Tactical layers must not own any residual wall CSS');

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/,'canonical Tactical UI wall asset missing');
assert.match(ui,/function ensureWallTile\(el\)/,'canonical Tactical UI wall tile owner missing');
assert.match(ui,/function paintLiveWalls\(\)/,'canonical Tactical UI live wall owner missing');

console.log('GenSrpG V114.11 CSS wall debt cleared: V108/V109/V111/V112/V113 clean; Tactical UI canonical');
