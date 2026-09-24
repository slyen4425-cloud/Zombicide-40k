const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const clean=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const sw=read('service-worker.js');

// Wall: the Builder asset is the only tactical wall texture and the base UI never waits for a post-render repaint.
assert.match(ui,/const WALL_ASSET="assets\/dungeon\/creatures\/dng_wall_block\.jpg"/);
assert.match(ui,/gensTacticalWallPreload1147/);
assert.match(ui,/background:#171512 url\('\$\{WALL_ASSET\}'\) center\/cover no-repeat!important/);
assert.match(ui,/gtv2Cell\.blocked\.cover:after\{content:none!important;display:none!important\}/);
assert.doesNotMatch(ui,/new\s+(?:R\.)?MutationObserver/,'base UI must not own a repaint observer');
for(const [name,src] of [['ui',ui],['v111',v111],['v112',v112],['v113',v113]]){
  assert.doesNotMatch(src,/const WALL_ASSET="assets\/dungeon\/creatures\/dungeon_wall\.png"/,name+' must not own the retired wall asset');
  assert.doesNotMatch(src,/background-image:none!important/,name+' must never clear a live wall before repaint');
}
assert.match(v111,/const WALL_SIZE="cover"/);

// Dice: only base tactical UI owns the visual roll. No timeout/interval, and the result is not rendered before the roll overlay.
const diceStart=ui.indexOf('async function showDiceResult');
const diceEnd=ui.indexOf('function nearestOpponent',diceStart);
assert.ok(diceStart>0&&diceEnd>diceStart);
const diceFn=ui.slice(diceStart,diceEnd);
assert.match(diceFn,/gtv21147DiceRow/);
assert.match(diceFn,/getAnimations/);
assert.match(diceFn,/animation\.finished/);
assert.doesNotMatch(diceFn,/setTimeout\s*\(/);
assert.doesNotMatch(diceFn,/setInterval\s*\(/);
assert.doesNotMatch(diceFn,/\.animate\(/);
assert.match(ui,/gtv2WallTile/,'base UI must emit the wall bitmap directly');
assert.match(ui,/calculationSummary/,'base UI must expose the D100 calculation summary');
assert.match(ui,/const result=resolveVisibleAttack\(cur,target,id\);await showDiceResult\(cur,target,result,"Tour du héros"\);render\(\)/);
assert.match(ui,/const result=resolveVisibleAttack\(ai,target,choice\.a\.id\);await showDiceResult\(ai,target,result,"Tour ennemi"\);render\(\)/);
assert.match(v111,/function paintDiceOverlay\(rt=R\)\{return false\}/);
assert.match(v113,/function animateDiceOverlay\(rt=R\)\{return false\}/);
assert.doesNotMatch(integration,/loadFinal1145|gens-rpg-tactical-wall-dice-stats-16781145\.js/,'failed V114.5 overlay must remain retired');

// Stats: rebuilt rpgAttributes/dungeonStats are the canonical source even for the current hero.
assert.match(clean,/const VERSION="3\.5\.0",APP_VERSION="16\.78\.114\.7"/);
const baseStart=clean.indexOf('function baseValue');
const baseEnd=clean.indexOf('const compare=StatsNorm.compare;',baseStart);
assert.ok(baseStart>0&&baseEnd>baseStart);
const baseFn=clean.slice(baseStart,baseEnd);
assert.match(baseFn,/let n=customBase\(hero,id\)/);
assert.doesNotMatch(baseFn,/nativeAttr\.call/,'current hero core stats must not fall back to the retired native attribute reader');

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
    value(id,sid){reads++;assert.equal(id,'hero');assert.equal(rt.current,'hero');assert.equal(rt.state,state);return state.rpgAttributes[sid]}
  },
  effectiveMaxWounds:()=>20,dungeonHeroMoveValue083:()=>4,dungeonDerivedInitiative:()=>12,dungeonDerivedDefense:()=>11,dungeonArmorScore:()=>2,dungeonDodgeChance:()=>8,dungeonCriticalChance:()=>6,dungeonMagicResistance:()=>3,dungeonMaxMana:()=>0,dungeonPhysicalDamageBonus:()=>0,dungeonMagicDamageBonus:()=>0,loadDungeonRpgRules:()=>({critMultiplier:2})
};
const actor={id:'hero',side:'hero',hp:19,maxHp:20,movement:3,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero'}};
const snap=Stats.buildHeroSnapshot(rt,'hero',actor);
assert.equal(snap.values.force,19);assert.equal(snap.values.agilite,14);assert.equal(snap.values.defense,11);assert.equal(snap.values.movement,4);assert.equal(reads,4);
assert.equal(rt.current,'other');assert.deepEqual(rt.state,{marker:'old'});
assert.match(v113,/GensRpgTacticalStats1678110\?\.decorateBattle\?\.\(realRt,battle,\{force:true\}\)/,'final V113 scope wrapper must reassert the canonical V110 snapshot once');

assert.match(sw,/gensrpg-cache-16\.78\.114\.9-browser-profiled-combat/);
assert.doesNotMatch(sw,/"\.\/assets\/gensrpg\/gens-rpg-tactical-wall-dice-stats-16781145\.js"/);
console.log('V16.78.114.9 single-render walls + one D100 animation + canonical stats guards: OK');
