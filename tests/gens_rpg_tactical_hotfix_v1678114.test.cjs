const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-hotfix-1678114.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(P.APP_VERSION,'16.78.114.1');
assert.equal(P.DEFAULT_ENEMY_VISION,3);
assert.equal(P.HEARTBEAT_MS,450);
assert.equal(V.APP_VERSION,'16.78.114.3');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.WRONG_WALL_ASSET,'assets/dungeon/creatures/dungeon_wall.png');
assert.ok(V.DICE_WATCHDOG_MS<=800,'tactical D100 watchdog must stay short');
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
  assert.equal(out.reason,'menu-escape-v1143','Retour menu must suppress immediate re-engagement');
  assert.equal(calls,0,'guarded emergency menu exit must not reopen combat');
}
{
  const fake={GensRpgTacticalCombatV2Ui:{getBattle:()=>({log:[{type:'attack',rollsDisplay:[72,44]}]})}};
  const card={querySelector(sel){if(sel==='.gtv2DiceRule')return {textContent:'Réussite si D100 ≥ 51 · jet obtenu : 72'};if(sel==='.gtv2DiceRule strong')return {textContent:'72'};return null}};
  assert.deepEqual(V.diceInfo(fake,card),{rolls:[72,44],threshold:51,high:true});
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
assert.doesNotMatch(source,/ROLL_DURATION/,'V114.1 must not lengthen dice rolls');

assert.match(builder,/WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/,'Dungeon Builder remains the wall asset authority reference');
assert.match(builder,/background-size","cover"/,'Builder wall scaling remains cover/center');
assert.match(visual,/WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/,'final tactical wall asset must exactly match Builder');
assert.match(visual,/rewriteWrongWallStyles/,'old style sheets that still mention dungeon_wall.png must be rewritten at runtime');
assert.match(visual,/patchStyleSetProperty/,'late V107/V113 inline repaint attempts must be intercepted');
assert.match(visual,/background-size","cover"/,'generated Dungeon and tactical walls must use cover scaling');
assert.match(visual,/filter","none"/,'tactical wall must not receive the old dark filter');
assert.match(visual,/gtv2Cell\.blocked\.cover::after/,'the useless tactical wall/cover icon must be suppressed');
assert.match(visual,/font-size","0"/,'legacy wall text/icon must be hidden');

assert.match(visual,/animateRpgDiceFast/,'tactical D100 must use the proven short mobile reel');
assert.doesNotMatch(visual,/withSurvivalContext/,'V114.3 must never force the slow native Survival context');
assert.doesNotMatch(visual,/animateRpgDiceDispatch/,'V114.3 must not start a second native Survival animation');
assert.doesNotMatch(visual,/setInterval\s*\(/,'V114.3 must not use random-number interval animation');
assert.match(visual,/data-v113-dice/,'V113 synthetic dice row must be blocked before its observer can start');
assert.match(visual,/gtv2111DiceRow/,'V111 must not replace the active fast-reel host during animation');
assert.match(visual,/gtv21143Rolling \.gtv2112Explain/,'result explanation is hidden only during animation and remains after it');
assert.match(visual,/DICE_WATCHDOG_MS=780/,'dice sequence must not linger after result');

assert.match(visual,/ENNEMI REPÉRÉ/,'automatic engagement needs a readable exploration-to-combat transition');
assert.match(visual,/ENGAGEMENT/,'combat transition must state what is happening');
assert.match(visual,/Retour menu/,'Quitter must be replaced with emergency Retour menu');
assert.match(visual,/removeAttribute\?\.\("data-close"\)/,'legacy Quitter action must be removed from tactical top bar');
assert.match(visual,/menu-escape-v1143/,'emergency menu exit must block instant re-engagement');

assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.113/,'V113 room scope layer must remain loaded');
assert.match(integration,/gens-rpg-tactical-hotfix-1678114\.js\?v=16\.78\.114\.1/,'validated V114.1 live vision must remain loaded');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js\?v=16\.78\.114\.3/,'V114.3 final tactical UX authority must load last');
assert.match(sw,/gensrpg-cache-16\.78\.114\.3-wall-dice-transition-menu/);
assert.match(sw,/gens-rpg-tactical-visual-dice-16781142\.js/);

console.log('V16.78.114.3: live engagement preserved; wall repaint conflicts neutralized; short ordered D100 + transition/menu UX: OK');