const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','core','storage-json-v1.js');
const src=fs.readFileSync(file,'utf8');

assert.doesNotThrow(()=>new Function(src),'storage service source must stay syntactically valid');
assert.doesNotMatch(
  src,
  /\b(?:document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener)\b/,
  'Core storage JSON service must not own DOM, browser storage selection, observers, listeners or timers'
);
assert.doesNotMatch(src,/gensrpg_|dungeon|capture|survival|pvp|room|graph/i,'Core storage JSON service must not know module keys or schemas');

const ctx={};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'storage-json-v1.js'});
const api=ctx.GensStorageJsonV1;
assert.ok(api,'Core storage JSON API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');

function makeStore(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    values,
    getItem(k){return values.has(k)?values.get(k):null},
    setItem(k,v){values.set(k,String(v))},
    removeItem(k){values.delete(k)}
  };
}

assert.throws(()=>api.create(null),/storage adapter/i);
assert.throws(()=>api.create({getItem(){},setItem(){}}),/storage adapter/i);

const store=makeStore();
const s=api.create(store);
const fallbackArray=[];
const fallbackObject={fallback:true};

assert.equal(s.readJson('missing',fallbackArray),fallbackArray,'missing key must return the caller fallback');
store.values.set('empty','');
assert.equal(s.readJson('empty',fallbackObject),fallbackObject,'empty string must return fallback');
store.values.set('invalid','{oops');
assert.equal(s.readJson('invalid',fallbackObject),fallbackObject,'invalid JSON must return fallback');
store.values.set('null','null');
assert.equal(s.readJson('null',fallbackObject),fallbackObject,'JSON null must return fallback');
store.values.set('zero','0');
assert.equal(s.readJson('zero',99),0,'valid JSON zero must remain zero');
store.values.set('false','false');
assert.equal(s.readJson('false',true),false,'valid JSON false must remain false');
store.values.set('text','"ok"');
assert.equal(s.readJson('text','fallback'),'ok','valid JSON string must be returned');
store.values.set('array','[1,2,3]');
assert.deepEqual(Array.from(s.readJson('array',[])),[1,2,3]);
store.values.set('object','{"a":1}');
assert.equal(s.readJson('object',{}).a,1);

const payload={a:1,nested:['x']};
assert.equal(s.writeJson('roundtrip',payload),payload,'writeJson must return the original value');
assert.equal(store.values.get('roundtrip'),JSON.stringify(payload),'writeJson must persist exactly JSON.stringify(value)');
assert.equal(s.readJson('roundtrip',null).nested[0],'x','written JSON must round-trip');

s.remove('roundtrip');
assert.equal(store.values.has('roundtrip'),false,'remove must delegate to removeItem');

const readFailure=api.create({
  getItem(){throw new Error('read blocked')},
  setItem(){},
  removeItem(){}
});
assert.equal(readFailure.readJson('x',fallbackObject),fallbackObject,'read errors must preserve historical fallback semantics');

const writeFailure=api.create({
  getItem(){return null},
  setItem(){throw new Error('write blocked')},
  removeItem(){}
});
assert.throws(()=>writeFailure.writeJson('x',{a:1}),/write blocked/,'storage write errors must propagate');

const circular={};circular.self=circular;
assert.throws(()=>s.writeJson('circular',circular),/circular/i,'JSON serialization errors must propagate');

console.log(JSON.stringify({
  scenario:'Phase 4 pure Core JSON storage service',
  version:api.VERSION,
  productionLoaded:false,
  implicitBrowserStorage:false,
  moduleKeysKnown:false,
  formatMigration:false
},null,2));
