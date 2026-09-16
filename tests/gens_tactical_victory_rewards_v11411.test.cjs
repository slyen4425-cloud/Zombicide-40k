const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const uiPath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js');
const integrationPath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js');
const U=require(uiPath);
const ui=fs.readFileSync(uiPath,'utf8');
const integration=fs.readFileSync(integrationPath,'utf8');

assert.equal(typeof U.rewardSummaryHtml,'function','Tactical UI must expose a pure reward-summary formatter');
const html=U.rewardSummaryHtml({rewards:[
  {enemyId:'skeleton',killerId:'dungeon_aldren',xp:{total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]},drops:[{itemId:'coin',name:'Pièce ancienne',qty:1}]},
  {enemyId:'skeleton2',killerId:'dungeon_aldren',xp:{total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]},drops:[{itemId:'coin',name:'Pièce ancienne',qty:2}]}
]},{dungeon_aldren:'Aldren',dungeon_lyra:'Lyra'});
assert.match(html,/Aldren[^<]*\+6 XP/,'victory summary must aggregate Aldren XP');
assert.match(html,/Lyra[^<]*\+4 XP/,'victory summary must aggregate Lyra XP');
assert.match(html,/Pièce ancienne[^<]*×3/,'victory summary must aggregate identical drops');

assert.match(ui,/outcomeSummary/,'Tactical UI must retain the committed result while victory summary is displayed');
assert.match(ui,/data-finish/,'victory flow must have a second explicit return-to-Dungeon action after rewards are visible');
assert.match(integration,/rollEnemyLoot/,'outcome integration remains the reward authority');
assert.match(integration,/awardDungeonDefeatXp/,'outcome integration remains the XP authority');
assert.doesNotMatch(ui,/rollEnemyLoot|awardDungeonDefeatXp/,'Tactical UI must display rewards, never calculate them');
console.log('GenSrpG V114.11 Tactical victory contract: single commit -> visible XP/drops -> explicit return');
