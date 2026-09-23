'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const indexPath=path.join(root,'index.html');
const corePath=path.join(root,'assets','gensrpg','core','inventory-equipped-view-v1.js');

assert.ok(fs.existsSync(corePath),'Core Inventory equipped-view contract module must exist');

const index=fs.readFileSync(indexPath,'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from('blob '+bytes.length),Buffer.from([0]),bytes]))
  .digest('hex');
assert.equal(bytes.length,8171795);
assert.equal(blob,'4f8c3b9be4189a9ac163fcb17531c95cbd783b05');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const openParen=source.indexOf('(',start);
  let p=0,quote=null,esc=false,line=false,block=false,close=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')p++;
    else if(c===')'&&--p===0){close=i;break}
  }
  assert.ok(close>openParen,'missing parameter close '+name);
  const brace=source.indexOf('{',close);
  let depth=0;quote=null;esc=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

function extractAssignedFunction(source,token){
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing assigned owner '+token);
  const functionStart=source.indexOf('function',start);
  const openParen=source.indexOf('(',functionStart);
  let p=0,close=-1;
  for(let i=openParen;i<source.length;i++){
    if(source[i]==='(')p++;
    else if(source[i]===')'&&--p===0){close=i;break}
  }
  const brace=source.indexOf('{',close);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0)return source.slice(start,i+2);
  }
  throw new Error('unterminated assigned owner '+token);
}

const items=[
  {uid:'u0',itemId:'sword'},
  {uid:'u1',itemId:'helm'},
  {uid:'u2',itemId:'boots'},
  {uid:'u3',itemId:'ring'}
];
const catalogue={
  sword:{id:'sword',name:'Sword',hands:2},
  helm:{id:'helm',name:'Helm'},
  boots:{id:'boots',name:'Boots'},
  ring:{id:'ring',name:'Ring'}
};
const state={
  inventory:items.map(x=>({...x})),
  rightHand:0,
  leftHand:0,
  equipment:null,
  rpgGear:{head:1,feet:2,neck:1,offhand:99}
};
const ctx={
  console,Number,Set,Object,
  state,
  isDungeonHeroSheet:()=>true,
  itemById:id=>catalogue[id]||null
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
for(const name of ['getEntry','getItemFromEntry','dungeonEquippedItems','clearIndexFromHands','removeInventoryEntry']){
  vm.runInContext(extractFunction(index,name),ctx,{filename:'index#'+name});
}
const baseRemove=ctx.removeInventoryEntry;
const wrapper=extractAssignedFunction(index,'window.removeInventoryEntry=function(i)');
vm.runInContext('const oldRemove062=window.removeInventoryEntry;\n'+wrapper,ctx,{filename:'index#core105-remove-wrapper'});

const src=fs.readFileSync(corePath,'utf8');
const coreCtx={console,Number,Set,Object};
coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(src,coreCtx,{filename:'inventory-equipped-view-v1.js'});
const Core=coreCtx.GensInventoryEquippedViewV1;
assert.ok(Core&&Core.VERSION,'Core Inventory equipped view API missing');

const resolved=Array.from(ctx.dungeonEquippedItems(),x=>x.id);
assert.deepEqual(resolved,['sword','helm','boots'],'historical equipped view fixture drifted');

const indices=Core.equippedIndices({
  inventory:state.inventory,
  rightHand:state.rightHand,
  leftHand:state.leftHand,
  rpgGear:state.rpgGear
});
assert.deepEqual(Array.from(indices),[0,1,2],'Core must preserve hands-then-RPG order and dedupe repeated refs');

const coreItems=Core.equippedItems({
  inventory:state.inventory,
  rightHand:state.rightHand,
  leftHand:state.leftHand,
  rpgGear:state.rpgGear,
  resolveItem:entry=>catalogue[entry?.itemId]||null
});
assert.deepEqual(Array.from(coreItems,x=>x.id),resolved,'Core equipped view must match historical owner');

const invalid=Core.equippedIndices({
  inventory:state.inventory,
  rightHand:-1,leftHand:99,
  rpgGear:{head:null,feet:'bad',neck:3}
});
assert.deepEqual(Array.from(invalid),[3],'invalid/out-of-range slot refs must not leak into equipped view');

const duplicateByIndex=Core.equippedIndices({
  inventory:state.inventory,
  rightHand:1,leftHand:1,
  rpgGear:{head:1,feet:2,neck:2}
});
assert.deepEqual(Array.from(duplicateByIndex),[1,2]);

const refsBefore={
  rightHand:2,
  leftHand:3,
  equipment:1,
  rpgGear:{head:1,feet:2,neck:3,offhand:null}
};
const expected=Core.reindexRefsAfterRemoval(refsBefore,1);
assert.deepEqual(
  JSON.parse(JSON.stringify(expected)),
  {rightHand:1,leftHand:2,equipment:null,rpgGear:{head:null,feet:1,neck:2,offhand:null}},
  'pure removal contract must null removed refs and decrement later refs'
);

ctx.state={
  inventory:items.map(x=>({...x})),
  rightHand:2,leftHand:3,equipment:1,
  rpgGear:{head:1,feet:2,neck:3,offhand:null}
};
ctx.clearIndexFromHands(1);
ctx.removeInventoryEntry(1);
assert.deepEqual(
  {
    rightHand:ctx.state.rightHand,
    leftHand:ctx.state.leftHand,
    equipment:ctx.state.equipment,
    rpgGear:JSON.parse(JSON.stringify(ctx.state.rpgGear))
  },
  JSON.parse(JSON.stringify(expected)),
  'Core refs-after-removal must match the combined historical removal path'
);

assert.equal(src.includes('document'),false);
assert.equal(src.includes('localStorage'),false);
assert.equal(src.includes('sessionStorage'),false);
assert.equal(src.includes('setTimeout'),false);
assert.equal(src.includes('setInterval'),false);
assert.equal(src.includes('MutationObserver'),false);
assert.equal(src.includes('dungeonEquipmentBonus'),false);
assert.equal(src.includes('GensCleanRpgStats'),false);

console.log(JSON.stringify({
  scenario:'Phase 4 Core Inventory pure equipped view and slot refs contract',
  verifiedIndexBlob:blob,
  equippedParity:true,
  twoHandDedupe:true,
  invalidRefsIgnored:true,
  removalReindexParity:true,
  runtimeConnected:false
},null,2));
