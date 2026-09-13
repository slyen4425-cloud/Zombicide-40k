const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678109.js'));

assert.equal(P.APP_VERSION,'16.78.109');
assert.equal(P.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(P.BOW_RANGE,6);
assert.equal(P.STAFF_RANGE,4);
assert.equal(P.UNARMED_VALUE,'-1');

{
  const bow={id:'item:dng_bow',name:'Arc',minRange:0,maxRange:1,lineOfSight:false,tags:['melee']};
  P.normalizeRangedAttack(bow);
  assert.equal(bow.maxRange,6,'un arc ne doit jamais rester à portée 1');
  assert.equal(bow.minRange,1);
  assert.equal(bow.lineOfSight,true);
  assert.deepEqual(bow.tags,['ranged']);

  const staff={id:'item:dng_staff',name:'Bâton',maxRange:1};
  P.normalizeRangedAttack(staff);
  assert.equal(staff.maxRange,4,'un bâton magique ne doit jamais rester à portée 1');

  const sword={id:'item:sword',name:'Épée',maxRange:1};
  P.normalizeRangedAttack(sword);
  assert.equal(sword.maxRange,1,'une vraie arme de mêlée doit conserver sa portée');
}

{
  const actors=[{id:'aldren',alive:true},{id:'skeleton',alive:true},{id:'lyra',alive:true}];
  const seq=P.turnSequence({order:['aldren','skeleton','lyra'],turnIndex:1,actors});
  assert.deepEqual(seq.map(x=>x.actor.id),['skeleton','lyra','aldren'],'la timeline doit commencer par l’acteur courant puis montrer les prochains tours');
}

{
  const states={hero:{rightHand:0,leftHand:1,inventory:[{itemId:'bow'},{itemId:'shield'}]}};
  const items={bow:{id:'bow',name:'Arc',type:'Arme'},shield:{id:'shield',name:'Bouclier',type:'Équipement'}};
  let renders=0;
  const actor={id:'hero',side:'hero',attacks:[{id:'old',name:'Arc',maxRange:1}]};
  const rt={
    loadState:id=>states[id],
    saveState:(id,st)=>{states[id]=JSON.parse(JSON.stringify(st))},
    getItemFromEntry:e=>items[e.itemId],itemById:id=>items[id],
    GensRpgTacticalCombatV2Adapter:{heroAttacks:()=>[{id:'unarmed',name:'Mains nues',minRange:0,maxRange:1}]},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>({actors:[actor]}),render:()=>{renders++}},
    GensMobileCombatPerformance16781022:{clear(){}}
  };
  assert.equal(P.equipUnarmed(rt,'hero'),true);
  assert.equal(states.hero.rightHand,null,'Mains nues doit vider la main d’arme principale');
  assert.equal(states.hero.leftHand,1,'un bouclier non-arme doit rester équipé');
  assert.equal(actor.attacks[0].name,'Mains nues');
  assert.ok(renders>0);
}

const source=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678109.js'),'utf8');
const integration=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8');
assert.match(source,/\.gtv2Hud\{display:none!important\}/,'les cartes Tour/Cible redondantes doivent être masquées');
assert.match(source,/gtv2109Timeline/,'la timeline visuelle doit être présente');
assert.match(source,/data-v109-quick-attack/,'le raccourci d’attaque fixe doit être présent');
assert.match(source,/Mains nues/,'le choix Mains nues doit être prévu');
assert.match(source,/\.gtv2Cell\.blocked/,'les murs de la carte tactique doivent être repeints');
assert.match(source,/dng_wall_block\.jpg/,'la couche finale doit reprendre la texture du Builder');
assert.doesNotMatch(source,/dungeon_wall\.png/,'la couche V109 ne doit plus référencer l’ancien mur tactique');
assert.match(integration,/gens-rpg-tactical-combat-v2-polish-1678109\.js\?v=16\.78\.109/,'la V109 doit être réellement chargée après V108');
assert.match(sw,/gensrpg-cache-16\.78\.109-timeline-range-wall-ux/,'le cache PWA doit changer');
assert.match(sw,/gens-rpg-tactical-combat-v2-polish-1678109\.js/,'la couche V109 doit être pré-cachée');

console.log('V16.78.109 timeline + compact HUD + quick attack + unarmed + ranged weapon + authoritative wall regressions OK');
