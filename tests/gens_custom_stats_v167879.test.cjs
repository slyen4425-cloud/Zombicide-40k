const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-custom-stats-167879.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'custom stats module must stay syntactically valid');
assert.match(src,/APP_VERSION="16\.78\.79"/);
assert.match(src,/STEALTH_ID="furtivite"/,'demo Furtivité must be a real custom stat');
assert.match(src,/customStats/,'generic stat registry must be stored in the RPG universe');
assert.match(src,/s\.rpgAttributes\[d\.id\]=v/,'custom stats must mirror into generic runtime attributes');
assert.match(src,/editMode:\["points","free","runtime"\]/,'custom stat edit modes must stay generic');
assert.match(src,/usage:String\(d\.usage/,'custom stat semantic binding must remain configurable');
assert.match(src,/rpgTrapDetectionStat/,'existing trap detection selector must accept custom stats');
assert.match(src,/exploration\.stealth/,'stealth rules must be profile-configurable');
assert.match(src,/baseChance:30,statGain:4,enemyPenalty:5/,'demo stealth defaults must remain explicit');
assert.match(src,/gcsStealth/,'movement stealth must be a per-hero temporary runtime state');
assert.match(src,/dc200BypassedBy\[heroId\]=true/,'successful movement stealth must suppress per-hero enemy detection');
assert.match(src,/breakStealth\("action hostile"\)/,'hostile actions must break temporary stealth');
assert.match(src,/movementOn\(\)\?prompt\(\):oldPrompt/,'movement OFF must preserve legacy narrative stealth');
assert.doesNotMatch(src,/dungeonRoom\s*=\s*-/,'stealth must never move enemies to fake rooms');
assert.doesNotMatch(src,/enemyCells\s*=/,'stealth must not move enemy board positions');
const site=process.argv[2]&&fs.existsSync(process.argv[2])?fs.readFileSync(process.argv[2],'utf8'):null;
if(site){
  assert.match(site,/gens-custom-stats-167879\.js\?v=167879/,'deployed site must load custom stats module');
  assert.match(site,/dungeon-enemy-target-randomizer-167878\.js\?v=167878/,'V16.78.78 target randomizer must actually be loaded');
}
console.log('GenSrpG generic custom stats + Furtivité V16.78.79 regression: OK');
