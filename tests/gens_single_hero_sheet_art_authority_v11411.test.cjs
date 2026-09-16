const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sheet=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-sheet-art-stability-167899.js'),'utf8');

assert.match(sheet,/function repairSheet\(\)[\s\S]*candidateImages/,'V99 must remain the direct hero-sheet art owner');
assert.match(sheet,/#charImage/,'V99 must own the canonical sheet image selector');
assert.doesNotMatch(sheet,/MutationObserver/,'sheet owner must stay lifecycle-based');

const repair=bridge.match(/function repairSheet\(\)\{([\s\S]*?)\}\nfunction repair\(/);
assert.ok(repair,'V102 repairSheet seam missing');
assert.doesNotMatch(repair[1],/charImage|customSheetAvatar|forceImg/,'V102 bridge must not mutate sheet images directly');
assert.match(repair[1],/GensDungeonSheetArtStability167899/,'V102 may delegate sheet repair only to V99');

const hook=bridge.match(/function hookAll\(\)\{([\s\S]*?)\}\nfunction install\(/);
assert.ok(hook,'V102 hookAll seam missing');
for(const name of ['openChar','openCharacter','openHeroSheet','showHeroSheet','renderCharacterSheet','renderDungeonHeroSheet','renderDungeonHeroStats','renderDungeonAttributes']){
  assert.ok(!hook[1].includes('"'+name+'"'),'V102 must not stack the V99 sheet lifecycle hook: '+name);
}
for(const name of ['ensureDungeonHeroes','renderParticipantSelector','renderMenu','openHeroCreator','hcRenderRpgStatsUsage','openEquipmentEditor']){
  assert.ok(hook[1].includes('"'+name+'"'),'V102 visual/non-sheet responsibility must remain: '+name);
}
for(const name of ['renderRpgUniverseEditor','saveRpgUniverseStats']){
  assert.ok(!hook[1].includes('"'+name+'"'),'V102 visual bridge must not own the canonical stats-editor lifecycle: '+name);
}
assert.match(bridge,/SHEET_ART_SRC/,'V102 must continue loading the V99 sheet owner');
assert.doesNotMatch(bridge,/MutationObserver|\.observe\s*\(/,'V102 bridge must stay observer-free');
console.log('GenSrpG V114.11 single hero-sheet art authority contract OK');
