const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));

assert.equal(P.APP_VERSION,'16.78.114.1');
assert.equal(P.DEFAULT_ENEMY_VISION,3);
assert.equal(P.HEARTBEAT_MS,450);
assert.equal(V.APP_VERSION,'16.78.114.9');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.WRONG_WALL_ASSET,'assets/dungeon/creatures/dungeon_wall.png');
assert.equal(V.DICE_WATCHDOG_MS,0,'V114.9 must not start a second dice animation/watchdog');
assert.ok(V.TRANSITION_MS<=650,'exploration-to-combat transition must stay short');
assert.equal(V.status().observer,false,'combat DOM must not use the V114.8 broad observer');

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
assert.deepEqual(started,{ids:['e1'],reason:'auto-engage-v114'},'validated live V114 engagement must remain active');

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
  const fake={sessionStorage:storage()};let calls=0;fake.dc200StartCombat=()=>{calls++;return true};
  V.setEmergencyEscape(fake,2000);V.guardCombatStart(fake);
  const out=fake.dc200StartCombat(['e1'],'auto-engage-v114');
  assert.equal(out.reason,'menu-escape-v1149','Retour menu must suppress immediate re-engagement');
  assert.equal(calls,0,'guarded emergency menu exit must not reopen combat');
}

assert.equal(V.thresholdForChance(36,true),65);
for(const [roll,hit] of [[1,false],[20,false],[50,false],[64,false],[65,true],[80,true],[92,true],[95,true],[100,true]])assert.equal(V.displayHit(roll,36,true),hit,`high-roll ${roll}`);
for(const [roll,hit] of [[1,true],[20,true],[36,true],[50,false],[80,false],[92,false],[95,false],[100,false]])assert.equal(V.displayHit(roll,36,false),hit,`low-roll ${roll}`);

const hitRuntime={GensRpgTacticalCombatV2:E};
assert.equal(V.patchHitResolver(hitRuntime),true);
function battleFor(hit=36,dice=1,high=true){
  const s=E.createBattle({grid:{width:5,height:4},actors:[
    {id:'h',side:'hero',x:1,y:1,hp:20,initiative:20,attacks:[{id:'a',range:1,hit,power:3,tags:[`dice:${dice}`]}]},
    {id:'e',side:'enemy',x:2,y:1,hp:30,initiative:1,defense:0,dodge:0,attacks:[{id:'x',range:1,hit:70,power:1}]}
  ]});s.config.rollHighToHit=high;return s;
}
{
  const s=battleFor(36,1,true),r=E.resolveAttack(s,'h','e','a',9);
  assert.equal(r.roll,92);assert.equal(r.hitTarget,65);assert.equal(r.hit,true);assert.deepEqual(r.rollsDisplay,[92]);
}
{
  const s=battleFor(36,1,false),r=E.resolveAttack(s,'h','e','a',20);
  assert.equal(r.roll,20);assert.equal(r.hitTarget,36);assert.equal(r.hit,true);
}
{
  const s=battleFor(36,3,true),r=E.resolveAttack(s,'h','e','a',[9,91,21]);
  assert.deepEqual(r.rollsDisplay,[92,10,80]);assert.equal(r.hits,2);assert.equal(r.hit,true);
}

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'),'utf8');
const visual=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const builder=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/saveActiveEnemies/,'ambush spawn persistence must keep triggering a detection rescan');
assert.match(source,/DungeonCore01/,'post-render detection must keep using the real Dungeon board seam');
assert.match(source,/HEARTBEAT_MS=450/,'low-frequency exploration fallback remains active only outside combat');
assert.match(source,/coherence\(rt\)\?\.patchDice/,'V114.1 keeps the readable V112 combat explanations');
assert.doesNotMatch(source,/setInterval\(tick,48\)/,'old V114 synthetic D100 cycling must remain removed');

assert.match(builder,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/,'Dungeon Builder remains the wall asset reference');
assert.match(visual,/gtv21149WallTile/,'walls must use the V114.9 real IMG layer');
assert.match(visual,/z-index:2147483000!important/,'wall image must sit above old pseudo layers');
assert.match(visual,/background-color","#171512"/,'wall fallback must be dark instead of white');
assert.match(visual,/patchDungeonMapHtml/,'generated Dungeon walls must receive their IMG before insertion');
assert.doesNotMatch(visual,/new\s+(?:rt\?\.)?MutationObserver|new\s+MutationObserver/,'broad wall observer that froze engagement must remain removed');
assert.match(visual,/if\(str\(b\.textContent\)\.trim\(\)!=="🏠 Retour menu"\)/,'combat menu text writes must be idempotent');
assert.match(visual,/const name=typeof U\.openCurrentEncounter===/,'only one tactical open entry point may be wrapped');
assert.doesNotMatch(visual,/animateRpgDiceFast/,'V114.9 must not layer another dice animation over the established short presentation');
assert.doesNotMatch(visual,/setInterval\s*\(/,'V114.9 must never animate D100 with an interval');
assert.match(visual,/__gensRpg1149DirectD100/,'V114.9 must own hit resolution once after all older wrappers');
assert.match(visual,/displayHit\(shown,p\.hitChance,high\)/,'actual hit must be evaluated from the visible roll');

assert.match(visual,/ENNEMI REPÉRÉ/,'automatic engagement keeps a readable transition');
assert.match(visual,/Retour menu/,'emergency Retour menu remains available');
assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.113/,'V113 room scope layer must remain loaded');
assert.match(integration,/gens-rpg-tactical-hotfix-1678114\.js\?v=16\.78\.114\.1/,'validated V114.1 live vision must remain loaded');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js\?v=16\.78\.114\.9/,'final runtime must load V114.9 with a fresh URL');
assert.match(sw,/gensrpg-cache-16\.78\.114\.9-wall-engagement-freeze/,'PWA cache must be V114.9');

console.log('V16.78.114.9: engagement freeze removed; visible D100 preserved; topmost wall bitmap + menu UX OK');