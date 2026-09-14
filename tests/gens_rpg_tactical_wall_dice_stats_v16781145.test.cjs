const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Fix=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-wall-dice-stats-16781145.js'));

assert.equal(Fix.APP_VERSION,'16.78.114.5');
assert.equal(Fix.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(Fix.DICE_MS,260);
assert.ok(Fix.DICE_MS<350,'tactical D100 must remain short on mobile');

// Regression: the rebuilt canonical stat path can return 0 when the hero is forced into the old current/native path.
// V114.5 must query the canonical engine detached from that obsolete seam, then keep native special bonuses.
const states={hero_a:{rpgAttributes:{force:17,defense:12,movement:4}}};
const rt={
  current:'hero_a',state:states.hero_a,
  loadState:id=>states[id]||{},
  CHARS:{hero_a:{id:'hero_a',name:'Hero A',dungeonStats:{force:15,defense:10,movement:3}}},
  GensCleanRpgStats167874:{
    runtimeDefs:()=>[
      {id:'force',name:'Force',icon:'💪',defaultValue:10,min:0,max:999},
      {id:'defense',name:'Défense',icon:'🛡️',defaultValue:10,min:0,max:999},
      {id:'movement',name:'Mouvement',icon:'👣',defaultValue:3,min:0,max:99}
    ],
    value(id,sid){
      if(this===null)throw new Error('unexpected this');
      if(rt.current===id)return 0; // simulate the obsolete legacy/native seam that caused combat zeros
      return Number(states[id]?.rpgAttributes?.[sid]??rt.CHARS[id]?.dungeonStats?.[sid]??0);
    }
  },
  dungeonEquipmentBonus(sid){return sid==='defense'?3:0},
  dungeonSkillEffectTotal(sid){return sid==='defense'?2:0},
  dungeonDodgeChance(){return 14},dungeonCriticalChance(){return 9},dungeonMagicResistance(){return 6},dungeonMaxMana(){return 20},
  loadDungeonRpgRules(){return {critMultiplier:2}}
};
const actor={id:'hero_a',side:'hero',hp:20,maxHp:25,movement:0,initiative:0,defense:0,armor:0,dodge:0,meta:{heroId:'hero_a'}};
const snap=Fix.buildLinkedSnapshot(rt,'hero_a',actor);
assert.equal(snap.linkVersion,'16.78.114.5');
assert.equal(snap.values.force,17,'Force must come from the rebuilt canonical hero stat, not the zero legacy seam');
assert.equal(snap.values.defense,17,'special native defense must keep canonical base + equipment + skill bonus');
assert.equal(snap.values.movement,4);
assert.equal(rt.current,'hero_a','snapshot build must restore current hero context');
assert.equal(rt.state,states.hero_a,'snapshot build must restore hero state context');

rt.GensRpgTacticalStats1678110={applyHeroSnapshot(a,s){a.meta.rpgStats=s;a.movement=s.derived.movement;a.initiative=s.derived.initiative;a.defense=s.derived.defense;a.armor=s.derived.armor;a.dodge=s.derived.dodge;return a}};
const battle={actors:[actor],meta:{}};
assert.equal(Fix.repairBattleStats(rt,battle,true),1);
assert.equal(actor.meta.rpgStats.values.force,17);
assert.equal(actor.defense,17);
assert.equal(actor.movement,4);
assert.equal(battle.meta.canonicalStatsLinkVersion,'16.78.114.5');

// One short tactical animation only: no 420/520/780ms stacked reel.
(async()=>{
  const classes=new Set();
  const card={
    querySelector(sel){return sel==='.gtv2DiceRule strong'?{textContent:'73'}:null},
    classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))}},
    setAttribute(){}
  };
  const die={
    textContent:'…',
    matches(sel){return sel==='.gtv2DiceCard > .gtv2Die[data-die]'},
    closest(){return card}
  };
  function nativeAnimate(){return {finished:Promise.resolve('native')}}
  const proto={animate:nativeAnimate};
  const diceRt={Element:{prototype:proto}};
  assert.equal(Fix.patchDice(diceRt),true);
  const start=Date.now();
  const anim=proto.animate.call(die,[],{});
  await anim.finished;
  const elapsed=Date.now()-start;
  assert.equal(die.textContent,'73');
  assert.ok(elapsed>=200&&elapsed<500,`D100 animation should settle quickly, got ${elapsed}ms`);
  assert.equal(classes.has('gtv21145Rolling'),false);

  const source=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-wall-dice-stats-16781145.js'),'utf8');
  const integration=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8');
  assert.match(source,/gtv21145WallPrepaint/,'generated wall cells must be marked before live DOM insertion');
  assert.match(source,/dungeonMapHtml/,'wall fix must patch the map HTML seam, not only repaint after render');
  assert.doesNotMatch(source,/WALL_ASSET="assets\/dungeon\/creatures\/dungeon_wall\.png"/);
  assert.match(integration,/gens-rpg-tactical-wall-dice-stats-16781145\.js\?v=16\.78\.114\.5/);
  assert.ok(integration.indexOf('loadFinal1145()')>integration.indexOf('GensRpgTacticalVisualDice16781142'),'V114.5 must load after the previous tactical UX layer');
  assert.match(sw,/gensrpg-cache-16\.78\.114\.5-wall-dice-stats/);
  assert.match(sw,/gens-rpg-tactical-wall-dice-stats-16781145\.js/);
  console.log('V16.78.114.5 wall prepaint + short D100 + canonical combat stats link OK');
})().catch(error=>{console.error(error);process.exitCode=1});
