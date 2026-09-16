const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sheet=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const board=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');
const direct=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ingame-hero-art-167898.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

// V99 is now the sole direct owner of built-in hero images on the Dungeon sheet.
assert.match(sheet,/function repairSheet\(\)[\s\S]*candidateImages/,'V99 sheet module must own direct sheet rendering');
const bridgeRepair=bridge.match(/function repairSheet\(\)\{([\s\S]*?)\}\nfunction repair\(/);
assert.ok(bridgeRepair,'V102 compatibility repairSheet seam missing');
assert.doesNotMatch(bridgeRepair[1],/charImage|customSheetAvatar|forceImg/,'V102 must not write sheet image DOM');
assert.match(bridgeRepair[1],/GensDungeonSheetArtStability167899/,'V102 compatibility seam must delegate to V99');
const overlapping=['openChar','openCharacter','openHeroSheet','showHeroSheet','renderCharacterSheet','renderDungeonHeroSheet','renderDungeonHeroStats','renderDungeonAttributes'];
const bridgeHooks=bridge.match(/function hookAll\(\)\{([\s\S]*?)\}\nfunction install\(/)?.[1]||'';
for(const name of overlapping){
  assert.ok(!bridgeHooks.includes('"'+name+'"'),'V102 must not stack sheet lifecycle hook '+name);
  assert.ok(sheet.includes('"'+name+'"'),'V99 must retain sheet lifecycle hook '+name);
}
assert.match(board,/MutationObserver/,'historical board-art observer debt remains characterized separately');
assert.doesNotMatch(direct,/MutationObserver/,'direct room-boundary pinning stays lifecycle based');

// Physical visual inventory: Survival-specific asset folders do not exist yet.
function walk(dir){
  if(!fs.existsSync(dir))return [];
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));else out.push(p);
  }
  return out;
}
const visualExt=/\.(?:png|jpe?g|webp|gif|svg)$/i;
const assetVisuals=walk(path.join(root,'assets')).filter(p=>visualExt.test(p));
const survivalVisuals=assetVisuals.filter(p=>/[\\/]survival[\\/]/i.test(p));
const dungeonVisuals=assetVisuals.filter(p=>/[\\/]dungeon[\\/]/i.test(p));
assert.equal(survivalVisuals.length,0,'there is currently no physical assets/survival visual library');
assert.ok(dungeonVisuals.length>20,'Dungeon visual library must remain present');

const pathRefs=[...index.matchAll(/["'`](?:\.\/)?([^"'`\s]+\.(?:png|jpe?g|webp|gif|svg))["'`]/gi)].map(m=>m[1]);
const survivalPathRefs=[...new Set(pathRefs.filter(p=>/surviv|zomb|walker|runner|abom/i.test(p)))];
const dataImages=(index.match(/data:image\//gi)||[]).length;
const emojiZombie=(index.match(/🧟|🧟‍♂️|🧟‍♀️/gu)||[]).length;
const zombieWords=(index.match(/zombi|zombie|walker|runner|abomination/gi)||[]).length;
assert.deepEqual(survivalPathRefs,[],'Survival must not silently depend on broken or cross-module image paths');

console.log('VISUAL CHARACTERIZATION',JSON.stringify({
  sheetDirectAuthorities:['gens-dungeon-sheet-art-stability-167899.js'],
  retiredBridgeSheetHooks:overlapping,
  totalAssetVisuals:assetVisuals.length,
  dungeonVisuals:dungeonVisuals.length,
  survivalVisuals:survivalVisuals.length,
  survivalImagePathRefs:survivalPathRefs,
  dataImages,
  emojiZombie,
  zombieWords
},null,2));
console.log('GenSrpG V114.11 visual ownership characterization OK');
