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

assert.ok(core200.includes(legacyCellCall),
  'lot 4M characterization expects the Runtime 2.00 cell button to still use the legacy local startCombat path before migration');
assert.match(core200,/if\(target\)\{[\s\S]*?b\.textContent='⚔️ ATTAQUER '\+enemyName\(target\)\.toUpperCase\(\)[\s\S]*?startCombat\(\[String\(target\.id\)\],'cell'\)/,
  'cell combat starts only from the enemy occupying the active hero cell and preserves the ATTACK label');

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
  'current Runtime 2.00 reinforcement contract is 65% at distance 1, 30% at distance 2, otherwise 0');
assert.match(nearbyBody,/if\(chance&&Math\.random\(\)\*100<chance\)out\.push\(e\)/,
  'reinforcement inclusion remains probabilistic and Dungeon-owned');
assert.doesNotMatch(nearbyBody,/reinforcementRange/,
  'this live Runtime 2.00 path currently has no configurable reinforcementRange and the migration must not invent one');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'Runtime 2.00 startCombat body must remain available for lot 4M characterization');
const startBody=startMatch[1];
assert.match(startBody,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'cell flow first re-filters the requested target through liveEnemies');
assert.match(startBody,/if\(reason==='cell'&&chosen\[0\]\)\{extras=nearbyInterveners\(chosen\[0\],x\);chosen=\[\.\.\.chosen,\.\.\.extras\.filter\(e=>!chosen\.some\(c=>String\(c\.id\)===String\(e\.id\)\)\)\]\}/,
  'cell flow merges only unique Dungeon-selected nearby reinforcements into the chosen enemy set');
assert.match(startBody,/const begin=\(\)=>launchCombat200\(x,chosen\)/,
  'legacy cell flow sends exactly its chosen target plus selected reinforcements to the legacy launcher');
assert.match(startBody,/if\(extras\.length\)\{[\s\S]*?modal\('⚔️ RENFORTS ENNEMIS',[\s\S]*?,begin\);return true\}/,
  'when reinforcements join, the Dungeon modal must be shown before combat begins');
assert.doesNotMatch(startBody,/COMBAT ENGAGÉ/,
  'the current live cell path has no generic COMBAT ENGAGÉ popup; lot 4M must preserve the real behavior rather than an obsolete assumption');

assert.equal(Bridge.isV113DetectionReason('cell'),false,
  'cell is not a V113 detection reason and must not be treated as ambush/detection');
assert.match(bridgeSource,/const selection=authority\.selectCombatants\(rt,prepared\.options\|\|\{\}\)/,
  'Bridge scoped routing still delegates final combatant scope to V113 selectCombatants');

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
  'a mechanical Bridge request for only the cell target can be expanded by V113 selectCombatants with another visible enemy');

console.log('GenSrpG combat lot 4M characterization OK: Dungeon owns cell target/reinforcement selection; direct Bridge routing would not preserve the exact legacy enemy set without a narrow contract');
