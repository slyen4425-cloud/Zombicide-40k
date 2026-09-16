const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'));

assert.equal(P.APP_VERSION,'16.78.111');
assert.equal(P.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(P.WALL_SIZE,'cover');

{
  const sword={id:'sword',name:'Épée',tags:['melee'],meta:{dice:2}};
  assert.equal(P.attackDice(sword),2,'weapon dice must survive as an explicit combat value');
  P.preserveDiceTag(sword);
  assert.equal(sword.dice,2);
  assert.ok(sword.tags.includes('dice:2'),'dice count must survive the isolated engine through tags');
}

{
  const actor={id:'hero',side:'hero',meta:{heroId:'hero'},attacks:[]};
  const battle={actors:[actor]};
  let calls=0;
  const rt={
    GensRpgTacticalCombatV2Adapter:{heroAttacks(){calls++;return [{id:'sword',name:'Épée',power:7,minRange:0,maxRange:1,tags:['melee'],meta:{dice:2}}]}},
    GensRpgTacticalPolish1678109:{normalizeActorRanges(){}},
    GensRpgTacticalStats1678110:{decorateBattle(){}},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>battle}
  };
  assert.equal(P.refreshBattleAttacks(rt,battle),1);
  assert.equal(calls,1,'canonical/equipment attack derivation is rebuilt once, not per render');
  assert.equal(actor.attacks[0].power,7);
  assert.equal(P.attackDice(actor.attacks[0]),2);
}

{
  const state={status:'active',config:{rollHighToHit:false},rngSeed:1,log:[],actors:[
    {id:'h',side:'hero',actionsLeft:1,attacks:[{id:'sword',actionCost:1,tags:['melee','dice:2'],meta:{dice:2}}]},
    {id:'e',side:'enemy',hp:10,maxHp:10,alive:true,attacks:[]}
  ]};
  const E={
    currentActor:s=>s.actors[0],
    actorById:(s,id)=>s.actors.find(x=>x.id===id)||null,
    attackPreview(){return {ok:true,attack:state.actors[0].attacks[0],hitChance:50,damage:3,critChance:0,critMultiplier:2,damageType:'physical'}},
    resolveAttack(){throw new Error('single-die resolver should not be used for a two-die weapon')},
    refreshOutcome(){}
  };
  const rt={GensRpgTacticalCombatV2:E};
  assert.equal(P.hookMultiDice(rt),true);
  const out=E.resolveAttack(state,'h','e','sword',[10,90]);
  assert.equal(out.dice,2);
  assert.equal(out.hits,1);
  assert.deepEqual(out.rollsDisplay,[10,90]);
  assert.equal(out.damage,3);
  assert.equal(state.actors[1].hp,7);
  assert.equal(state.actors[0].actionsLeft,0,'all weapon dice belong to one combat action');
}

{
  const state={room:4,participants:['h1','h2'],heroRooms:{h1:4,h2:4},positions:{h1:0,h2:6},enemyCells:{e1:8},last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}};
  const enemy={id:'e1',enemyId:'archer',hp:5,dungeonRoom:4};
  const rt={
    loadActiveEnemies:()=>[enemy],
    activeEnemyDefinition:()=>({rule:{range:2}}),
    dungeonEnemyAttackSkills:()=>[],
    GensRpgTacticalPolish1678108:{gridDistance:(map,a,b)=>Math.abs((a%5)-(b%5))+Math.abs(Math.floor(a/5)-Math.floor(b/5))}
  };
  assert.deepEqual(P.detectionEnemyIds(rt,state),['e1'],'enemy detection must consider every hero in the room, not only the active hero');
}

assert.equal(P.paintDiceOverlay({},null),false,'V111 keeps multi-die engine resolution but no longer owns the visual dice DOM');

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/const WALL_SIZE="cover"/,'wall sizing must match Builder floor-style cover');
assert.match(source,/function paintDiceOverlay\(rt=R\)\{return false\}/,'V111 visual dice renderer must stay retired');
assert.match(source,/drc100Launcher/,'runtime creator tab must be removable during play');
assert.match(source,/data-v111-attack/,'fixed Attack dock must be maintained independently of tactical rerenders');
assert.match(source,/function hookUiRender\(rt=R\)/,'V111 dock must have an explicit event-driven Tactical UI render hook');
assert.match(source,/old\.apply\(this,arguments\).*maintain\(rt\)/s,'V111 Tactical UI render hook must refresh the dock after each canonical render');
assert.match(source,/function install\(rt=R\)\{[^}]*hookUiRender\(rt\)/s,'V111 install must activate the deterministic UI render hook without a global observer');
assert.match(source,/applyDungeonTurnEvent/,'event/ambush path must schedule an immediate detection scan');
assert.match(integration,/gens-rpg-tactical-runtime-fixes-1678111\.js\?v=16\.78\.111/,'V111 must load after V110');
assert.match(sw,/gensrpg-cache-16\.78\.114\.6-consolidated-tactical-runtime/);
assert.match(sw,/gens-rpg-tactical-runtime-fixes-1678111\.js/);

console.log('V16.78.111 weapon multi-dice + deterministic dock + detection preserved; no global observer required: OK');
