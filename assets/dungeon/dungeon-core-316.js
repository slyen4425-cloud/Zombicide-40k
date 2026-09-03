(function(){
"use strict";

/* Core 3.16 — catalogue du ZIP et moteur générique de bonus de set.
   Un objet rejoint un set via setId + setPieceId. Les bonus de chaque palier
   sont cumulatifs et calculés uniquement depuis les objets réellement équipés. */
const ROOT316="assets/dungeon/items/";
const SETS316={
  set_leather:{
    id:"set_leather",name:"Ensemble de cuir",pieceCount:5,
    thresholds:[
      {pieces:2,bonuses:{agilite:1}},
      {pieces:3,bonuses:{dodge:5}},
      {pieces:4,bonuses:{initiative:1}},
      {pieces:5,bonuses:{defense:1}}
    ]
  },
  set_ancient:{
    id:"set_ancient",name:"Armure des Anciens",pieceCount:5,
    thresholds:[
      {pieces:2,bonuses:{armor:1}},
      {pieces:3,bonuses:{magicDefense:1}},
      {pieces:4,bonuses:{endurance:2}},
      {pieces:5,bonuses:{defense:1,force:1}}
    ]
  }
};

const ITEMS316=[
  {id:"ditem_leather_shoulders",name:"Épaulières de cuir",file:"ditem_leather_shoulders.png",type:"Équipement",rpgSlot:"shoulders",rpgRarity:"common",price:55,defaultDeckCount:1,setId:"set_leather",setPieceId:"shoulders",rpgBonuses:{defense:1},effect:"+1 Défense · Pièce de l’Ensemble de cuir."},
  {id:"ditem_leather_gloves",name:"Gants de cuir",file:"ditem_leather_gloves.png",type:"Équipement",rpgSlot:"hands",rpgRarity:"common",price:45,defaultDeckCount:1,setId:"set_leather",setPieceId:"hands",rpgBonuses:{agilite:1},effect:"+1 Agilité · Pièce de l’Ensemble de cuir."},
  {id:"ditem_leather_pants",name:"Pantalon de cuir",file:"ditem_leather_pants.png",type:"Équipement",rpgSlot:"legs",rpgRarity:"common",price:60,defaultDeckCount:1,setId:"set_leather",setPieceId:"legs",rpgBonuses:{armor:1},effect:"+1 Armure · Pièce de l’Ensemble de cuir."},
  {id:"ditem_leather_boots",name:"Bottes de cuir",file:"ditem_leather_boots.png",type:"Équipement",rpgSlot:"feet",rpgRarity:"common",price:50,defaultDeckCount:1,setId:"set_leather",setPieceId:"feet",rpgBonuses:{initiative:1},effect:"+1 Initiative · Pièce de l’Ensemble de cuir."},

  {id:"ditem_ancient_helm",name:"Heaume des Anciens",file:"ditem_ancient_helm.png",type:"Équipement",rpgSlot:"head",rpgRarity:"epic",price:420,defaultDeckCount:1,setId:"set_ancient",setPieceId:"head",rpgBonuses:{armor:1,esprit:1},effect:"+1 Armure · +1 Esprit · Pièce de l’Armure des Anciens."},
  {id:"ditem_ancient_chest",name:"Plastron des Anciens",file:"ditem_ancient_chest.png",type:"Équipement",rpgSlot:"torso",rpgRarity:"epic",price:560,defaultDeckCount:1,setId:"set_ancient",setPieceId:"torso",rpgBonuses:{armor:3},effect:"+3 Armure · Pièce de l’Armure des Anciens."},
  {id:"ditem_ancient_gauntlets",name:"Gantelets des Anciens",file:"ditem_ancient_gauntlets.png",type:"Équipement",rpgSlot:"hands",rpgRarity:"epic",price:440,defaultDeckCount:1,setId:"set_ancient",setPieceId:"hands",rpgBonuses:{armor:1,force:1},effect:"+1 Armure · +1 Force · Pièce de l’Armure des Anciens."},
  {id:"ditem_ancient_shoulders",name:"Épaulières des Anciens",file:"ditem_ancient_shoulders.png",type:"Équipement",rpgSlot:"shoulders",rpgRarity:"epic",price:460,defaultDeckCount:1,setId:"set_ancient",setPieceId:"shoulders",rpgBonuses:{armor:1,defense:1},effect:"+1 Armure · +1 Défense · Pièce de l’Armure des Anciens."},
  {id:"ditem_ancient_boots",name:"Bottes des Anciens",file:"ditem_ancient_boots.png",type:"Équipement",rpgSlot:"feet",rpgRarity:"epic",price:430,defaultDeckCount:1,setId:"set_ancient",setPieceId:"feet",rpgBonuses:{armor:1,endurance:1},effect:"+1 Armure · +1 Endurance · Pièce de l’Armure des Anciens."},

  {id:"ditem_ash_blade",name:"Lame de Cendre",file:"ditem_ash_blade.png",type:"Arme",hands:1,dice:2,accuracy:4,strength:2,range:"0",rpgRarity:"rare",price:240,defaultDeckCount:1,rpgScaling:{attribute:"force",mode:"percent",baseChance:58,chancePerPoint:2,damageEvery:5,diceSides:100},rpgOnHit:{kind:"dot",chance:35,amount:1,duration:2,damageType:"magical",element:"fire",label:"Brûlure de Cendre"},effect:"35% sur une attaque qui inflige des dégâts : Brûlure 1 dégât/tour pendant 2 tours."},
  {id:"ditem_leech_bow",name:"Arc du Sangsue",file:"ditem_leech_bow.png",type:"Arme",hands:2,dice:2,accuracy:4,strength:1,range:"1-5",ammoCapacity:10,rpgAmmoKind:"arrows",rpgRarity:"epic",price:480,defaultDeckCount:1,rpgScaling:{attribute:"agilite",mode:"percent",baseChance:62,chancePerPoint:2,damageEvery:6,diceSides:100},rpgOnHit:{kind:"life_steal",chance:100,amount:1,label:"Morsure sanguine"},effect:"Arc à 10 flèches · Après une attaque qui blesse : rend 1 PV."},
  {id:"ditem_guardian_staff",name:"Bâton du Gardien",file:"ditem_guardian_staff.png",type:"Arme",hands:2,dice:2,accuracy:4,strength:1,range:"1-3",rpgRarity:"epic",price:500,defaultDeckCount:1,rpgBonuses:{esprit:1},rpgScaling:{attribute:"intelligence",mode:"percent",baseChance:52,chancePerPoint:2,damageEvery:7,diceSides:100,magic:true},rpgItemAbilities:[{id:"guardian_group_heal",name:"Onde gardienne",cooldown:3,effects:[{kind:"heal_all",amount:2}]}],effect:"+1 Esprit · Onde gardienne : soigne 2 PV à tous les héros engagés, recharge 3 tours."},
  {id:"ditem_skullbreaker_axe",name:"Hache du Brise-crâne",file:"ditem_skullbreaker_axe.png",type:"Arme",hands:2,dice:3,accuracy:5,strength:3,range:"0",rpgRarity:"epic",price:520,defaultDeckCount:1,rpgScaling:{attribute:"force",mode:"percent",baseChance:52,chancePerPoint:2,damageEvery:5,diceSides:100},rpgItemAbilities:[{id:"skull_fracas",name:"Fracas",cooldown:2,effects:[{kind:"damage",amount:4,damageType:"physical"}]},{id:"skull_break_armor",name:"Brise-armure",cooldown:3,effects:[{kind:"damage",amount:2,damageType:"physical"},{kind:"stat_mod",stat:"defense",value:-2,duration:2}]}],effect:"Fracas : 4 dégâts (2 tours) · Brise-armure : 2 dégâts et −2 Défense pendant 2 tours (3 tours)."},
  {id:"ditem_ember_quiver",name:"Carquois des Braises",file:"ditem_ember_quiver.png",type:"Consommable",reloads:1,rpgReloadKind:"arrows",rpgRarity:"rare",price:90,defaultDeckCount:2,rpgAmmoEffect:{kind:"dot",chance:100,amount:1,duration:2,damageType:"magical",element:"fire",label:"Flèches incendiaires"},effect:"Recharge un arc. Jusqu’à la prochaine recharge, les attaques qui blessent appliquent Brûlure 1/tour pendant 2 tours."},
  {id:"ditem_frost_quiver",name:"Carquois de Givre",file:"ditem_frost_quiver.png",type:"Consommable",reloads:1,rpgReloadKind:"arrows",rpgRarity:"rare",price:90,defaultDeckCount:2,rpgAmmoEffect:{kind:"stat_mod",chance:100,stat:"initiative",value:-2,duration:2,label:"Flèches de givre"},effect:"Recharge un arc. Jusqu’à la prochaine recharge, les attaques qui blessent infligent −2 Initiative pendant 2 tours."},
  {id:"ditem_venom_quiver",name:"Carquois de Venin",file:"ditem_venom_quiver.png",type:"Consommable",reloads:1,rpgReloadKind:"arrows",rpgRarity:"rare",price:90,defaultDeckCount:2,rpgAmmoEffect:{kind:"dot",chance:100,amount:1,duration:3,damageType:"physical",element:"poison",label:"Flèches venimeuses"},effect:"Recharge un arc. Jusqu’à la prochaine recharge, les attaques qui blessent appliquent Poison 1/tour pendant 3 tours."},

  {id:"ditem_arcane_grimoire",name:"Grimoire arcanique",file:"ditem_arcane_grimoire.png",type:"Équipement",rpgSlot:"offhand",rpgRarity:"epic",price:390,defaultDeckCount:1,rpgBonuses:{intelligence:2,mana:2,magicDefense:1},effect:"+2 Intelligence · +2 Mana · +1 Défense magique."},
  {id:"ditem_bastion_shield",name:"Bouclier du Bastion",file:"ditem_bastion_shield.png",type:"Équipement",rpgSlot:"offhand",rpgRarity:"epic",price:410,defaultDeckCount:1,rpgBonuses:{armor:2,defense:2,agilite:-1},effect:"+2 Armure · +2 Défense · −1 Agilité."},
  {id:"ditem_celerity_necklace",name:"Collier de Célérité",file:"ditem_celerity_necklace.png",type:"Équipement",rpgSlot:"neck",rpgRarity:"epic",price:360,defaultDeckCount:1,rpgBonuses:{agilite:1,initiative:2},effect:"+1 Agilité · +2 Initiative."},
  {id:"ditem_colossus_pants",name:"Jambières du Colosse",file:"ditem_colossus_pants.png",type:"Équipement",rpgSlot:"legs",rpgRarity:"epic",price:430,defaultDeckCount:1,rpgBonuses:{armor:2,endurance:3,agilite:-1},effect:"+2 Armure · +3 Endurance · −1 Agilité."},
  {id:"ditem_duelist_dagger",name:"Dague du Duelliste",file:"ditem_duelist_dagger.png",type:"Arme",hands:1,dice:2,accuracy:3,strength:1,range:"0",rpgRarity:"rare",price:230,defaultDeckCount:1,rpgBonuses:{agilite:1,crit:5},rpgScaling:{attribute:"agilite",mode:"percent",baseChance:64,chancePerPoint:2,damageEvery:7,diceSides:100},effect:"+1 Agilité · +5% Critique · arme précise à une main."},
  {id:"ditem_runic_hammer",name:"Marteau runique",file:"ditem_runic_hammer.png",type:"Arme",hands:2,dice:2,accuracy:5,strength:3,range:"0",rpgRarity:"rare",price:310,defaultDeckCount:1,rpgBonuses:{magicDefense:1},rpgScaling:{attribute:"force",mode:"percent",baseChance:54,chancePerPoint:2,damageEvery:5,diceSides:100},rpgOnHit:{kind:"stat_mod",chance:30,stat:"defense",value:-1,duration:2,label:"Fracture runique"},effect:"+1 Défense magique · 30% sur une attaque qui blesse : −1 Défense à la cible pendant 2 tours."}
];

window.DUNGEON_EQUIPMENT_SETS=Object.assign({},window.DUNGEON_EQUIPMENT_SETS||{},SETS316);
window.DUNGEON_ITEM_DEFINITIONS_316=ITEMS316;

function thresholds316(set){
  if(Array.isArray(set?.thresholds))return [...set.thresholds].sort((a,b)=>Number(a.pieces)-Number(b.pieces));
  return Object.entries(set?.thresholds||{}).map(([pieces,bonuses])=>({pieces:Number(pieces),bonuses})).sort((a,b)=>a.pieces-b.pieces)
}
function setState316(items,registry=window.DUNGEON_EQUIPMENT_SETS||{}){
  const grouped={};
  (items||[]).forEach(it=>{
    const setId=String(it?.setId||"");if(!setId||!registry[setId])return;
    const piece=String(it?.setPieceId||it?.id||"");
    const group=grouped[setId]||(grouped[setId]={set:registry[setId],pieces:new Set(),items:[]});
    if(!group.pieces.has(piece)){group.pieces.add(piece);group.items.push(it)}
  });
  return Object.entries(grouped).map(([setId,group])=>{
    const count=group.pieces.size;
    const activeThresholds=thresholds316(group.set).filter(t=>count>=Math.max(1,Number(t.pieces)||1));
    const bonuses={};
    activeThresholds.forEach(t=>Object.entries(t.bonuses||{}).forEach(([key,value])=>bonuses[key]=(Number(bonuses[key])||0)+(Number(value)||0)));
    return {setId,set:group.set,count,pieces:[...group.pieces],items:group.items,activeThresholds,bonuses}
  })
}
window.dungeonSetStateFromItems316=setState316;
window.dungeonEquippedSetState=function(){return setState316(typeof dungeonEquippedItems==="function"?dungeonEquippedItems():[])};
window.dungeonSetBonusFromItems316=function(items,key,registry){return setState316(items,registry).reduce((sum,set)=>sum+(Number(set.bonuses?.[key])||0),0)};
window.dungeonSetBonusTotal=function(key){return dungeonSetBonusFromItems316(typeof dungeonEquippedItems==="function"?dungeonEquippedItems():[],key)};

const originalDungeonItems316=window.dungeonItems;
window.dungeonItems=function(){
  const base=typeof originalDungeonItems316==="function"?originalDungeonItems316():[];
  const leather=base.map(it=>it.id==="dng_leather"?{...it,setId:"set_leather",setPieceId:"torso",rpgRarity:it.rpgRarity||"common",effect:(it.effect||"+1 Armure · +1 Agilité.")+" · Pièce de l’Ensemble de cuir."}:it);
  const overrides=typeof loadDungeonItemOverrides==="function"?loadDungeonItemOverrides():{};
  const fresh=ITEMS316.map(def=>{
    const ov=overrides?.[def.id]||{};
    return {...def,...ov,id:def.id,dungeonBuiltin:true,image_data:ov.image_data||ROOT316+def.file,imageCrop:typeof gensNormCrop==="function"?gensNormCrop(ov.imageCrop||{}):(ov.imageCrop||{})}
  });
  return [...leather,...fresh]
};

ITEMS316.forEach(def=>{if(!DUNGEON_ITEM_IDS.includes(def.id))DUNGEON_ITEM_IDS.push(def.id)});
window.dungeonItems().forEach(it=>{
  const idx=ITEMS.findIndex(existing=>String(existing.id)===String(it.id));
  if(idx>=0)ITEMS[idx]=it;else ITEMS.push(it)
});

const originalEquipmentBonus316=window.dungeonEquipmentBonus;
window.dungeonEquipmentBonus=function(key){
  const itemBonus=typeof originalEquipmentBonus316==="function"?Number(originalEquipmentBonus316.call(this,key))||0:0;
  return itemBonus+dungeonSetBonusTotal(key)
};

const BONUS_LABELS316={force:"Force",agilite:"Agilité",intelligence:"Intelligence",esprit:"Esprit",endurance:"Endurance",initiative:"Initiative",defense:"Défense",armor:"Armure",magicDefense:"Défense magique",mana:"Mana",crit:"Critique %",dodge:"Esquive %"};
function bonusText316(bonuses){return Object.entries(bonuses||{}).filter(([,value])=>Number(value)).map(([key,value])=>(Number(value)>0?"+":"")+Number(value)+" "+(BONUS_LABELS316[key]||key)).join(" · ")||"Bonus descriptif"}
function rarityHtml316(it){
  const rarity=String(it?.rpgRarity||"common").toLowerCase();
  const label=typeof dungeonRarityLabel==="function"?dungeonRarityLabel(rarity):rarity;
  return '<span class="dc316Rarity '+rarity+'">'+z40kEscHtml(label)+'</span>'
}
function setPieceHtml316(it){
  const set=window.DUNGEON_EQUIPMENT_SETS?.[it?.setId];
  return set?'<div class="dc316SetPiece">🧩 '+z40kEscHtml(set.name)+'</div>':''
}
function setsHtml316(){
  const states=dungeonEquippedSetState();if(!states.length)return "";
  return '<div class="dc316Sets">'+states.map(stateSet=>
    '<div class="dc316Set"><strong>🧩 '+z40kEscHtml(stateSet.set.name)+' · '+stateSet.count+'/'+Math.max(stateSet.set.pieceCount||0,stateSet.count)+'</strong>'+
    '<div class="dc316SetProgress">'+stateSet.items.map(it=>z40kEscHtml(it.name)).join(' · ')+'</div>'+
    '<div class="dc316Thresholds">'+thresholds316(stateSet.set).map(threshold=>
      '<div class="dc316Threshold '+(stateSet.count>=Number(threshold.pieces)?'active':'')+'">'+(stateSet.count>=Number(threshold.pieces)?'✅':'🔒')+' '+threshold.pieces+' pièces : '+z40kEscHtml(bonusText316(threshold.bonuses))+'</div>'
    ).join('')+'</div></div>'
  ).join('')+'</div>'
}

const originalCardStats316=window.equipmentCardStatsHtml;
window.equipmentCardStatsHtml=function(it,entry){
  const base=typeof originalCardStats316==="function"?originalCardStats316.apply(this,arguments):"";
  const ammo=entry?.activeAmmoEffect?'<div class="dc316Ammo">🏹 '+z40kEscHtml(entry.activeAmmoEffect.label||"Munitions spéciales")+' · '+Math.max(0,Number(entry.activeAmmoEffect.remaining)||0)+' attaque(s)</div>':'';
  return base+rarityHtml316(it)+setPieceHtml316(it)+ammo
};

window.renderDungeonGear=function(){
  const host=document.getElementById("dungeonEquipmentSlots");if(!host)return;
  if(!isDungeonMode()){host.style.display="none";host.innerHTML="";return}
  host.style.display="block";state.rpgGear=state.rpgGear||{};
  host.innerHTML='<div style="font-weight:900;margin-bottom:8px">🎒 ÉQUIPEMENT RPG</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+
    Object.keys(RPG_GEAR_LABELS).map(slot=>{
      const idx=state.rpgGear[slot],entry=(idx===null||idx===undefined)?null:getEntry(idx),it=getItemFromEntry(entry),art=it?.image_data?'<img class="dc062GearArt" src="'+it.image_data+'" alt="">':'';
      return '<div class="handSlot" style="min-height:126px"><div class="handTitle">'+RPG_GEAR_LABELS[slot]+'</div>'+(it?art+'<div class="weaponName">'+z40kEscHtml(it.name)+'</div>'+rarityHtml316(it)+setPieceHtml316(it)+'<div class="rpgGearBonuses">'+z40kEscHtml(it.effect||it.description||"")+'</div><button data-rpg-slot="'+slot+'" onclick="unequipRpgGear(this.dataset.rpgSlot)">Retirer</button>':'<div class="emptyHand">Vide</div>')+'</div>'
    }).join('')+'</div>'+setsHtml316()
};

function deckCount316(it,cfg){
  const raw=cfg?.[it.id];
  return raw===undefined?Math.max(0,Number(it.defaultDeckCount??2)||0):Math.max(0,parseInt(raw,10)||0)
}
window.dungeonLoadDeckState=function(){
  let deck=null;try{deck=JSON.parse(localStorage.getItem(DUNGEON_DECK_KEY)||"null")}catch(e){}
  if(!deck||!deck.remaining)deck={remaining:{},createdAt:Date.now()};
  const cfg=loadDeckConfig();let changed=false;
  itemsForMode(true).forEach(it=>{if(deck.remaining[it.id]===undefined){deck.remaining[it.id]=deckCount316(it,cfg);changed=true}});
  if(changed)try{localStorage.setItem(DUNGEON_DECK_KEY,JSON.stringify(deck))}catch(e){}
  return deck
};
window.dungeonBuildDeckState075=function(){
  try{refreshCustomEquipmentIntoItems?.()}catch(e){}
  const cfg=loadDeckConfig?.()||{},remaining={};
  itemsForMode(true).forEach(it=>remaining[it.id]=deckCount316(it,cfg));
  const deck={remaining,createdAt:Date.now(),dungeonSession:true};dungeonSaveDeckState(deck);return deck
};

function refs316(st){
  const uid=index=>Number.isInteger(index)?st.inventory?.[index]?.uid||null:null;
  const out={right:uid(st.rightHand),left:uid(st.leftHand),gear:{}};
  Object.entries(st.rpgGear||{}).forEach(([slot,index])=>out.gear[slot]=uid(index));return out
}
function restoreRefs316(st,refs){
  const idx=uid=>{const found=uid?st.inventory.findIndex(entry=>entry.uid===uid):-1;return found>=0?found:null};
  st.rightHand=idx(refs.right);st.leftHand=idx(refs.left);st.rpgGear=st.rpgGear||{};
  Object.entries(refs.gear||{}).forEach(([slot,uid])=>st.rpgGear[slot]=idx(uid))
}
function reloadMark316(st,weaponIdx,strictKind){
  const weapon=st.inventory?.[weaponIdx],it=weapon?itemById(weapon.itemId):null;if(!weapon||!it)return null;
  const kind=String(it.rpgAmmoKind||"");
  const reloadIndex=st.inventory.findIndex((entry,index)=>{
    if(index===weaponIdx||index===st.rightHand||index===st.leftHand)return false;
    const reload=itemById(entry?.itemId);if(!reload?.reloads||Number(entry.reloads??reload.reloads)<=0)return false;
    return !strictKind||!kind||String(reload.rpgReloadKind||"")===kind
  });
  const reload=reloadIndex>=0?itemById(st.inventory[reloadIndex]?.itemId):null;
  return {weaponUid:weapon.uid,beforeAmmo:Number(weapon.ammo)||0,effect:reload?.rpgAmmoEffect?{...reload.rpgAmmoEffect}:null,refs:refs316(st)}
}
function finishReloadMark316(st,mark){
  if(!st||!mark)return false;restoreRefs316(st,mark.refs);
  const weapon=st.inventory.find(entry=>entry.uid===mark.weaponUid);if(!weapon||Number(weapon.ammo)<=mark.beforeAmmo)return false;
  weapon.activeAmmoEffect=mark.effect?{...mark.effect,remaining:Number(itemById(weapon.itemId)?.ammoCapacity)||Number(weapon.ammo)||1}:null;
  return true
}
window.dungeonReloadMark316=reloadMark316;
window.dungeonFinishReloadMark316=finishReloadMark316;

const originalRefill316=window.refillWeapon;
if(typeof originalRefill316==="function")window.refillWeapon=function(index){
  const mark=state?reloadMark316(state,Number(index),false):null;
  const result=originalRefill316.apply(this,arguments);
  if(state&&finishReloadMark316(state,mark))save();return result
};
const originalCombatReload316=window.dc214Reload;
if(typeof originalCombatReload316==="function")window.dc214Reload=function(heroId){
  const before=loadState(heroId);
  const weaponIdx=[before.rightHand,before.leftHand].find(index=>Number.isInteger(index)&&itemById(before.inventory?.[index]?.itemId)?.type==="Arme");
  const mark=reloadMark316(before,weaponIdx,true),result=originalCombatReload316.apply(this,arguments),after=loadState(heroId);
  if(finishReloadMark316(after,mark)){localStorage.setItem(key(heroId),JSON.stringify(after));if(String(current||"")===String(heroId))state=after}
  return result
};

function equippedWeaponEntry316(heroId,itemId){
  const heroState=loadState(heroId);
  for(const index of [...new Set([heroState.rightHand,heroState.leftHand])])if(Number.isInteger(index)&&String(heroState.inventory?.[index]?.itemId)===String(itemId))return {st:heroState,idx:index,entry:heroState.inventory[index]};
  return null
}
function applyOnHit316(heroId,targetId,effect,label){
  if(!effect||Math.random()*100>=Math.max(0,Math.min(100,Number(effect.chance??100))))return false;
  if(effect.kind==="dot")return !!dungeonApplyEnemyTalentDot(heroId,targetId,{base:Number(effect.amount)||1,duration:Number(effect.duration)||1,damageType:effect.damageType||"physical",element:effect.element||""},effect.label||label);
  if(effect.kind==="stat_mod")return !!dungeonApplyEnemyTalentStatMod(targetId,{stat:effect.stat,value:Number(effect.value)||0,duration:Number(effect.duration)||1},effect.label||label);
  if(effect.kind==="life_steal"){dungeonTalentHealHero(heroId,Math.max(1,Number(effect.amount)||1));return true}
  return false
}
const originalApplyDamage316=window.applyDungeonAttackDamage;
if(typeof originalApplyDamage316==="function")window.applyDungeonAttackDamage=function(instanceId,damage,hits,power){
  const context=attackRollContext?{...attackRollContext}:null;
  const before=loadActiveEnemies().find(enemy=>String(enemy.id)===String(instanceId));
  const heroId=String(context?.heroId||combatRewardHeroId||current||"");
  const item=itemById(context?.itemId||"");
  const weapon=heroId&&item?equippedWeaponEntry316(heroId,item.id):null;
  const ammoEffect=weapon?.entry?.activeAmmoEffect?{...weapon.entry.activeAmmoEffect}:null;
  const result=originalApplyDamage316.apply(this,arguments);
  const after=loadActiveEnemies().find(enemy=>String(enemy.id)===String(instanceId));
  const dealt=Math.max(0,(Number(before?.hp)||0)-(Number(after?.hp)||0));
  if(dealt>0&&heroId){
    applyOnHit316(heroId,instanceId,item?.rpgOnHit,item?.name||"Objet");
    applyOnHit316(heroId,instanceId,ammoEffect,ammoEffect?.label||"Munitions spéciales");
    if(ammoEffect&&weapon){
      const fresh=loadState(heroId),entry=fresh.inventory.find(candidate=>candidate.uid===weapon.entry.uid);
      if(entry?.activeAmmoEffect){entry.activeAmmoEffect.remaining=Math.max(0,(Number(entry.activeAmmoEffect.remaining)||1)-1);if(entry.activeAmmoEffect.remaining<=0)entry.activeAmmoEffect=null;localStorage.setItem(key(heroId),JSON.stringify(fresh));if(String(current||"")===heroId)state=fresh}
    }
  }
  return result
};

function equippedItemAbilities316(heroId){
  const heroState=loadState(heroId),seen=new Set(),out=[];
  [...new Set([heroState.rightHand,heroState.leftHand,...Object.values(heroState.rpgGear||{})])].forEach(index=>{
    if(!Number.isInteger(index))return;const item=itemById(heroState.inventory?.[index]?.itemId);if(!item||seen.has(item.id))return;
    seen.add(item.id);(item.rpgItemAbilities||[]).forEach(ability=>out.push({it:item,ability}))
  });
  return out
}
window.dungeonCombatUseItemAbility316=function(heroId,itemId,abilityId,targetId){
  const found=equippedItemAbilities316(heroId).find(entry=>entry.it.id===itemId&&entry.ability.id===abilityId);if(!found)return;
  const heroState=loadState(heroId),cooldownKey=itemId+":"+abilityId;
  const remaining=Math.max(0,Number(heroState.itemCooldowns?.[cooldownKey])||0);
  if(remaining>0){alert("« "+found.ability.name+" » est en recharge : "+remaining+" tour(s).");return}
  const living=()=>loadActiveEnemies().filter(enemy=>(dungeonCombatSelection?.enemies||[]).includes(enemy.id)&&!enemy.defeated&&Number(enemy.hp)>0),notes=[];
  for(const effect of found.ability.effects||[]){
    if(effect.kind==="heal_all"){
      (dungeonCombatSelection?.heroes||[]).forEach(id=>notes.push((CHARS[id]?.name||id)+" +"+dungeonTalentHealHero(id,Number(effect.amount)||1)+" PV"));continue
    }
    const target=targetId||living()[0]?.id;if(!target)continue;
    if(effect.kind==="damage"){
      dungeonTalentDealDirectDamage(heroId,target,Number(effect.amount)||1,effect.damageType||"physical",effect.element||"");notes.push((Number(effect.amount)||1)+" dégâts");continue
    }
    if(effect.kind==="stat_mod"){
      dungeonApplyEnemyTalentStatMod(target,effect,found.ability.name);notes.push((Number(effect.value)>0?"+":"")+(Number(effect.value)||0)+" "+(effect.stat==="initiative"?"Initiative":"Défense")+" · "+Math.max(1,Number(effect.duration)||1)+" tours")
    }
  }
  const fresh=loadState(heroId);fresh.itemCooldowns=fresh.itemCooldowns||{};fresh.itemCooldowns[cooldownKey]=Math.max(0,Number(found.ability.cooldown)||0);
  localStorage.setItem(key(heroId),JSON.stringify(fresh));if(String(current||"")===String(heroId))state=fresh;
  showEffectPopup("⚡",found.ability.name,notes.map(z40kEscHtml).join("<br>")||"Capacité activée.",found.it.name+" · recharge "+Math.max(0,Number(found.ability.cooldown)||0)+" tours",true)
};

const originalTick316=window.tickDungeonTalentRuntimeEffects;
if(typeof originalTick316==="function")window.tickDungeonTalentRuntimeEffects=function(){
  const result=originalTick316.apply(this,arguments);
  (dungeonParticipants?.()||[]).forEach(id=>{
    const heroState=loadState(id);let changed=false;
    if(heroState.itemCooldowns)Object.keys(heroState.itemCooldowns).forEach(keyName=>{const next=Math.max(0,(Number(heroState.itemCooldowns[keyName])||0)-1);if(next!==heroState.itemCooldowns[keyName]){heroState.itemCooldowns[keyName]=next;changed=true}});
    if(changed)localStorage.setItem(key(id),JSON.stringify(heroState))
  });
  return result
};

function addAbilityButtons316(){
  const host=document.getElementById("combatHeroSide");if(!host)return;
  const heroIds=[...(dungeonCombatSelection?.heroes||[])].sort((a,b)=>dungeonCombatHeroSnapshot(b).initiative-dungeonCombatHeroSnapshot(a).initiative);
  [...host.querySelectorAll(".combatantCard")].forEach((card,position)=>{
    card.querySelector(".dc316ItemAbilities")?.remove();const heroId=heroIds[position],abilities=heroId?equippedItemAbilities316(heroId):[];if(!abilities.length)return;
    const target=card.querySelector(".dungeonCombatTargetSelect"),box=document.createElement("div");box.className="dc316ItemAbilities";box.innerHTML="<strong>⚡ COMPÉTENCES D’OBJET</strong>";
    abilities.forEach(({it,ability})=>{
      const cooldown=Math.max(0,Number(loadState(heroId)?.itemCooldowns?.[it.id+":"+ability.id])||0),button=document.createElement("button");
      button.type="button";button.className="dc316AbilityBtn dungeonHeroCombatAttackBtn";button.disabled=cooldown>0;button.textContent="⚡ "+ability.name+(cooldown?" · "+cooldown+"t":"");button.onclick=()=>window.dungeonCombatUseItemAbility316(heroId,it.id,ability.id,target?.value||"");box.appendChild(button)
    });
    card.appendChild(box)
  })
}
const render214316=window.__dc214RenderCombat;
if(typeof render214316==="function")window.__dc214RenderCombat=function(){const result=render214316.apply(this,arguments);try{addAbilityButtons316()}catch(e){console.warn("Compétences objets 3.16",e)}return result};

window.dungeonDebug316=function(heroId=current){
  const abilities=heroId?equippedItemAbilities316(heroId):[];
  return {catalogue:ITEMS316.length,sets:dungeonEquippedSetState(),abilities:abilities.map(entry=>entry.it.id+":"+entry.ability.id)}
};
})();
