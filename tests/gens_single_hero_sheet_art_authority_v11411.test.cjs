const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sheet=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');
const board=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-ingame-art-167898.js'),'utf8');

assert.match(sheet,/retired:true/,'V99 must be an inert compatibility shim');
assert.doesNotMatch(sheet,/#charImage|IMAGE_SELECTOR|ROOT_SELECTOR/,'retired V99 must not target hero-sheet DOM');
assert.doesNotMatch(sheet,/setTimeout|MutationObserver|function wrap\(/,'retired V99 must install no retry, observer or lifecycle wrapper');

const repair=bridge.match(/function repairSheet\(\)\{([\s\S]*?)\}\nfunction repair\(/);
assert.ok(repair,'V102 compatibility repairSheet seam missing');
assert.match(repair[1],/return 0/,'V102 sheet seam must be inert');
assert.doesNotMatch(bridge,/SHEET_ART_SRC|GensDungeonSheetArtStability167899/,'V102 must not load or delegate to the retired sheet owner');
assert.doesNotMatch(bridge,/charImage|customSheetAvatar/,'V102 bridge must not target sheet portrait DOM');

const hook=bridge.match(/function hookAll\(\)\{([\s\S]*?)\}\nfunction install\(/);
assert.ok(hook,'V102 hookAll seam missing');
for(const name of ['openChar','openCharacter','openHeroSheet','showHeroSheet','renderCharacterSheet','renderDungeonHeroSheet','renderDungeonHeroStats','renderDungeonAttributes']){
  assert.ok(!hook[1].includes('"'+name+'"'),'V102 must not own hero-sheet lifecycle: '+name);
}
assert.doesNotMatch(bridge,/tries\+\+|setTimeout\(retry/,'V102 visual bridge must not reclaim hooks with retry loops');

assert.doesNotMatch(board,/MutationObserver|\.observe\s*\(/,'board art must not observe the whole DOM');
assert.doesNotMatch(board,/"openChar"|\["renderDungeonMap","renderDungeonRoom","renderDungeon","render"/,'board art must not hook hero sheet or global render');
assert.doesNotMatch(board,/\[data-hero-id\]|\[data-character-id\]|img\[alt\*=/,'board repair selectors must not be broad enough to reclaim sheet images');
assert.match(board,/#dc047RoomBoard|#dungeonMap|#dungeonBoard/,'board art must stay scoped to Dungeon board roots');
console.log('GenSrpG V114.11 hero-sheet art authority contract OK: native sheet owner, legacy repair layers scoped away');
