const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-core-317.js'),'utf8');

const store=new Map();
store.set('gensrpg_dungeon_runtime_v2',JSON.stringify({participants:['hero1'],index:0,room:1,roomStates:{},positions:{},remaining:{}}));
const merchantList={innerHTML:''};
const merchantWallet={innerHTML:''};
let intervalCb=null;
const heroState={inventory:[],gold:100};
const items=[
  {id:'sword',name:'Épée de test',type:'Arme',price:10,weapon:true},
  {id:'armor',name:'Armure de test',type:'Armure',price:20,rpgSlot:'chest'},
  {id:'potion',name:'Potion de soin',type:'Consommable',price:5,consumable:true},
  {id:'gem',name:'Gemme',type:'Trésor',price:7}
];
const byId=Object.fromEntries(items.map(x=>[x.id,x]));
const ctx={
  console,
  document:{readyState:'complete',documentElement:{},getElementById(id){return id==='merchantList'?merchantList:id==='merchantWallet'?merchantWallet:null;}},
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  setInterval(fn){intervalCb=fn;return 1;},
  setTimeout(fn){fn();return 1;},
  requestAnimationFrame(fn){fn();},
  current:'hero1',state:heroState,
  currentRpgEconomy:()=>({merchantBuyMultiplier:1,sellPercent:50,currencyName:'Or',merchantStockLimits:{weapons:2,equipment:4,consumables:5,other:1}}),
  gensHeroGold:()=>heroState.gold,
  gensCurrencyLabel:n=>`${n} Or`,
  merchantItems:()=>items,
  loadState:()=>heroState,
  dungeonMerchantDefaultPrice066:it=>it.price,
  itemById:id=>byId[id],
  makeInventoryEntry:id=>({itemId:id}),
  key:id=>`hero:${id}`,
  renderInventory(){},renderEconomyWallet(){},renderHands(){},renderGear(){},alert(){},modal(){}
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dungeon-core-317.js'});

assert.equal(ctx.DungeonCore317.VERSION,'3.17.1');
assert.equal(ctx.GENSRPG_VERSION,'16.78.12');
assert.equal(ctx.DungeonCore317.resolveArmorFloor(2,5,1,'physical',{armorZeroBlockChance:75},74),0);
assert.equal(ctx.DungeonCore317.resolveArmorFloor(2,5,1,'physical',{armorZeroBlockChance:75},75),1);

ctx.renderMerchant=function oldRender(){};
ctx.merchantBuy=function oldBuy(){};
ctx.merchantSell=function oldSell(){};
assert(intervalCb,'merchant retry timer missing');
intervalCb();
assert.equal(ctx.renderMerchant.__dc317,true,'late merchant override not installed');

ctx.renderMerchant();
for(const id of ['weapons','equipment','consumables','other'])assert(merchantList.innerHTML.includes(`data-dc317-merchant-tab="${id}"`),`missing merchant tab ${id}`);
assert(merchantList.innerHTML.includes('Épée de test'));
assert(merchantList.innerHTML.includes('Stock : 2'));
assert(!merchantList.innerHTML.includes('Armure de test'));

ctx.DungeonCore317.setMerchantTab('equipment');
assert(merchantList.innerHTML.includes('Armure de test'));
assert(merchantList.innerHTML.includes('Stock : 4'));

ctx.DungeonCore317.setMerchantTab('weapons');
ctx.merchantBuy('sword');
let runtime=JSON.parse(store.get('gensrpg_dungeon_runtime_v2'));
assert.equal(runtime.merchantStock317.sword,1);
assert.equal(heroState.inventory.length,1);
assert.equal(heroState.gold,90);
assert(merchantList.innerHTML.includes('Stock : 1'));

ctx.merchantSell(0);
runtime=JSON.parse(store.get('gensrpg_dungeon_runtime_v2'));
assert.equal(runtime.merchantStock317.sword,2);
assert.equal(heroState.inventory.length,0);
assert.equal(heroState.gold,95);
assert(merchantList.innerHTML.includes('Stock : 2'));

console.log('Core 3.17.1 merchant UI hotfix: OK');
