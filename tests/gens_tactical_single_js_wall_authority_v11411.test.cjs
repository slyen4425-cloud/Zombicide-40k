const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const block=(source,startSig,nextSig,label)=>{
  const start=source.indexOf(startSig);assert.ok(start>=0,`${label}: missing ${startSig}`);
  const end=source.indexOf(nextSig,start);assert.ok(end>start,`${label}: missing ${nextSig}`);
  return source.slice(start,end);
};

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const historical=[
  ['V108',read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js')],
  ['V109',read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js')],
  ['V111',read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js')],
  ['V112',read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js')],
  ['V113',read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js')]
];

const canonical=block(ui,'function installGlobalPolish(){','const api=','canonical Tactical UI installGlobalPolish');
for(const required of ['preloadWall()','patchDungeonMapHtml()','hookDungeonRender()','paintLiveWalls()'])assert.ok(canonical.includes(required),`canonical wall pipeline missing ${required}`);

const activeBlocks=[];
activeBlocks.push(['V108 install',block(historical[0][1],'function install(rt=R){','function installWithRetries','V108 install')]);
activeBlocks.push(['V108 hookUiRender',block(historical[0][1],'function hookUiRender(rt=R){','function observe(rt=R){','V108 hookUiRender')]);
activeBlocks.push(['V109 install',block(historical[1][1],'function install(rt=R){','function installWithRetries','V109 install')]);
activeBlocks.push(['V109 enhance',block(historical[1][1],'function enhance(rt=R){','function hookUi','V109 enhance')]);
activeBlocks.push(['V111 maintain',block(historical[2][1],'function maintain(rt=R){','function queueMaintain','V111 maintain')]);
activeBlocks.push(['V112 maintain',block(historical[3][1],'function maintain(rt=R){','function queueMaintain','V112 maintain')]);
activeBlocks.push(['V113 install',block(historical[4][1],'function install(rt=R){','function installWithRetries','V113 install')]);
activeBlocks.push(['V113 maintain',block(historical[4][1],'function maintain(rt=R){','function queueMaintain','V113 maintain')]);

for(const [label,src] of activeBlocks){
  assert.doesNotMatch(src,/paintWalls\(rt\)|paintBuilderWalls\(rt\)|markWallCells\(rt\)|patchDungeonMapHtml\(rt\)|hookDungeonRender\(rt\)/,`${label} must not own active JS wall rendering`);
}

for(const [name,src] of historical)assert.match(src,/dng_wall_block\.jpg/,`${name} historical source should remain traceable during CSS cleanup`);
console.log('GenSrpG V114.11: Tactical UI is the only active JavaScript wall-rendering authority; historical CSS debt tracked separately');
