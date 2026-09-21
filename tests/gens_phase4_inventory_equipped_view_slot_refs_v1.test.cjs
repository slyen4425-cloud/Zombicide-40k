'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const core=read('assets/gensrpg/core/inventory-equipped-view-v1.js');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');

const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from('blob '+bytes.length),Buffer.from([0]),bytes]))
  .digest('hex');
assert.equal(bytes.length,8174580);
assert.equal(blob,'5b9b9ae780f735eadef049afeb10acf0b57441fe');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const openParen=source.indexOf('(',start);
  let parens=0,quote=null,escaped=false,line=false,block=false,close=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')parens++;
    else if(c===')'&&--parens===0){close=i;break}
  }
  const brace=source.indexOf('{',close);
  assert.ok(brace>close,'missing inline owner body '+name);
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

const serviceCtx={console,Object,Array,Set,Map,Number,Math};
serviceCtx.globalThis=serviceCtx;
vm.createContext(serviceCtx);
vm.runInContext(core,serviceCtx,{filename:'inventory-equipped-view-v1.js'});
const Core=serviceCtx.GensInventoryEquippedViewV1;
assert.ok(Core,'pure Core Inventory equipped-view API missing');

const items={
  sword:{id:'sword'},
  shield:{id:'shield'},
  helm:{id:'helm'},
  boots:{id:'boots'}
};
const inventory=[
  {uid:'u0',itemId:'sword'},
  {uid:'u1',itemId:'shield'},
  {uid:'u2',itemId:'helm'},
  {uid:'u3',itemId:'boots'},
  {uid:'u4',itemId:'sword'}
];
const itemById=id=>items[id]||null;

function historicalView(slotState){
  const ctx={
    console,
    state:{
      inventory:slotState.inventory,
      rightHand:slotState.rightHand,
      leftHand:slotState.leftHand,
      rpgGear:slotState.rpgGear
    },
    isDungeonHeroSheet:()=>true,
    itemById
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  for(const name of ['getEntry','getItemFromEntry','dungeonEquippedItems']){
    vm.runInContext(extractFunction(index,name),ctx,{filename:'index#'+name});
  }
  return Array.from(ctx.dungeonEquippedItems(),item=>item?.id||null);
}

function coreView(slotState){
  return Array.from(Core.equippedItems({
    inventory:slotState.inventory,
    rightHand:slotState.rightHand,
    leftHand:slotState.leftHand,
    rpgGear:slotState.rpgGear,
    resolveItem:entry=>itemById(entry?.itemId)
  }),item=>item?.id||null);
}

const fixtures=[
  {
    name:'hands then RPG gear',
    inventory,
    rightHand:0,leftHand:1,
    rpgGear:{head:2,shoulders:null,torso:null,legs:null,feet:3,hands:null,neck:null,offhand:null}
  },
  {
    name:'same inventory index referenced twice',
    inventory,
    rightHand:0,leftHand:0,
    rpgGear:{head:2,offhand:1}
  },
  {
    name:'invalid and out-of-range refs',
    inventory,
    rightHand:99,leftHand:'1',
    rpgGear:{head:-1,feet:3,neck:null}
  },
  {
    name:'distinct copies of same item id remain distinct indices',
    inventory,
    rightHand:0,leftHand:4,
    rpgGear:{}
  }
];

for(const fixture of fixtures){
  assert.deepEqual(
    coreView(fixture),
    historicalView(fixture),
    'Core equipped view parity: '+fixture.name
  );
}

assert.deepEqual(
  Array.from(Core.equippedIndices({
    inventoryLength:inventory.length,
    rightHand:0,leftHand:0,
    rpgGear:{head:2,feet:3,offhand:1}
  })),
  [0,2,3,1],
  'indices must preserve historical right/left/gear insertion order while deduplicating refs'
);

assert.equal(Core.rebaseIndexAfterRemoval(0,0),null);
assert.equal(Core.rebaseIndexAfterRemoval(1,0),0);
assert.equal(Core.rebaseIndexAfterRemoval(0,2),0);
assert.equal(Core.rebaseIndexAfterRemoval(null,2),null);
assert.equal(Core.rebaseIndexAfterRemoval('2',1),1,'numeric-string legacy refs must preserve historical array-index compatibility');
assert.equal(Core.rebaseIndexAfterRemoval('bad',1),null,'non-numeric legacy garbage must stay invalid');

const rebased=JSON.parse(JSON.stringify(Core.rebaseSlotRefsAfterRemoval({
  rightHand:3,
  leftHand:1,
  rpgGear:{head:2,torso:4,feet:null}
},2)));
assert.deepEqual(rebased,{
  rightHand:2,
  leftHand:1,
  rpgGear:{head:null,torso:3,feet:null}
});

assert.equal(Core.equippedItems({
  inventory,
  rightHand:0,leftHand:null,rpgGear:{},
  resolveItem:()=>null
}).length,0,'unresolved inventory entries must not enter equipped item view');

const forbidden=/\b(?:document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|fetch|XMLHttpRequest|navigator|location)\b|\.install\s*\(|__original|monkey/i;
assert.doesNotMatch(core,forbidden,'pure Equipped View service must remain side-effect free');

for(const text of [pages,preview,sw,bootstrap]){
  assert.equal(text.includes('inventory-equipped-view-v1.js'),false,'pure micro-lot must remain outside production composition');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Inventory pure Equipped View / Slot Refs',
  verifiedIndexBlob:blob,
  historicalParityCases:fixtures.length,
  slotOrder:'rightHand -> leftHand -> Object.entries(rpgGear)',
  duplicateIndexRemoved:true,
  duplicateItemCopiesPreserved:true,
  numericStringRefsPreserved:true,
  removalRebasePure:true,
  productionReachable:false,
  runtimeChanged:false
},null,2));
