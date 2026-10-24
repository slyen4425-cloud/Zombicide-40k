const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','core','storage-v1.js');
const src=fs.readFileSync(file,'utf8');

assert.doesNotThrow(()=>new Function(src),'Core storage source must stay syntactically valid');
assert.doesNotMatch(src,/\b(?:document|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener)\b/,'Core storage must not own DOM, observers, listeners or timers');
assert.doesNotMatch(src,/gensrpg_|dungeon_|capture_|survival_|roomId|normalizeRoom|normalizeMeta|normalizeGraph/i,'Core storage must not know business keys or module schemas');

const ctx={};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'storage-v1.js'});
const api=ctx.GensStorageV1;
assert.ok(api,'Core storage API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');

function memory(initial={}){
  const values=new Map(Object.entries(initial).map(([k,v])=>[String(k),String(v)]));
  return {
    values,
    getItem(k){return values.has(String(k))?values.get(String(k)):null},
    setItem(k,v){values.set(String(k),String(v))}
  };
}

const store=memory();
const fallback=[];
assert.equal(api.readJson(store,'missing',fallback),fallback,'missing key must return the caller fallback');
store.values.set('broken','{not-json');
assert.deepEqual(api.readJson(store,'broken',{safe:true}),{safe:true},'invalid JSON must return fallback');
store.values.set('empty','');
assert.equal(api.readJson(store,'empty','fallback'),'fallback','empty storage value must behave as missing');
store.values.set('null','null');
assert.deepEqual(api.readJson(store,'null',{fallback:true}),{fallback:true},'stored null must return fallback');
store.values.set('number','42');
assert.equal(api.readJson(store,'number',0),42,'valid JSON primitives must be preserved');

const payload={a:1,nested:{ok:true},items:['x','y']};
assert.equal(api.writeJson(store,'object',payload),payload,'writeJson must return the original value');
assert.equal(store.values.get('object'),JSON.stringify(payload),'writeJson must persist the exact JSON serialization');
assert.equal(JSON.stringify(api.readJson(store,'object',null)),JSON.stringify(payload),'object round-trip must preserve data');

const bound=api.create(store);
const list=[{id:'a'},{id:'b'}];
assert.equal(bound.writeJson('list',list),list);
assert.equal(JSON.stringify(bound.readJson('list',[])),JSON.stringify(list),'bound adapter round-trip must preserve arrays');

const denied={
  getItem(){throw new Error('read denied')},
  setItem(){throw new Error('write denied')}
};
assert.equal(api.readJson(denied,'x','safe'),'safe','read failures must keep historical tolerant fallback semantics');
assert.throws(()=>api.writeJson(denied,'x',{a:1}),/write denied/,'write failures must propagate');
assert.throws(()=>api.create({}),/storage adapter/,'invalid adapters must fail explicitly');

const circular={};circular.self=circular;
assert.throws(()=>api.writeJson(store,'circular',circular),/circular|cyclic/i,'serialization failures must propagate');

console.log(JSON.stringify({
  scenario:'Phase 4 pure Core JSON storage contract',
  productionLoaded:true,
  businessKeysKnown:false,
  semantics:['missing->fallback','invalid-json->fallback','null->fallback','round-trip','write-errors-propagate']
},null,2));
