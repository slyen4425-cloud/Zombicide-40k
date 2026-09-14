const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const sw=read('service-worker.js');

// Wall: every active tactical layer must use the Builder asset directly with cover; nobody may clear the image.
assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/);
assert.match(ui,/\.gtv2Cell\.blocked\{background:#171512 url\('\$\{WALL_ASSET\}'\) center\/cover no-repeat!important;filter:none!important\}/);
for(const [name,src] of [['ui',ui],['v111',v111],['v112',v112],['v113',v113]]){
  assert.doesNotMatch(src,/const WALL_ASSET="assets\/dungeon\/creatures\/dungeon_wall\.png"/,name+' must not own the retired wall asset');
  assert.doesNotMatch(src,/background-image:none!important/,name+' must never clear a live wall before repaint');
}
assert.match(v111,/const WALL_SIZE="cover"/);
assert.doesNotMatch(v112,/gtv2112DiceRoll/,'V112 must not add a second dice animation');
assert.doesNotMatch(v113,/setInterval\(tick,55\)/,'V113 680ms dice reel must be retired');
assert.match(v113,/function animateDiceOverlay\(rt=R\)\{return false\}/);

// Dice: only base tactical UI owns presentation. It uses one 240ms sequence and never calls Element.animate.
const diceStart=ui.indexOf('async function showDiceResult');
const diceEnd=ui.indexOf('function nearestOpponent',diceStart);
assert.ok(diceStart>0&&diceEnd>diceStart);
const diceFn=ui.slice(diceStart,diceEnd);
assert.match(diceFn,/gtv21146DiceRow/);
assert.match(diceFn,/setTimeout\(resolve,240\)/);
assert.doesNotMatch(diceFn,/\.animate\(/);
assert.match(v111,/function paintDiceOverlay\(rt=R\)\{return false\}/);
assert.doesNotMatch(integration,/loadFinal1145|gens-rpg-tactical-wall-dice-stats-16781145\.js/,'failed V114.5 overlay must no longer load');

// Stats: V110 remains the single canonical snapshot engine and must be evaluated in the real hero context.
const Stats=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
const state={rpgAttributes:{force:19,agilite:14,defense:11,movement:4},wounds:1};
let reads=0;
const rt={
  current:'other',state:{marker:'old'},
  loadState:id=>id==='hero'?state:{},
  CHARS:{hero:{id:'hero',dungeonStats:{force:19,agilite:14,defense:11,movement:4}}},
  GensCleanRpgStats167874:{
    runtimeDefs:()=>[
      {id:'force',name:'Force',icon:'💪',defaultValue:10},
      {id:'agilite',name:'Agilité',icon:'🏃',defaultValue:10},
      {id:'defense',name:'Défense',icon:'🛡️',defaultValue:10},
      {id:'movement',name:'Mouvement',icon:'👣',defaultValue:3}
    ],
    value(id,sid){reads++;assert.equal(id,'hero');assert.equal(rt.current,'hero','canonical read must run with the real hero as current');assert.equal(rt.state,state,'canonical read must use the real hero runtime state');return state.rpgAttributes[sid]}
  },
  effectiveMaxWounds:()=>20,dungeonHeroMoveValue083:()=>4,dungeonDerivedInitiative:()=>12,dungeonDerivedDefense:()=>11,dungeonArmorScore:()=>2,dungeonDodgeChance:()=>8,dungeonCriticalChance:()=>6,dungeonMagicResistance:()=>3,dungeonMaxMana:()=>0,dungeonPhysicalDamageBonus:()=>0,dungeonMagicDamageBonus:()=>0,loadDungeonRpgRules:()=>({critMultiplier:2})
};
const actor={id:'hero',side:'hero',hp:19,maxHp:20,movement:3,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero'}};
const snap=Stats.buildHeroSnapshot(rt,'hero',actor);
assert.equal(snap.values.force,19);assert.equal(snap.values.agilite,14);assert.equal(snap.values.defense,11);assert.equal(snap.values.movement,4);assert.equal(reads,4);
assert.equal(rt.current,'other');assert.deepEqual(rt.state,{marker:'old'},'hero context must be restored after snapshot');
assert.match(v113,/GensRpgTacticalStats1678110\?\.decorateBattle\?\.\(realRt,battle,\{force:true\}\)/,'final V113 scope wrapper must reassert the canonical V110 snapshot once');

assert.match(sw,/gensrpg-cache-16\.78\.114\.6-consolidated-tactical-runtime/);
assert.doesNotMatch(sw,/"\.\/assets\/gensrpg\/gens-rpg-tactical-wall-dice-stats-16781145\.js"/);
console.log('V16.78.114.6 consolidated wall + single short dice + canonical stats authority: OK');
