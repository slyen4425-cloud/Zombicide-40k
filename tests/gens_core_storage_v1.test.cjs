const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/storage-v1.js';
const file=path.join(root,rel);
assert.equal(fs.existsSync(file),true,'Phase 4 Core storage service must exist');

const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'Core storage service source must stay syntactically valid');
assert.doesNotMatch(
  src,
  /\b(?:document|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|fetch|XMLHttpRequest)\b/,
  'Core storage service must not own UI, timers, observers, listeners, network or IndexedDB'
);
assert.doesNotMatch(src,/gensrpg_[a-z0-9_]+/i,'Core storage service must not contain product storage keys');
assert.doesNotMatch(src,/SCHEMA_VERSION|normalizeRoom|normalizeMeta|normalizeGraph/,'Core storage service must not own module schemas or normalizers');

function makeStorage(initial={}){
  const values=new Map(Object.entries(initial).map(([k,v])=>[k,String(v)]));
  return {
    values,
    getItem(k){return values.has(String(k))?values.get(String(k)):null},
    setItem(k,v){values.set(String(k),String(v))},
    removeItem(k){values.delete(String(k))}
  };
}

const globalStorage=makeStorage();
const ctx={localStorage:globalStorage};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:rel});

const api=ctx.GensStorageV1;
assert.ok(api,'GensStorageV1 API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');
assert.equal(Object.isFrozen(api),true,'storage API surface must be frozen');

const arrFallback=[];
assert.equal(api.readJson('missing',arrFallback),arrFallback,'missing key must return caller fallback unchanged');

globalStorage.setItem('bad','{not-json');
const badFallback={safe:true};
assert.equal(api.readJson('bad',badFallback),badFallback,'invalid JSON must return caller fallback unchanged');

globalStorage.setItem('nullish','null');
const nullFallback={fallback:true};
assert.equal(api.readJson('nullish',nullFallback),nullFallback,'stored JSON null must return caller fallback');

const arrayValue=[{id:'a'},2];
assert.equal(api.writeJson('array',arrayValue),arrayValue,'writeJson must return the original value');
assert.equal(globalStorage.getItem('array'),JSON.stringify(arrayValue),'writeJson must store exact JSON.stringify output');
assert.deepEqual(JSON.parse(JSON.stringify(api.readJson('array',[]))),arrayValue,'array round-trip must preserve JSON data');

const objectValue={roomId:'r1',attachments:[{id:'x'}]};
api.writeJson('object',objectValue);
assert.deepEqual(JSON.parse(JSON.stringify(api.readJson('object',{}))),objectValue,'object round-trip must preserve JSON data');

api.remove('object');
assert.equal(globalStorage.getItem('object'),null,'remove must delete the exact key');

const custom=makeStorage({custom:JSON.stringify({ok:1})});
assert.deepEqual(JSON.parse(JSON.stringify(api.readJson('custom',{},custom))),{ok:1},'injected backend must be supported');
api.writeJson('customWrite',{ok:2},custom);
assert.equal(custom.getItem('customWrite'),'{"ok":2}','injected backend writes must stay isolated');
assert.equal(globalStorage.getItem('customWrite'),null,'injected backend must not leak to global storage');

const throwing={
  getItem(){return null},
  setItem(){throw new Error('quota-test')},
  removeItem(){}
};
assert.throws(()=>api.writeJson('x',{a:1},throwing),/quota-test/,'write errors must propagate instead of being hidden');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
assert.equal(index.includes(rel),false,'Core storage must not be injected into the historical source index');
assert.equal(bootstrap.includes(rel),false,'Core storage must not be hidden behind the Tactical bootstrap');
for(const composition of [preview,workflow]){
  const storagePos=composition.indexOf(rel);
  const roomPos=composition.indexOf('assets/dungeon/dungeon-room-creator-100.js');
  assert.ok(storagePos>=0&&roomPos>storagePos,'Core storage must be explicitly loaded before Room Creator 1.0');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core JSON storage service',
  productionLoaded:true,
  api:['readJson','writeJson','remove'],
  ownsBusinessKeys:false,
  formatMigration:false
},null,2));
