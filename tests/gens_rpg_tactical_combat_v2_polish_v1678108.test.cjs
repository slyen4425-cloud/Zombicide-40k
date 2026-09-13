const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'));

assert.equal(P.APP_VERSION,'16.78.108');
assert.equal(P.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(P.DETECTION_RADIUS,1);

{
  const map={size:3,cells:['floor','wall','floor','floor','floor','floor','floor','floor','floor']};
  assert.equal(P.gridDistance(map,0,3,1),1,'une case praticable voisine doit être détectée immédiatement');
  assert.equal(P.gridDistance(map,0,2,1),Infinity,'la détection immédiate ne doit pas traverser un mur');
  assert.equal(P.gridDistance(map,0,2,4),4,'le calcul doit suivre un chemin praticable réel');
}

{
  const state={participants:['dungeon_aldren'],index:0,room:4,heroRooms:{dungeon_aldren:4},positions:{dungeon_aldren:4},enemyCells:{e1:5,e2:7,e3:3},last:{map:{size:3,cells:Array(9).fill('floor')}}};
  const enemies=[{id:'e1',hp:3,dungeonRoom:4},{id:'e2',hp:3,dungeonRoom:5},{id:'e3',hp:0,dungeonRoom:4}];
  assert.deepEqual(P.detectionEnemyIds(state,enemies),['e1'],'seul un ennemi vivant, dans la même salle et à portée doit engager');
}

{
  const states={hero:{rightHand:0,leftHand:null,inventory:[{itemId:'sword'},{itemId:'bow',ammo:2},{itemId:'potion',qty:10}]}};
  const items={
    sword:{id:'sword',name:'Épée',type:'Arme',range:1},
    bow:{id:'bow',name:'Arc',type:'Arme',range:6,ammoCapacity:6},
    potion:{id:'potion',name:'Potion de soins',type:'Consommable',consumable:true,use:{kind:'heal'}}
  };
  let renders=0;
  const actor={id:'hero',side:'hero',hp:5,maxHp:10,attacks:[{id:'old'}]};
  const rt={
    loadState:id=>states[id],
    saveState:(id,st)=>{states[id]=JSON.parse(JSON.stringify(st))},
    itemById:id=>items[id],
    getItemFromEntry:e=>items[e.itemId],
    GensRpgTacticalCombatV2Adapter:{heroAttacks:(_rt,id)=>[{id:'weapon-'+states[id].rightHand,name:items[states[id].inventory[states[id].rightHand].itemId].name}]},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>({actors:[actor]}),render:()=>{renders++}},
    GensMobileCombatPerformance16781022:{clear(){}},
    dungeonCombatHeroSnapshot:()=>({hp:5,maxHp:10})
  };
  const weapons=P.weaponOptions(rt,'hero');
  assert.equal(weapons.length,2);assert.equal(weapons[1].name,'Arc');assert.equal(weapons[1].capacity,6);
  const consumables=P.itemOptions(rt,'hero');
  assert.equal(consumables.length,1);assert.equal(consumables[0].name,'Potion de soins');assert.equal(consumables[0].qty,10);
  assert.equal(P.equipWeapon(rt,'hero',1),true);
  assert.equal(states.hero.rightHand,1,'le vrai état du héros doit changer d’arme');
  assert.equal(actor.attacks[0].name,'Arc','les attaques tactiques doivent être reconstruites depuis l’équipement réel');
  assert.ok(renders>0);
}

{
  let engaged=null;
  const state={participants:['dungeon_aldren'],index:0,room:2,heroRooms:{dungeon_aldren:2},positions:{dungeon_aldren:4},enemyCells:{enemy1:5},last:{map:{size:3,cells:Array(9).fill('floor')}}};
  const rt={
    localStorage:{getItem:k=>k===P.RUNTIME_KEY?JSON.stringify(state):null},
    loadActiveEnemies:()=>[{id:'enemy1',hp:4,dungeonRoom:2}],
    dc200StartCombat:(ids,reason)=>{engaged={ids,reason}},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>null}
  };
  assert.deepEqual(P.scanImmediateDetection(rt),['enemy1']);
  assert.deepEqual(engaged,{ids:['enemy1'],reason:'detection-immediate'});
}

const source=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');
assert.match(source,/object-fit:contain!important/,'les pions ne doivent plus rogner les portraits');
assert.match(source,/dng_wall_block\.jpg/,'la texture du Dungeon Builder doit être utilisée');
assert.doesNotMatch(source,/WALL_ASSET="assets\/dungeon\/creatures\/dungeon_wall\.png"/);
assert.match(source,/data-v108-attack/);assert.match(source,/data-v108-weapon/);assert.match(source,/data-v108-reload/);assert.match(source,/data-v108-item/);assert.match(source,/data-v108-qty/);
assert.match(source,/dungeonMoveHero098/);assert.match(source,/detection-immediate/);

console.log('V16.78.108 immediate detection + builder walls + pawn framing + tactical action selectors OK');
