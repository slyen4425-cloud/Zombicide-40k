const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function excerpt(marker,span=3000){
  const i=html.indexOf(marker);
  assert.ok(i>=0,`missing progression marker: ${marker}`);
  return html.slice(i,Math.min(html.length,i+span)).replace(/\s+/g,' ');
}
function contexts(marker,limit=8,radius=650){
  const out=[];let from=0;
  while(out.length<limit){const i=html.indexOf(marker,from);if(i<0)break;out.push(html.slice(Math.max(0,i-radius),Math.min(html.length,i+radius)).replace(/\s+/g,' '));from=i+marker.length}
  return out;
}

const markers=[
  'function dungeonSyncProgressionForState',
  'function dungeonRpgLevelFromXp',
  'function awardDungeonDefeatXp',
  'function dungeonRecordCombatReward',
  'function dungeonDefeatRewardText'
];
for(const marker of markers)console.log(`\n--- ${marker} ---\n${excerpt(marker)}\n--- end ---`);

const levelUp=contexts('dungeonHandleLevelUp071',4,900);
assert.ok(levelUp.length,'level-up handler reference missing');
console.log('\n--- dungeonHandleLevelUp071 contexts ---\n'+levelUp.join('\n###\n')+'\n--- end ---');

const levelContexts=contexts('rpgLevel',12,750);
assert.ok(levelContexts.length,'rpgLevel references missing');
console.log('\n--- rpgLevel contexts ---\n'+levelContexts.join('\n###\n')+'\n--- end ---');

const rewardContexts=contexts('dungeonCombatRewards',8,850);
assert.ok(rewardContexts.length,'combat reward aggregate missing');
console.log('\n--- dungeonCombatRewards contexts ---\n'+rewardContexts.join('\n###\n')+'\n--- end ---');

assert.match(html,/xpPerLevel/,'native progression must expose XP per level');
assert.match(html,/statPointsPerLevel/,'native progression must expose characteristic points per level');
assert.match(html,/statPoints/,'native progression must own characteristic points');
assert.match(html,/skillPoints/,'native progression must own skill points');
console.log('GenSrpG V114.11 native progression/reward authority characterized');
