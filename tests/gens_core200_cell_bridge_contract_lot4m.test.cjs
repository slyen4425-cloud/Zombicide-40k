const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const Authority=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core200=scriptBody('dungeonCore200Rebuild');
const oldCellCall="b.onclick=()=>startCombat([String(target.id)],'cell')";
assert.ok(!core200.includes(oldCellCall),
  'lot 4M target contract requires the Runtime 2.00 cell button to leave the legacy local startCombat callsite');
assert.match(core200,/if\(target\)\{[\s\S]*?b\.textContent='⚔️ ATTAQUER '\+enemyName\(target\)\.toUpperCase\(\)[\s\S]*?startCellCombat\(target,x\)/,
  'cell button must delegate Dungeon preparation to the dedicated cell helper');
assert.match(core200,/function startCellCombat\(target,x=rt\(\)\)\{[\s\S]*?nearbyInterveners\(chosen\[0\],x\)[\s\S]*?reason:'cell'[\s\S]*?entry:'dc200CellAction'[\s\S]*?limitEnemyIdsToRequest:true[\s\S]*?modal\('⚔️ RENFORTS ENNEMIS'/,
  'Dungeon cell helper must preserve target/reinforcement selection and its reinforcement modal while entering through the canonical Bridge');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'legacy Runtime 2.00 startCombat compatibility function must remain present');
assert.doesNotMatch(startMatch[1],/reason==='cell'/,
  'after lot 4M, legacy startCombat must no longer own cell-specific reinforcement preparation');

assert.match(bridgeSource,/limitEnemyIdsToRequest===true/,
  'Bridge must expose a narrow option that prevents V113 from adding enemies beyond an already selected Dungeon set');
assert.match(bridgeSource,/selection\.enemyIds[\s\S]*?filter\([\s\S]*?requestedEnemyIds/,
  'Bridge must still call V113 selectCombatants and only constrain its resulting enemy list to the requested Dungeon set');

function makeRuntime(){
  const state={
    participants:['h1'],index:0,room:1,
    heroRooms:{h1:1},positions:{h1:0},
    last:{map:{size:5,cells:Array(25).fill('floor')}},
    enemyCells:{target:1,reinforcement:4,visibleExtra:2}
  };
  const enemies=[
    {id:'target',enemyId:'target',hp:5,dungeonRoom:1,vision:1},
    {id:'reinforcement',enemyId:'reinforcement',hp:5,dungeonRoom:1,vision:1},
    {id:'visibleExtra',enemyId:'visibleExtra',hp:5,dungeonRoom:1,vision:3}
  ];
  const opened=[];
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    loadDungeonState:()=>state,
    loadActiveEnemies:()=>enemies,
    activeEnemyDefinition:()=>null,
    dungeonEnemyDerivedForInstance:()=>({}),
    GensRpgTacticalCombatV2:{},
    GensRpgTacticalCombatV2Adapter:{
      participants:()=>['h1'],
      enteredParticipants:(_rt,ids)=>ids,
      activeEnemies:()=>enemies
    },
    GensRpgTacticalCombatV2Ui:{
      getBattle:()=>null,
      openCurrentEncounter:opts=>{opened.push({...opts});return {winner:null}}
    },
    GensRpgTacticalRuntimeAuthority1678113:Authority,
    document:{body:{style:{}}},
    dispatchEvent:()=>{}
  };
  return {rt,opened};
}

{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['target'],reason:'cell',entry:'lot4m-default-expansion'});
  assert.equal(result.ok,true,'ordinary cell-shaped Bridge request should be openable in the characterization mock');
  assert.deepEqual(opened[0].enemyIds,['target','visibleExtra'],
    'without the narrow lot 4M option, V113 is allowed to expand the requested seed with another visible enemy');
}
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['target'],reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true});
  assert.equal(result.ok,true,'Dungeon cell target route should be openable through the canonical Bridge');
  assert.deepEqual(opened[0].enemyIds,['target'],
    'Dungeon cell route must not gain a visible enemy that nearbyInterveners did not select');
}
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['target','reinforcement'],reason:'cell',entry:'dc200CellAction',limitEnemyIdsToRequest:true});
  assert.equal(result.ok,true,'Dungeon-selected reinforcement route should be openable through the canonical Bridge');
  assert.deepEqual(opened[0].enemyIds,['target','reinforcement'],
    'Dungeon-selected target plus reinforcement must survive V113 scoping without adding a third visible enemy');
}

console.log('GenSrpG combat lot 4M target contract OK: Dungeon keeps exact cell enemy selection, Bridge/V113 keeps canonical hero/scope authority');
