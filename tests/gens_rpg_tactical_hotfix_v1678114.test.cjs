const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(P.APP_VERSION,'16.78.114.1');
assert.equal(P.DEFAULT_ENEMY_VISION,3);
assert.equal(P.HEARTBEAT_MS,450);
assert.equal(V.APP_VERSION,'16.78.114.2');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');

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
{
  const ctx={getActiveGameProfile:()=>({id:'p1',gameStyle:'dungeon'})};
  let inside='';V.withSurvivalContext(ctx,()=>{inside=ctx.getActiveGameProfile().gameStyle});
  assert.equal(inside,'survival','V114.2 must deliberately route the tactical D100 through the Survival animation');
  assert.equal(ctx.getActiveGameProfile().gameStyle,'dungeon','the temporary Survival animation context must be fully restored');
}

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'),'utf8');
const visual=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/saveActiveEnemies/,'ambush spawn persistence must keep triggering a detection rescan');
assert.match(source,/DungeonCore01/,'post-render detection must keep using the real Dungeon board seam');
assert.match(source,/HEARTBEAT_MS=450/,'low-frequency exploration fallback remains active only outside combat');
assert.match(source,/coherence\(rt\)\?\.markWallCells/,'V114.1 keeps the validated pre-V114 wall seam available');
assert.match(source,/coherence\(rt\)\?\.patchDice/,'V114.1 keeps the readable V112 combat explanations');
assert.doesNotMatch(source,/setInterval\(tick,48\)/,'V114 synthetic D100 cycling must remain removed');
assert.doesNotMatch(source,/ROLL_DURATION/,'V114.1 must not lengthen dice rolls');

assert.match(visual,/dng_wall_block\.jpg/,'V114.2 must use exactly the Dungeon Builder wall asset');
assert.match(visual,/background-size","cover"/,'walls must be scaled directly like floor tiles');
assert.match(visual,/gtv2Cell\.blocked\.cover::after/,'the useless tactical wall/cover icon must be suppressed');
assert.match(visual,/font-size","0"/,'legacy wall text/icon must be hidden');
assert.match(visual,/animateRpgDiceDispatch/,'tactical D100 must reuse the already configured Survival dice dispatcher');
assert.match(visual,/data-v113-dice/,'V113 synthetic dice overlay must be blocked before its mutation observer can replace the native Survival animation');
assert.match(visual,/gtv21142Rolling \.gtv2112Explain/,'result explanations must be hidden only while the die is moving, then remain available');
assert.doesNotMatch(visual,/dungeon_wall\.png/,'the wrong V113 wall asset must never be used by the final visual authority');
assert.doesNotMatch(visual,/setInterval\(tick/,'V114.2 must not reintroduce synthetic random-number cycling');

assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.113/,'V113 room scope layer must remain loaded');
assert.match(integration,/gens-rpg-tactical-hotfix-1678114\.js\?v=16\.78\.114\.1/,'validated V114.1 live vision must remain loaded');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js\?v=16\.78\.114\.2/,'V114.2 visual/dice authority must load last');
assert.match(sw,/gensrpg-cache-16\.78\.114\.2-builder-wall-survival-dice/);
assert.match(sw,/gens-rpg-tactical-visual-dice-16781142\.js/);

console.log('V16.78.114.2: live vision preserved; Builder wall asset unified; Survival dice animation reused: OK');