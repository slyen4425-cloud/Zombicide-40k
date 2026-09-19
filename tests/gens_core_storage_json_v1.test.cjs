const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','core','storage-json-v1.js');
const src=fs.readFileSync(file,'utf8');

assert.doesNotThrow(()=>new Function(src),'storage service source must stay syntactically valid');
assert.doesNotMatch(src,/\b(?:document|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener)\b/,'storage service must not own DOM, observers, listeners, timers or IndexedDB');

const values=new Map();
const storage={
  getItem(k){return values.has(k)?values.get(k):null},
  setItem(k,v){values.set(k,String(v))},
  removeItem(k){values.delete(k)}
};
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.localStorage=storage;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'storage-json-v1.js'});
const api=ctx.GensStorageJsonV1;

assert.ok(api,'JSON storage API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');

assert.deepEqual(api.readJson('rooms',[],storage),[],'missing key must return caller fallback');
values.set('bad','{broken');
assert.deepEqual(api.readJson('bad',{},storage),{},'invalid JSON must return caller fallback');
values.set('nil','null');
assert.deepEqual(api.readJson('nil',[],storage),[],'stored null must return caller fallback');
values.set('falsey','false');
assert.equal(api.readJson('falsey',true,storage),false,'valid false must not be replaced by fallback');
values.set('zero','0');
assert.equal(api.readJson('zero',9,storage),0,'valid zero must not be replaced by fallback');

const payload={schema:1,rooms:[{id:'room-a'}]};
assert.equal(api.writeJson('roundtrip',payload,storage),payload,'writeJson returns the caller value');
assert.equal(values.get('roundtrip'),JSON.stringify(payload),'writeJson must persist plain JSON without format decoration');
assert.deepEqual(JSON.parse(JSON.stringify(api.readJson('roundtrip',null,storage))),payload,'read/write round-trip must preserve JSON shape');

api.remove('roundtrip',storage);
assert.equal(values.has('roundtrip'),false,'remove must delete the exact key');

assert.throws(()=>api.readJson('',null,storage),/key required/,'empty keys must be rejected');
assert.throws(()=>api.writeJson('x',{},{}),/adapter unavailable/,'invalid adapters must be rejected');

const writeFailure={
  getItem(){return null},
  setItem(){throw new Error('quota')},
  removeItem(){}
};
assert.throws(()=>api.writeJson('quota-test',{a:1},writeFailure),/quota/,'write errors must propagate to the module owner');

const implicit={};implicit.window=implicit;implicit.globalThis=implicit;implicit.localStorage=storage;
vm.createContext(implicit);vm.runInContext(src,implicit,{filename:'storage-json-v1.js'});
implicit.GensStorageJsonV1.writeJson('implicit',[1,2,3]);
assert.deepEqual(JSON.parse(values.get('implicit')),[1,2,3],'global localStorage remains the default adapter when no explicit adapter is passed');

console.log(JSON.stringify({
  scenario:'Phase 4 pure JSON storage service',
  productionLoaded:false,
  api:['readJson','writeJson','remove'],
  ownsBusinessKeys:false,
  ownsSchemaMigration:false
},null,2));
