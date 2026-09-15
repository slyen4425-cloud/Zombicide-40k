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
assert.equal(V.APP_VERSION,'16.78.114.11');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.WRONG_WALL_ASSET,'assets/dungeon/creatures/dungeon_wall.png');
assert.equal(V.DICE_WATCHDOG_MS,0,'V114.11 must not start a second dice animation/watchdog');
assert.ok(V.TRANSITION_MS<=650,'exploration-to-combat transition must stay short');

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
assert.deepEqual(started,{ids:['e1'],reason:'auto-engage-v114'},'legacy V114.1 detection behavior stays covered as a unit fixture');

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
  assert.equal(out.reason,'menu-escape-v1143','Retour menu must suppress immediate re-engagement');
  assert.equal(calls,0,'guarded emergency menu exit must not reopen combat');
}

// Visible D100 remains the authority.
assert.equal(V.thresholdForChance(36,true),65);
for(const [roll,hit] of [[1,false],[20,false],[50,false],[80,true],[92,true],[95,true],[100,true]])assert.equal(V.displayHit(roll,36,true),hit,`high-roll ${roll}`);
for(const [roll,hit] of [[1,true],[20,true],[50,false],[80,false],[92,false],[95,false],[100,false]])assert.equal(V.displayHit(roll,36,false),hit,`low-roll ${roll}`);

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
  assert.equal(r.roll,92,'result must expose the roll the player actually saw');
  assert.equal(r.hitTarget,65);assert.equal(r.hit,true,'visible 92 must hit visible D100 >= 65');
  assert.deepEqual(r.rollsDisplay,[92]);
}
{
  const s=battleFor(36,1,false),r=E.resolveAttack(s,'h','e','a',20);
  assert.equal(r.roll,20);assert.equal(r.hitTarget,36);assert.equal(r.hit,true,'low-roll 20 must hit D100 <= 36');
}
{
  const s=battleFor(36,3,true),r=E.resolveAttack(s,'h','e','a',[9,91,21]);
  assert.deepEqual(r.rollsDisplay,[92,10,80]);assert.equal(r.hits,2);assert.equal(r.hit,true,'multi-die result must use the same visible rule for every die');
}

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'),'utf8');
const visual=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const builder=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/saveActiveEnemies/,'legacy V114.1 unit fixture keeps spawn/detection behavior documented');
assert.match(source,/DungeonCore01/,'legacy V114.1 unit fixture keeps the historical board seam documented');
assert.match(source,/HEARTBEAT_MS=450/,'retired V114.1 file must continue documenting the heartbeat being removed from runtime');
assert.match(source,/observer\.observe\(D\.body/,'retired V114.1 file must continue documenting its body-wide observer');
assert.match(source,/coherence\(rt\)\?\.patchDice/,'V114.1 fixture keeps the historical V112 explanation bridge covered');
assert.doesNotMatch(source,/setInterval\(tick,48\)/,'old V114 synthetic D100 cycling must remain removed');

assert.match(builder,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/,'Dungeon Builder remains the wall asset reference');
assert.match(ui,/gtv2WallTile/,'the base tactical UI must own the real wall IMG');
assert.match(ui,/object-fit:cover!important/,'stable wall bitmap must scale like the Builder tiles');
assert.match(ui,/decoding="sync"/,'wall bitmap must be decoded from initial render HTML');
assert.match(ui,/insertAdjacentHTML\("afterbegin",wallTileHtml\(\)\)/,'Dungeon wall image must exist before live DOM insertion');
assert.doesNotMatch(visual,/new\s+rt\.MutationObserver|observer\.observe\s*\(/,'V114.11 final authority must not observe document.body');
assert.doesNotMatch(visual,/U\.render\s*=|core\[name\]\s*=/,'V114.11 must not wrap renderers again');
assert.doesNotMatch(visual,/patchStyleSetProperty/,'V114.11 must not globally intercept CSS style writes');
assert.doesNotMatch(visual,/animateRpgDiceFast/,'V114.11 must not layer another dice animation');
assert.doesNotMatch(visual,/setInterval\s*\(/,'V114.11 must never animate D100 with an interval');
assert.match(visual,/__gensRpg11411Damage/,'V114.11 must own final damage resolution after old wrappers');
assert.match(visual,/displayHit\(shown,calculation\.finalChance,high\)/,'actual hit must use final visible chance exactly once');
assert.match(visual,/resolveArmorFloor/,'historical armor-zero floor must be reconnected');
assert.match(visual,/physicalDamageBonus/,'canonical physical/melee damage bonus must be consumed');
assert.match(ui,/36 % de toucher|calculationSummary/,'UI must expose the real hit percentage and visible threshold');

assert.match(visual,/ENNEMI REPÉRÉ/,'automatic engagement keeps a readable transition');
assert.match(visual,/Retour menu/,'emergency Retour menu remains available');
assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.114\.10/,'V113/V114.10 scope authority must remain loaded');
assert.doesNotMatch(integration,/gens-rpg-tactical-hotfix-1678114\.js\?v=16\.78\.114\.1/,'retired V114.1 must no longer be dynamically loaded at runtime');
assert.doesNotMatch(integration,/GensRpgTacticalHotfix1678114\?\.installWithRetries/,'retired V114.1 must no longer be installed at runtime');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js/,'final tactical authority still loads last through the established module path');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js\?v=16\.78\.114\.11/,'V114.11 cache-busted final authority must load last');
assert.match(sw,/gensrpg-cache-16\.78\.114\.11-armor-melee-damage/,'V114.11 compatibility cache marker must remain present');
assert.match(sw,/gensrpg-cache-16\.78\.114\.11-native-ui-authority/,'native UI authority cleanup must rotate the active PWA cache');

console.log('V16.78.114.11: D100 + stable walls + canonical melee damage + armor floor + native UI authority OK');
