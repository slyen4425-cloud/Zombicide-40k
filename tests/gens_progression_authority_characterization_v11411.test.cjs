const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function excerpt(marker,span=2600){
  const i=html.indexOf(marker);
  assert.ok(i>=0,`missing progression marker: ${marker}`);
  return html.slice(i,Math.min(html.length,i+span)).replace(/\s+/g,' ');
}

const markers=[
  'function dungeonSyncProgressionForState',
  'function dungeonRpgLevelFromXp',
  'function awardDungeonDefeatXp',
  'function dungeonRecordCombatReward',
  'function dungeonHandleLevelUp071'
];
for(const marker of markers){
  const text=excerpt(marker);
  console.log(`\n--- ${marker} ---\n${text}\n--- end ---`);
}

assert.match(html,/10\s*XP|\/\s*10|xpPerLevel/i,'native progression must expose its XP/level contract');
assert.match(html,/statPoints/,'native progression must own characteristic points');
assert.match(html,/skillPoints/,'native progression must own skill points');
console.log('GenSrpG V114.11 native progression/reward authority markers found');
