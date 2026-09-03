const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-core-317.js'),'utf8');

const store=new Map();
store.set('gensrpg_dungeon_runtime_v2',JSON.stringify({participants:['hero1','hero2'],index:0,room:1,roomStates:{},positions:{},remaining:{}}));
const els={
  merchantList:{innerHTML:''},
  merchantWallet:{innerHTML:''},
  merchantHero071:{innerHTML:'',value:''},
  merchantModal:{style:{display:'none'}}
};
const states={hero1:{inventory:[],gold:100},hero2:{inventory:[],gold:50}};
const items=[
  {id:'sword',name:'Épée',type:'Arme',price:10,weapon:true},
  {id:'armor',name:'Armure',type:'Armure',price:20,rpgSlot:'chest'},
  {id:'potion',name:'Potion',type:'Consommable',price:5,consumable:true},
  {id:'gem',name:'Gemme',type:'Trésor',price:7}
];
const byId=Object.fromEntries(items.map(x=>[x.id,x]));
let intervalFn=null;
const ctx={
  console,Date,Math,JSON,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},
  document:{readyState:'complete',documentElement:{},getElementById:id=>els[id]||null,createElement:()=>({})},
  MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn(),
  setInterval:fn=>{intervalFn=fn;return 1},clearInterval(){},
  current:'hero1',state:states.hero1,
  CHARS:{hero1:{name:'Aldren'},hero2:{name:'Lyra'}},findCustomHero(){return null},
  dungeonParticipants:()=>['hero1','hero2'],gensEconomyEnabled:()=>true,
  currentRpgEconomy:()=>({merchantBuyMultiplier:1,sellPercent:50,currencyName:'Or',merchantStockLimits:{weapons:2,equipment:4,consumables:5,other:1}}),
  gensHeroGold:id=>states[id].gold,gensCurrencyLabel:n=>`${n} Or`,merchantItems:()=>items,
  loadState:id=>states[id],dungeonMerchantDefaultPrice066:it=>it?.price||0,itemById:id=>byId[id],
  makeInventoryEntry:id=>({itemId:id}),key:id=>`hero:${id}`,
  renderInventory(){},renderEconomyWallet(){},renderHands(){},renderGear(){},modal(){},alert(){},
  renderMerchant071(){els.merchantList.innerHTML='OLD MERCHANT'},
  renderMerchant(){els.merchantList.innerHTML='OLD WINDOW MERCHANT'},
  merchantBuy(){},merchantSell(){},
  openMerchant(){this.renderMerchant071();els.merchantModal.style.display='block'},
  merchantSelectHero071(){},merchantBuy071(){},merchantSell071(){}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dungeon-core-317.js'});

assert.equal(ctx.DungeonCore317.VERSION,'3.17.2');
assert.equal(ctx.GENSRPG_VERSION,'16.78.13');
assert.equal(ctx.DungeonCore317.resolveArmorFloor(2,5,1,'physical',{armorZeroBlockChance:75},74),0);
assert.equal(ctx.DungeonCore317.resolveArmorFloor(2,5,1,'physical',{armorZeroBlockChance:75},75),1);

ctx.openMerchant();
assert.equal(els.merchantModal.style.display,'block');
assert(els.merchantList.innerHTML.includes('data-dc317-merchant-tab="weapons"'));
assert(els.merchantList.innerHTML.includes('Stock : 2'));
assert(!els.merchantList.innerHTML.includes('OLD MERCHANT'));
assert(els.merchantHero071.innerHTML.includes('Aldren'));
assert(els.merchantHero071.innerHTML.includes('Lyra'));

ctx.merchantSelectHero071('hero2');
assert(els.merchantWallet.innerHTML.includes('Lyra'));
ctx.DungeonCore317.setMerchantTab('equipment');
assert(els.merchantList.innerHTML.includes('Armure'));
assert(els.merchantList.innerHTML.includes('Stock : 4'));

ctx.DungeonCore317.setMerchantTab('weapons');
ctx.merchantBuy071('sword');
let rt=JSON.parse(store.get('gensrpg_dungeon_runtime_v2'));
assert.equal(rt.merchantStock317.sword,1);
assert.equal(states.hero2.inventory.length,1);
assert.equal(states.hero2.gold,40);

ctx.merchantSell071(0);
rt=JSON.parse(store.get('gensrpg_dungeon_runtime_v2'));
assert.equal(rt.merchantStock317.sword,2);
assert.equal(states.hero2.inventory.length,0);
assert.equal(states.hero2.gold,45);

assert(intervalFn,'retry guard should be installed');
console.log('Core 3.17.2 merchant open/stock/hero/armor: OK');
