'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const core316=read('assets/dungeon/dungeon-core-316.js');
const inventoryCore=read('assets/gensrpg/core/inventory-equipped-view-v1.js');
const hotfix=read('assets/dungeon/dungeon-equipment-hotfix-167817.js');
const ui=read('assets/dungeon/dungeon-equipment-ui.js');
const setEditor=read('assets/dungeon/dungeon-set-editor-167818.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');
const statsNormalization=read('assets/gensrpg/core/stats-normalization-v1.js');
const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const artBridge=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const sw=read('service-worker.js');

const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from('blob '+bytes.length),Buffer.from([0]),bytes]))
  .digest('hex');
assert.equal(bytes.length,8172529,'preaudit must execute the exact verified index');
assert.equal(blob,'696014056409dda9b6ef25ace58dfd9d5f9e2718','preaudit index blob drifted');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing owner function '+name);
  const openParen=source.indexOf('(',start);
  let parenDepth=0,quote=null,escaped=false,line=false,block=false,closeParen=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')parenDepth++;
    else if(c===')'&&--parenDepth===0){closeParen=i;break}
  }
  assert.ok(closeParen>openParen,'missing owner parameter close '+name);
  const brace=source.indexOf('{',closeParen);
  assert.ok(brace>closeParen,'missing owner body '+name);
  let depth=0;quote=null;escaped=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const items={
  sword:{id:'sword',name:'Sword',type:'Arme',hands:1,rpgBonuses:{force:2}},
  leatherTorso:{id:'leatherTorso',name:'Leather torso',type:'Équipement',rpgSlot:'torso',setId:'set_leather',setPieceId:'torso',rpgBonuses:{armor:1}},
  leatherGloves:{id:'leatherGloves',name:'Leather gloves',type:'Équipement',rpgSlot:'hands',setId:'set_leather',setPieceId:'hands',rpgBonuses:{agilite:1}}
};
const byId=Object.fromEntries(Object.values(items).map(item=>[item.id,item]));
const state={
  inventory:[
    {uid:'u0',itemId:'sword'},
    {uid:'u1',itemId:'leatherTorso'},
    {uid:'u2',itemId:'leatherGloves'}
  ],
  rightHand:0,leftHand:null,
  rpgGear:{head:null,shoulders:null,torso:1,legs:null,feet:null,hands:2,neck:null,offhand:null}
};
let saves=0;
const ctx={
  console,Math,Number,Date,Set,Map,
  state,
  isDungeonHeroSheet:()=>true,
  isDungeonMode:()=>true,
  itemById:id=>byId[id]||null,
  z40kPlayUiSound:()=>{},
  save:()=>{saves++;return true},
  renderGear:()=>{},renderInventory:()=>{},renderDungeonAttributes:()=>{},
  renderHands:()=>{},renderAttackButtons:()=>{},
  equipGear:()=>{throw new Error('Dungeon RPG gear must not fall through to legacy equipGear')}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
for(const name of [
  'getEntry','getItemFromEntry','dungeonEquippedItems','dungeonEquipmentBonus',
  'inferRpgSlot','equipRpgGear','unequipRpgGear',
  'clearEquippedTwoHandWeapon','equipRight','equipLeft','equipTwoHands','unequip'
]){
  vm.runInContext(extractFunction(index,name),ctx,{filename:'index#'+name});
}

assert.deepEqual(
  Array.from(ctx.dungeonEquippedItems(),x=>x.id),
  ['sword','leatherTorso','leatherGloves'],
  'base equipped view must derive uniquely from hands + rpgGear slots'
);
assert.equal(ctx.dungeonEquipmentBonus('force'),2);
assert.equal(ctx.dungeonEquipmentBonus('armor'),1);
assert.equal(ctx.dungeonEquipmentBonus('agilite'),1);

ctx.unequipRpgGear('torso');
assert.equal(state.rpgGear.torso,null,'real RPG unequip owner must clear the slot ref');
ctx.equipRpgGear(1);
assert.equal(state.rpgGear.torso,1,'real RPG equip owner must write inventory index into inferred slot');

ctx.unequip('right');
assert.equal(state.rightHand,null,'real hand unequip owner must clear rightHand');
ctx.equipRight(0);
assert.equal(state.rightHand,0,'real hand equip owner must write inventory index');
assert.ok(saves>=4,'real slot mutation owners must persist changes');

ctx.isDungeonHeroSheet=()=>false;
vm.runInContext(inventoryCore,ctx,{filename:'inventory-equipped-view-v1.js'});
vm.runInContext(hotfix,ctx,{filename:'dungeon-equipment-hotfix-167817.js'});
assert.equal(ctx.dungeonEquippedItems.__equipmentHotfix167817,true,'hotfix must be active on equipped view');
assert.deepEqual(
  Array.from(ctx.dungeonEquippedItems(),x=>x.id),
  ['sword','leatherTorso','leatherGloves'],
  'hotfix must rebuild equipped view from state slots when sheet guard returns empty'
);

const setCtx={
  console,Math,Number,
  DUNGEON_EQUIPMENT_SETS:{
    set_leather:{
      id:'set_leather',name:'Leather',pieceCount:5,
      thresholds:[
        {pieces:2,bonuses:{agilite:1}},
        {pieces:3,bonuses:{dodge:5}}
      ]
    }
  }
};
setCtx.window=setCtx;setCtx.globalThis=setCtx;
vm.createContext(setCtx);
vm.runInContext(extractFunction(core316,'thresholds316'),setCtx,{filename:'core316#thresholds316'});
vm.runInContext(extractFunction(core316,'setState316'),setCtx,{filename:'core316#setState316'});
const setState=JSON.parse(JSON.stringify(setCtx.setState316([items.leatherTorso,items.leatherGloves])));
assert.equal(setState.length,1);
assert.equal(setState[0].count,2);
assert.deepEqual(setState[0].bonuses,{agilite:1},'real Core 3.16 set owner must apply cumulative reached thresholds only');

const evoCtx={console,Math,Number,JSON,Map,Set,globalThis:null};
evoCtx.globalThis=evoCtx;
vm.createContext(evoCtx);
vm.runInContext(cleanup,evoCtx,{filename:'gens-equipment-stat-cleanup-1678102.js'});
const evo=evoCtx.GensEquipmentStatCleanup1678102;
assert.ok(evo,'equipment cleanup API missing');
const evolved={
  evolution:{enabled:true,levels:[
    {level:2,xp:10,rpgBonuses:{force:2}},
    {level:3,xp:20,rpgBonuses:{force:3}}
  ]}
};
assert.equal(evo.evolutionBonusForItem(evolved,'force',9),0);
assert.equal(evo.evolutionBonusForItem(evolved,'force',10),2);
assert.equal(evo.evolutionBonusForItem(evolved,'force',25),5,'real evolution owner must accumulate unlocked levels');

assert.match(core316,/const originalEquipmentBonus316=window\.dungeonEquipmentBonus/);
assert.match(core316,/return itemBonus\+dungeonSetBonusTotal\(key\)/,'Core 3.16 must layer set bonus over direct item bonus');
const equipmentBonusPatch=extractFunction(cleanup,'patchEquipmentBonus');
assert.match(equipmentBonusPatch,/const old=R\.dungeonEquipmentBonus,core=R\.GensEquipmentBonusSetsV1/);
assert.match(equipmentBonusPatch,/core\.totalBonus\(items,key,R\.DUNGEON_EQUIPMENT_SETS\|\|\{\}\)/,'cleanup must delegate direct + set bonus to Core');
assert.match(equipmentBonusPatch,/\+cachedEvolutionBonus\(key\)/,'cleanup must keep evolution layered after Core direct + sets');
assert.equal(/old\.apply\(this,arguments\)/.test(equipmentBonusPatch),false,'active Equipment owner must not execute the historical direct + set chain after Core raccord');
assert.match(perf,/wrapValue\("dungeonEquipmentBonus",valueCaches\.equipment/,'performance layer must cache the final equipment seam');
assert.ok(statsNormalization.includes('GensStatsNormalizationV1'),'preaudit must retain the explicit Core Stats dependency before inspecting the Stats owner');
assert.match(stats,/equipmentValues\[id\]=num\(R\.dungeonEquipmentBonus\?\.\(id\),0\)/,'Core Stats must consume Equipment through the explicit seam');
assert.match(stats,/\{source:"equipment",values:equipmentValues\}/,'S5 input must keep Equipment as an explicit modifier source');

for(const key of [
  'gensrpg_custom_equipment_v1',
  'gensrpg_dungeon_item_overrides_v1'
])assert.ok(index.includes(key),'inline equipment storage key missing: '+key);
assert.match(setEditor,/gensrpg_dungeon_set_overrides_v1/);
assert.match(cleanup,/gensrpg_dungeon_set_overrides_v1/);

assert.match(ui,/new ROOT\.MutationObserver/,'legacy equipment UI observer debt must remain visible in preaudit');
assert.match(ui,/ROOT\.renderDungeonGear=wrapped/,'legacy equipment UI renderer wrapper must remain visible');
assert.match(hotfix,/wrapped\.__original=baseEquipped/);
assert.match(setEditor,/ROOT\.openEquipmentEditor=wrapped/);
assert.match(setEditor,/ROOT\.saveEquipmentEditor=wrapped/);
assert.match(cleanup,/wrapCacheInvalidator/);
assert.equal(cleanup.includes('"equipRpgGear"'),false,'current cleanup invalidator list does not explicitly name equipRpgGear');
assert.equal(cleanup.includes('"unequipRpgGear"'),false,'current cleanup invalidator list does not explicitly name unequipRpgGear');
assert.equal(cleanup.includes('"equipRight"'),false,'current cleanup invalidator list does not explicitly name equipRight');
assert.equal(cleanup.includes('"equipLeft"'),false,'current cleanup invalidator list does not explicitly name equipLeft');
assert.match(perf,/setTimeout\(install,250\);setTimeout\(install,1200\)/,'performance cache rewrap cadence must stay characterized');

const order=[
  'assets/dungeon/dungeon-equipment-ui.js',
  'assets/dungeon/dungeon-equipment-hotfix-167817.js',
  'assets/dungeon/dungeon-set-editor-167818.js',
  'assets/gensrpg/core/stats-modifier-provider-v1.js',
  'assets/gensrpg/gens-rpg-stats-clean-167874.js',
  'assets/gensrpg/gens-dungeon-hero-art-repair-167874.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
];
let last=-1;
for(const rel of order){
  const pos=pages.indexOf(rel);
  assert.ok(pos>last,'Pages load order drifted at '+rel);
  last=pos;
}
assert.match(artBridge,/gens-equipment-stat-cleanup-1678102\.js\?v=1678102/,'art bridge must still dynamically load equipment cleanup');
for(const rel of [
  './assets/dungeon/dungeon-equipment-ui.js',
  './assets/dungeon/dungeon-equipment-hotfix-167817.js',
  './assets/dungeon/dungeon-set-editor-167818.js',
  './assets/gensrpg/gens-equipment-stat-cleanup-1678102.js'
])assert.ok(sw.includes(rel),'PWA precache missing '+rel);
for(const rel of [
  'dungeon-equipment-ui.js',
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js'
])assert.ok(preview.includes(rel),'preview missing '+rel);

console.log(JSON.stringify({
  scenario:'Phase 4 inventory equipment sets preaudit',
  verifiedIndexBlob:blob,
  stateAuthority:['inventory','rightHand','leftHand','rpgGear'],
  equippedViewBaseOwner:'inline dungeonEquippedItems',
  equippedViewCompatibilityOwner:'dungeon-equipment-hotfix-167817',
  bonusChain:['Core direct + set','evolution 16.78.102.1','performance cache','Core Stats S5'],
  setEngineExecuted:true,
  evolutionEngineExecuted:true,
  slotMutationOwnersExecuted:true,
  cacheInvalidationNameGapCharacterized:true,
  runtimeChanged:false
},null,2));
