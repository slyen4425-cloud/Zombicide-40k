const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'));

assert.equal(P.APP_VERSION,'16.78.114.1');
assert.equal(P.DEFAULT_ENEMY_VISION,3);
assert.equal(P.HEARTBEAT_MS,450);

function storage(initial={}){const data={...initial};return {getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,setItem:(k,v)=>{data[k]=String(v)}}}
function liveState(){return {
  room:1,index:0,participants:['h1','h2'],heroRooms:{h1:1,h2:2},positions:{h1:6,h2:7},enemyCells:{e1:8},
  last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}
}}
const enemies=[{id:'e1',enemyId:'goblin',hp:5,dungeonRoom:1}];
const rt={
  localStorage:storage({gensrpg_dungeon_runtime_v2:JSON.stringify(liveState())}),
  loadDungeonState:()=>({room:99,index:0,participants:['stale'],positions:{stale:0},enemyCells:{},last:{map:{width:2,height:2,cells:Array(4).fill('floor')}}}),
  loadActiveEnemies:()=>enemies,
  activeEnemyDefinition:()=>({rule:{range:1}}),
  dungeonEnemyDerivedForInstance:()=>({}),
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null},
  GensRpgTacticalRuntimeAuthority1678113:{
    heroScope:(state,id)=>({room:state.heroRooms[id]??state.room,branchSourceId:''}),
    enemyScope:(state,e)=>({room:e.dungeonRoom,branchSourceId:''})
  }
};

assert.equal(P.runtimeState(rt).room,1,'live localStorage Dungeon runtime must win over stale legacy state');
assert.equal(P.enemyVision(rt,enemies[0]),3,'melee range 1 must not collapse default vision below 3 cells');
assert.deepEqual(P.detectionPairs(rt).map(x=>[x.enemyId,x.heroId,x.distance]),[['e1','h1',2]],'enemy must see the in-room hero while ignoring the hero in another room');
let started=null;rt.dc200StartCombat=(ids,reason)=>{started={ids,reason};return true};
assert.deepEqual(P.scanDetection(rt,'ambush-runtime-test',true),['e1']);
assert.deepEqual(started,{ids:['e1'],reason:'auto-engage-v114'},'live V114 detection remains active');

{
  const blocked=liveState();blocked.last.map.cells[7]='wall';rt.localStorage=storage({gensrpg_dungeon_runtime_v2:JSON.stringify(blocked)});
  assert.deepEqual(P.detectionPairs(rt),[],'a wall between enemy and hero must still block vision');
}
{
  const explicit={...rt,loadActiveEnemies:()=>[{id:'e1',enemyId:'goblin',hp:5,dungeonRoom:1,vision:1}]};
  explicit.localStorage=storage({gensrpg_dungeon_runtime_v2:JSON.stringify(liveState())});
  assert.equal(P.enemyVision(explicit,explicit.loadActiveEnemies()[0]),1,'explicit enemy vision remains authoritative');
  assert.deepEqual(P.detectionPairs(explicit),[],'explicit vision 1 cannot see a hero two cells away');
}

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/saveActiveEnemies/,'ambush spawn persistence must keep triggering a detection rescan');
assert.match(source,/DungeonCore01/,'post-render detection must keep using the real Dungeon board seam');
assert.match(source,/HEARTBEAT_MS=450/,'low-frequency exploration fallback remains active only outside combat');
assert.match(source,/coherence\(rt\)\?\.markWallCells/,'wall rendering must be handed back to the pre-V114 V112 layer');
assert.match(source,/coherence\(rt\)\?\.patchDice/,'dice/result presentation must be handed back to the pre-V114 V112 layer');
assert.doesNotMatch(source,/setInterval\(tick,48\)/,'V114 synthetic D100 cycling must be removed');
assert.doesNotMatch(source,/function paintWalls/,'V114 must no longer own wall painting');
assert.doesNotMatch(source,/ROLL_DURATION/,'V114 must no longer lengthen dice rolls');
assert.match(source,/\.gtv2113DiceRow,.gtv2114RollStage\{display:none!important\}/,'V113/V114 extra dice animation layers must be suppressed without touching the base V112 result UI');
assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.113/,'V113 room scope layer must remain loaded');
assert.match(integration,/gens-rpg-tactical-hotfix-1678114\.js\?v=16\.78\.114/,'the final vision hotfix module must remain loaded');
assert.match(sw,/gensrpg-cache-16\.78\.114\.1-keep-vision-revert-wall-dice/);
assert.match(sw,/gens-rpg-tactical-hotfix-1678114\.js/);

console.log('V16.78.114.1 live enemy vision retained; wall and dice visuals rolled back to V112: OK');