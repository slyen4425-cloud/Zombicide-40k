const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const baseUi=fs.readFileSync(process.argv[2],"utf8");
const hotfix=fs.readFileSync(process.argv[3],"utf8");
const built=process.argv[4]?fs.readFileSync(process.argv[4],"utf8"):"";

const ancient=[
  {id:"ditem_ancient_helm",name:"Heaume des Anciens",dungeonBuiltin:true,setId:"set_ancient",setPieceId:"head",rpgBonuses:{armor:1,esprit:1}},
  {id:"ditem_ancient_chest",name:"Plastron des Anciens",dungeonBuiltin:true,setId:"set_ancient",setPieceId:"torso",rpgBonuses:{armor:3}},
  {id:"ditem_ancient_gauntlets",name:"Gantelets des Anciens",dungeonBuiltin:true,setId:"set_ancient",setPieceId:"hands",rpgBonuses:{armor:1,force:1}}
];
const map=Object.fromEntries(ancient.map(x=>[x.id,x]));
let overrides={};

const context={
  console,Date,Math,
  setTimeout(fn){fn();return 1},
  requestAnimationFrame(fn){fn()},
  ITEMS:[...ancient],
  DUNGEON_EQUIPMENT_SETS:{
    set_ancient:{
      id:"set_ancient",name:"Armure des Anciens",pieceCount:5,
      thresholds:[
        {pieces:2,bonuses:{armor:1}},
        {pieces:3,bonuses:{magicDefense:1}},
        {pieces:4,bonuses:{endurance:2}},
        {pieces:5,bonuses:{defense:1,force:1}}
      ]
    }
  },
  state:{
    inventory:[
      {itemId:"ditem_ancient_helm"},
      {itemId:"ditem_ancient_chest"},
      {itemId:"ditem_ancient_gauntlets"}
    ],
    rightHand:null,leftHand:null,
    rpgGear:{head:0,torso:1,hands:2}
  },
  dungeonEquippedItems(){return []}, // ancien comportement fautif hors isDungeonHeroSheet()
  getItemFromEntry(entry){return map[entry?.itemId]||null},
  itemById(id){return map[id]||null},
  dungeonItems(){return ancient},
  equipmentSummary(){return "Équipement"},
  equipmentCardStatsHtml(){return ""},
  openEquipmentEditor(){return "open"},
  saveEquipmentEditor(){return "save"},
  isDungeonMode(){return true},
  loadDungeonItemOverrides(){return JSON.parse(JSON.stringify(overrides))},
  saveDungeonItemOverrides(next){overrides=JSON.parse(JSON.stringify(next))},
  ensureDungeonItems(){}
};
context.window=context;

vm.runInNewContext(baseUi,context,{filename:"dungeon-equipment-ui.js"});
vm.runInNewContext(hotfix,context,{filename:"dungeon-equipment-hotfix-167817.js"});

const equipped=context.dungeonEquippedItems();
assert.equal(equipped.length,3,"le hotfix doit reconstruire les équipements depuis state même si l'ancien helper renvoie vide");

const progress=context.DungeonEquipmentUI.getSetProgress();
assert.equal(progress.length,1);
assert.equal(progress[0].count,3);
assert.equal(progress[0].total,5);
assert.match(context.DungeonEquipmentUI.renderSetProgressHtml(),/Armure des Anciens — 3\/5/);

const summary=context.equipmentSummary(ancient[0]);
assert.match(summary,/\+1 Armure/);
assert.match(summary,/\+1 Esprit/);
assert.match(summary,/Set : Armure des Anciens/);

const card=context.equipmentCardStatsHtml(ancient[0]);
assert.match(card,/RPG : \+1 Armure · \+1 Esprit/);

assert.equal(context.openEquipmentEditor.__equipmentHotfix167817,true,"l'ouverture de l'éditeur doit être raccordée");
assert.equal(context.saveEquipmentEditor.__equipmentHotfix167817,true,"la sauvegarde de l'éditeur doit être raccordée");

const saved=context.DungeonEquipmentHotfix167817.persistBonuses("ditem_ancient_helm",{armor:4,force:2,crit:7,magicDefense:3});
assert.equal(saved,true);
assert.equal(overrides.ditem_ancient_helm.rpgBonuses.armor,4);
assert.equal(overrides.ditem_ancient_helm.rpgBonuses.force,2);
assert.equal(overrides.ditem_ancient_helm.rpgBonuses.crit,7);
assert.equal(overrides.ditem_ancient_helm.rpgBonuses.magicDefense,3);

for(const label of ["Armure","Défense","Force","Agilité","Endurance","Intelligence","Esprit","Initiative","Défense magique","Critique %"]){
  assert.match(hotfix,new RegExp(label));
}
assert.match(hotfix,/deuiHotfixBonus_/);

if(built){
  const basePos=built.lastIndexOf("assets/dungeon/dungeon-equipment-ui.js");
  const hotfixPos=built.lastIndexOf("assets/dungeon/dungeon-equipment-hotfix-167817.js");
  assert.ok(basePos>=0,"le bridge équipement de base doit être chargé");
  assert.ok(hotfixPos>basePos,"le hotfix doit charger après le bridge de base dans la page publiée");
}

console.log("Dungeon equipment UI hotfix V16.78.17: OK");
