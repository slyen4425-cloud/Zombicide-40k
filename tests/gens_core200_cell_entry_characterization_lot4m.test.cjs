const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const Authority=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core200=scriptBody('dungeonCore200Rebuild');
const legacyCellCall="b.onclick=()=>startCombat([String(target.id)],'cell')";

assert.ok(!core200.includes(legacyCellCall),
  'lot 4M permanent characterization requires the Runtime 2.00 cell button to stay off the legacy local startCombat callsite');
assert.match(core200,/if\(target\)\{[\s\S]*?b\.textContent='⚔️ ATTAQUER '\+enemyName\(target\)\.toUpperCase\(\)[\s\S]*?startCellCombat\(target,x\)/,
  'cell combat must still start only from the enemy occupying the active hero cell and preserve the ATTACK label');

const nearbyMatch=core200.match(/function nearbyInterveners\(target,x\)\{([\s\S]*?)\n return out\}/);
assert.ok(nearbyMatch,'nearbyInterveners must remain present as the Dungeon-owned reinforcement selector');
const nearbyBody=nearbyMatch[1];
assert.match(nearbyBody,/const base=Number\(x\.enemyCells\?\.\[target\.id\]\)/,
  'reinforcement distance must stay anchored on the attacked enemy cell');
assert.match(nearbyBody,/liveEnemies\(\)\.forEach\(e=>\{if\(String\(e\.id\)===String\(target\.id\)\)return/,
  'reinforcement candidates must come from liveEnemies and exclude the attacked target');
assert.match(nearbyBody,/const d=Math\.abs\([\s\S]*?\)\+Math\.abs\([\s\S]*?\)/,
  'reinforcement distance remains Manhattan distance on the Dungeon map');
assert.match(nearbyBody,/const chance=d===1\?65:d===2\?30:0/,
  'Runtime 2.00 reinforcement contract remains 65% at distance 1, 30% at distance 2, otherwise 0');
assert.match(nearbyBody,/if\(chance&&Math\.random\(\)\*100<chance\)out\.push\(e\)/,
  'reinforcement inclusion remains probabilistic and Dungeon-owned');
assert.doesNotMatch(nearbyBody,/reinforcementRange/,
  'this Runtime 2.00 path has no configurable reinforcementRange and lot 4M must not invent one');

const cellMatch=core200.match(/function startCellCombat\(target,x=rt\(\)\)\{([\s\S]*?)\}\nfunction launchCombat200\(/);
assert.ok(cellMatch,'Runtime 2.00 dedicated startCellCombat helper must remain present after lot 4M');
const cellBody=cellMatch[1];
assert.match(cellBody,/let chosen=liveEnemies\(\)\.filter\(e=>String\(e\.id\)===String\(target\.id\)\)/,
  'cell flow must re-filter the requested target through liveEnemies');
assert.match(cellBody,/const extras=nearbyInterveners\(chosen\[0\],x\)/,
  'cell flow must keep Dungeon-owned nearby reinforcement selection');
assert.match(cellBody,/chosen=\[\.\.\.chosen,\.\.\.extras\.filter\(e=>!chosen\.some\(c=>String\(c\.id\)===String\(e\.id\)\)\)\]/,
  'cell flow must merge only unique Dungeon-selected nearby reinforcements');
assert.match(cellBody,/GensRpgTacticalCombatV2Bridge\.requestCombat\(window,\{enemyIds:chosen\.map\(e=>String\(e\.id\)\),reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true\}\)/,
  'cell helper must enter combat through the canonical Bridge with the exact Dungeon-selected enemy set contract');
assert.match(cellBody,/if\(extras\.length\)\{[\s\S]*?modal\('⚔️ RENFORTS ENNEMIS',[\s\S]*?,begin\);return true\}/,
  'when reinforcements join, the Dungeon modal must still be shown before combat begins');
assert.doesNotMatch(cellBody,/COMBAT ENGAGÉ/,
  'cell path must keep the real behavior with no obsolete generic COMBAT ENGAGÉ popup');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'legacy Runtime 2.00 startCombat compatibility function must remain available');
assert.doesNotMatch(startMatch[1],/reason==='cell'/,
  'legacy startCombat must not regain cell-specific reinforcement ownership after lot 4M');

assert.equal(Bridge.isV113DetectionReason('cell'),false,
  'cell is not a V113 detection reason and must not be treated as ambush/detection');
assert.match(bridgeSource,/selection=authority\.selectCombatants\(rt,preparedOptions\)/,
  'Bridge scoped routing must still delegate canonical combatant scope to V113 selectCombatants');

const state={
  participants:['h1'],index:0,room:1,
  heroRooms:{h1:1},positions:{h1:0},
  last:{map:{size:5,cells:Array(25).fill('floor')}},
  enemyCells:{target:1,visibleExtra:2}
};
const enemies=[
  {id:'target',enemyId:'target',hp:5,dungeonRoom:1,vision:1},
  {id:'visibleExtra',enemyId:'visibleExtra',hp:5,dungeonRoom:1,vision:3}
];
const rt={
  loadDungeonState:()=>state,
  loadActiveEnemies:()=>enemies,
  GensRpgTacticalCombatV2Adapter:{participants:()=>['h1']},
  activeEnemyDefinition:()=>null,
  dungeonEnemyDerivedForInstance:()=>({})
};
const selection=Authority.selectCombatants(rt,{enemyIds:['target']});
assert.deepEqual(selection.heroIds,['h1'],'V113 characterization mock must keep the active entered hero');
assert.deepEqual(selection.enemyIds,['target','visibleExtra'],
  'V113 alone may expand a target seed, which is why the narrow Bridge limit remains required for Dungeon cell combat');

console.log('GenSrpG combat lot 4M permanent characterization OK: Dungeon owns cell target/reinforcements and Bridge/V113 owns canonical combat scope');
