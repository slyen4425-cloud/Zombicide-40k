const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const bridgePath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js');
const uiPath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js');
const integrationPath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js');
const B=require(bridgePath);
const bridge=fs.readFileSync(bridgePath,'utf8');
const ui=fs.readFileSync(uiPath,'utf8');
const integration=fs.readFileSync(integrationPath,'utf8');

assert.equal(typeof B.rewardSummaryHtml,'function','Tactical -> Dungeon bridge must expose the reward-summary formatter');
const rt={CHARS:{dungeon_aldren:{name:'Aldren'},dungeon_lyra:{name:'Lyra'}}};
const html=B.rewardSummaryHtml(rt,{rewards:[
  {enemyId:'skeleton',killerId:'dungeon_aldren',xp:{total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]},drops:[{itemId:'coin',name:'Pièce ancienne',qty:1}]},
  {enemyId:'skeleton2',killerId:'dungeon_aldren',xp:{total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]},drops:[{itemId:'coin',name:'Pièce ancienne',qty:2}]}
]});
assert.match(html,/Aldren[^<]*\+6 XP/,'victory summary must aggregate Aldren XP');
assert.match(html,/Lyra[^<]*\+4 XP/,'victory summary must aggregate Lyra XP');
assert.match(html,/Pièce ancienne[^<]*×3/,'victory summary must aggregate identical drops');

assert.match(bridge,/showOutcomeModal/,'bridge must own presentation of the committed Tactical result back in Dungeon');
assert.match(bridge,/DungeonCore01\?\.modal/,'bridge must reuse the existing Dungeon modal instead of creating a second victory UI system');
assert.match(bridge,/finishExploration[\s\S]*showOutcomeModal/,'reward summary must be presented during the Tactical -> Dungeon handoff');
assert.match(integration,/rollEnemyLoot/,'outcome integration remains the reward authority');
assert.match(integration,/awardDungeonDefeatXp/,'outcome integration remains the XP authority');
assert.doesNotMatch(ui,/rollEnemyLoot|awardDungeonDefeatXp|rewardSummaryHtml/,'Tactical UI must neither calculate nor own Dungeon reward presentation');
console.log('GenSrpG V114.11 victory contract: integration rewards -> Bridge summary -> existing Dungeon modal');
