const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const path=require('node:path');
const E=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
const A=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));

assert.equal(A.APP_VERSION,'16.78.114.10');

function fakeRuntime(){
  const states={
    dungeon_aldren:{wounds:2,rightHand:0,leftHand:null,inventory:[{itemId:'sword'}]},
    dungeon_lyra:{wounds:0,rightHand:0,leftHand:null,inventory:[{itemId:'bow',ammo:7}]}
  };
  const items={
    sword:{id:'sword',name:'Épée',type:'Arme',range:1,accuracy:'3+',strength:5,dice:1},
    bow:{id:'bow',name:'Arc',type:'Arme',range:6,accuracy:'3+',strength:4,dice:2,ammoCapacity:10}
  };
  const enemyDef={id:'skeleton',name:'Squelette',rule:{hp:8,range:1,damage:3,attackMode:'melee'}};
  const cells=Array(49).fill('floor');cells[10]='wall';cells[17]='void';cells[24]='cover';cells[0]='entry';cells[48]='exit';
  const rt={
    GensRpgTacticalCombatV2:E,
    CHARS:{dungeon_aldren:{name:'Aldren',image:'aldren.png'},dungeon_lyra:{name:'Lyra',image:'lyra.png'}},
    loadState:id=>states[id],
    saveState:(id,st)=>{states[id]=JSON.parse(JSON.stringify(st))},
    loadDungeonState:()=>({room:3,last:{kind:'enemy',map:{size:7,shape:'room',cells}}}),
    dungeonParticipants:()=>['dungeon_aldren','dungeon_lyra'],
    loadActiveEnemies:()=>rt.enemyList.map(x=>({...x})),
    saveActiveEnemies:list=>{rt.enemyList=list.map(x=>({...x}))},
    activeEnemyDefinition:id=>id==='skeleton'?enemyDef:null,
    dungeonEnemyDerivedForInstance:()=>({initiative:7,defense:6,armor:1,dodge:2,movement:2}),
    dungeonEnemyAttackSkills:()=>[{id:'slash',name:'Lame rouillée',mode:'melee'}],
    dungeonEnemyAttackProfile:()=>({mode:'melee',range:1,chance:72,power:4}),
    itemById:id=>items[id],
    getItemFromEntry:e=>items[e?.itemId],
    effectiveAttackStats(it){return {range:it.range,accuracy:it.accuracy,strength:it.strength,dice:it.dice,melee:it.range<=1}},
    dungeonCombatHeroSnapshot(id){
      if(id==='dungeon_aldren')return {hp:12,maxHp:14,force:15,movement:3,initiative:14,defense:8,armor:2,dodge:4};
      return {hp:10,maxHp:10,force:9,movement:4,initiative:18,defense:10,armor:1,dodge:12};
    },
    enemyList:[{id:'e1',enemyId:'skeleton',hp:8,maxHp:8}]
  };
  return {rt,states,items};
}

{
  const {rt}=fakeRuntime();
  const mapGrid=A.gridFromDungeonMap(rt);
  assert.equal(mapGrid.width,7);assert.equal(mapGrid.height,7);
  assert.ok(mapGrid.blocked.some(p=>p.x===3&&p.y===1),'wall cell from exploration map must block tactical movement/LOS');
  assert.ok(mapGrid.blocked.some(p=>p.x===3&&p.y===2),'void cell from exploration map must be impassable');
  assert.ok(mapGrid.cover.some(p=>p.x===3&&p.y===3),'cover location must be preserved for the battlefield layer');
}

{
  const {rt}=fakeRuntime();
  const input=A.buildInput(rt,{rngSeed:123});
  assert.equal(input.grid.width,7,'current Dungeon room geometry must become tactical battlefield geometry');
  assert.equal(input.actors.length,3);
  const aldren=input.actors.find(x=>x.id==='dungeon_aldren');
  const lyra=input.actors.find(x=>x.id==='dungeon_lyra');
  const sk=input.actors.find(x=>x.side==='enemy');
  assert.equal(aldren.hp,12);assert.equal(aldren.movement,3);assert.equal(aldren.attacks[0].name,'Épée');assert.equal(aldren.attacks[0].maxRange,1);
  assert.equal(lyra.initiative,18);assert.equal(lyra.attacks[0].name,'Arc');assert.equal(lyra.attacks[0].maxRange,6);assert.equal(lyra.attacks[0].meta.ammo,7);
  assert.equal(sk.name,'Squelette');assert.equal(sk.armor,1);assert.equal(sk.attacks[0].power,4);assert.equal(sk.attacks[0].maxRange,1);
  assert.equal(new Set(input.actors.map(x=>`${x.x},${x.y}`)).size,3,'spawn cells must be unique');
  const blocked=new Set(input.grid.blocked.map(p=>`${p.x},${p.y}`));assert.ok(input.actors.every(a=>!blocked.has(`${a.x},${a.y}`)),'actors must never spawn inside walls');
}

{
  const {rt}=fakeRuntime();
  const battle=A.createBattle(rt,{rngSeed:1,grid:{width:10,height:6,blocked:[]}});
  assert.equal(E.currentActor(battle).id,'dungeon_lyra','real initiative snapshot must drive tactical order');
  const target=battle.actors.find(x=>x.side==='enemy');
  const lyra=E.actorById(battle,'dungeon_lyra');
  const reachable=E.reachableCells(battle,lyra.id);const cell=reachable.sort((a,b)=>E.distance(a,target)-E.distance(b,target))[0];
  if(cell)E.moveActor(battle,lyra.id,cell);
  const preview=E.attackPreview(battle,lyra.id,target.id,lyra.attacks[0].id);
  assert.equal(preview.ok,true,'equipped ranged weapon must become a tactical ranged attack');
}

{
  const {rt,states}=fakeRuntime();
  const battle=A.createBattle(rt,{rngSeed:1,grid:{width:10,height:6,blocked:[]}});
  const aldren=E.actorById(battle,'dungeon_aldren'),enemy=battle.actors.find(x=>x.side==='enemy');
  aldren.hp=5;enemy.hp=0;enemy.alive=false;battle.status='ended';battle.winner='hero';
  const out=A.commitBattle(rt,battle,{removeDefeatedEnemies:true});
  assert.equal(out.heroes,2);assert.equal(out.enemies,1);
  assert.equal(states.dungeon_aldren.wounds,9,'tactical HP must commit back as legacy wounds');
  assert.equal(rt.enemyList.length,0,'defeated tactical enemies can be removed on commit');
}

// Real Dungeon boundary: legacy 5+ is never treated as 5%, RPG scaling owns D100,
 // and a selected hero still outside room 0 cannot enter the tactical snapshot.
 {
  const legacy=A.weaponHitProfile({},'legacy',{accuracy:'5+',hitChance:5},{accuracy:'5+',hitChance:5});
  assert.equal(legacy.hit,33,'legacy 5+ on D6 must become 2/6 = 33%, never 5%');
  assert.deepEqual(legacy.breakdown,{kind:'legacy-d6',legacyThreshold:5,successFaces:2,dieSides:6,baseChance:33,effectiveHit:33,source:'legacyAccuracy'});

  const dungeonState={room:1,index:0,participants:['dungeon_aldren','dungeon_lyra'],heroRooms:{dungeon_aldren:1,dungeon_lyra:0},positions:{dungeon_aldren:6},heroBranchStates:{},branch:null,last:{kind:'enemy',map:{size:5,cells:Array(25).fill('floor')}}};
  const states={
    dungeon_aldren:{wounds:0,rightHand:0,leftHand:null,inventory:[{itemId:'dng_longsword'}]},
    dungeon_lyra:{wounds:0,rightHand:0,leftHand:null,inventory:[{itemId:'dng_bow'}]}
  };
  const sword={id:'dng_longsword',name:'Épée longue',type:'Arme',range:1,dice:2,accuracy:5,strength:2,rpgScaling:{attribute:'force',baseChance:55,chancePerPoint:2,diceSides:100}};
  const bow={id:'dng_bow',name:'Arc de chasseur',type:'Arme',range:6,dice:2,accuracy:5,strength:1,rpgScaling:{attribute:'agilite',baseChance:60,chancePerPoint:2,diceSides:100}};
  const rt={GensRpgTacticalCombatV2:E,CHARS:{dungeon_aldren:{name:'Aldren'},dungeon_lyra:{name:'Lyra'}},localStorage:{getItem:k=>k==='gensrpg_dungeon_runtime_v2'?JSON.stringify(dungeonState):null},loadDungeonState:()=>dungeonState,dungeonParticipants:()=>dungeonState.participants,loadState:id=>states[id],getItemFromEntry:e=>e.itemId==='dng_bow'?bow:sword,effectiveAttackStats:it=>({range:it.range,dice:it.dice,accuracy:5,hitChance:5,strength:it.strength,melee:it.range<=1}),dungeonAttributeValue:id=>id==='force'?6:8,dungeonHitBonusForMode:(mode,value)=>Math.floor(value/2)*5,dungeonCombatHeroSnapshot:id=>({hp:12,maxHp:12,movement:4,initiative:id==='dungeon_lyra'?20:15,defense:2,armor:1,dodge:3}),loadActiveEnemies:()=>[{id:'e1',enemyId:'skeleton',hp:8,maxHp:8,dungeonRoom:1}],activeEnemyDefinition:()=>({name:'Squelette',rule:{hp:8,range:1,damage:2}}),dungeonEnemyDerivedForInstance:()=>({initiative:1,defense:0,armor:0,dodge:0,movement:2}),dungeonEnemyAttackSkills:()=>[null],dungeonEnemyAttackProfile:()=>({mode:'melee',range:1,chance:70,power:2})};
  assert.deepEqual(A.enteredParticipants(rt,dungeonState.participants),['dungeon_aldren']);
  const input=A.buildInput(rt,{enemyIds:['e1']});
  assert.deepEqual(input.meta.heroIds,['dungeon_aldren'],'Lyra room 0 must be excluded even if the bridge requested the full party');
  assert.equal(input.actors.length,2);
  assert.equal(input.actors[0].attacks[0].hit,70,'sword must use 55% base + 15% Force bonus');
  assert.deepEqual(input.actors[0].attacks[0].meta.hitBreakdown,{kind:'rpg-d100',baseChance:55,attribute:'force',attributeValue:6,statBonus:15,otherBonus:0,effectiveHit:70,source:'rpgScaling'});
  const battle=A.createBattle(rt,{enemyIds:['e1']});
  assert.equal(battle.actors.find(a=>a.side==='hero').attacks[0].meta.hitBreakdown.effectiveHit,70,'engine normalization must preserve calculation origin');
 }

 {
  const {rt}=fakeRuntime();
  const t0=performance.now();
  for(let i=0;i<500;i++)A.createBattle(rt,{rngSeed:i+1});
  const ms=performance.now()-t0;
  assert.ok(ms<750,`adapter snapshot is too slow: ${ms.toFixed(1)}ms`);
  console.log('GenSrpG Tactical Combat V2 adapter OK', {ms:Number(ms.toFixed(1))});
}
