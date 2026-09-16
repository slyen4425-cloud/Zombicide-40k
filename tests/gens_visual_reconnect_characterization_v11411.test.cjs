const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sheet=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const board=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');
const direct=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ingame-hero-art-167898.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

// Characterization only: at the manual-test checkpoint two active layers still write sheet images.
assert.match(bridge,/function repairSheet\(\)[\s\S]*charImage[\s\S]*customSheetAvatar/,'V102 bridge currently writes the hero sheet directly');
assert.match(sheet,/function repairSheet\(\)[\s\S]*candidateImages/,'V99 sheet module currently writes the hero sheet');
const overlapping=['openChar','openCharacter','openHeroSheet','showHeroSheet','renderCharacterSheet','renderDungeonHeroSheet','renderDungeonHeroStats','renderDungeonAttributes'];
for(const name of overlapping){
  assert.ok(bridge.includes('"'+name+'"'),'bridge currently hooks '+name);
  assert.ok(sheet.includes('"'+name+'"'),'sheet module currently hooks '+name);
}
assert.match(board,/MutationObserver/,'historical in-game board art still owns a scoped board observer at this checkpoint');
assert.doesNotMatch(direct,/MutationObserver/,'direct room-boundary pinning is lifecycle based');

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
assert.equal(survivalVisuals.length,0,'characterization: there is currently no physical assets/survival visual library');
assert.ok(dungeonVisuals.length>20,'Dungeon visual library must remain present');

const pathRefs=[...index.matchAll(/["'`](?:\.\/)?([^"'`\s]+\.(?:png|jpe?g|webp|gif|svg))["'`]/gi)].map(m=>m[1]);
const survivalPathRefs=[...new Set(pathRefs.filter(p=>/surviv|zomb|walker|runner|abom/i.test(p)))];
const dataImages=(index.match(/data:image\//gi)||[]).length;
const emojiZombie=(index.match(/🧟|🧟‍♂️|🧟‍♀️/gu)||[]).length;
const zombieWords=(index.match(/zombi|zombie|walker|runner|abomination/gi)||[]).length;

console.log('VISUAL CHARACTERIZATION',JSON.stringify({
  sheetDirectAuthorities:['gens-dungeon-hero-art-repair-167874.js','gens-dungeon-sheet-art-stability-167899.js'],
  overlappingSheetHooks:overlapping,
  totalAssetVisuals:assetVisuals.length,
  dungeonVisuals:dungeonVisuals.length,
  survivalVisuals:survivalVisuals.length,
  survivalImagePathRefs:survivalPathRefs.slice(0,40),
  dataImages,
  emojiZombie,
  zombieWords
},null,2));
console.log('GenSrpG V114.11 visual reconnect characterization OK');
