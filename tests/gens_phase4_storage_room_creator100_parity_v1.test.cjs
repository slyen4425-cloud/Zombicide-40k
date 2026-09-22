const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');
const textUtilsSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','text-utils-v1.js'),'utf8');
const roomSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-100.js'),'utf8');

function makeStorage(initial={}){
  const values=new Map(Object.entries(initial).map(([k,v])=>[String(k),String(v)]));
  return {
    values,
    getItem(k){return values.has(String(k))?values.get(String(k)):null},
    setItem(k,v){values.set(String(k),String(v))},
    removeItem(k){values.delete(String(k))}
  };
}
function load(storage){
  const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage:storage};
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(textUtilsSrc,ctx,{filename:'text-utils-v1.js'});
  vm.runInContext(roomSrc,ctx,{filename:'dungeon-room-creator-100.js'});
  return ctx.DungeonRoomCreator100;
}

const key='gensrpg_dungeon_custom_rooms_v1';
const storage=makeStorage();
const api=load(storage);
assert.ok(api,'Room Creator API missing');
assert.equal(api.STORAGE_KEY,key,'historical Room Creator key must not change');

assert.equal(api.loadLibrary().length,0,'missing storage must yield []');
storage.values.set(key,'{broken');
assert.equal(api.loadLibrary().length,0,'invalid JSON must yield []');
storage.values.set(key,'null');
assert.equal(api.loadLibrary().length,0,'stored null must yield []');
storage.values.set(key,'{"not":"an array"}');
assert.equal(api.loadLibrary().length,0,'non-array JSON must yield []');

const room=api.createRoom({name:'Parité stockage',width:5,height:4});
const saved=api.saveLibrary([room]);
assert.equal(saved.length,1);
assert.equal(saved[0].name,'Parité stockage');
const raw=storage.values.get(key);
assert.ok(raw,'Room Creator must persist under the historical key');
assert.equal(raw,JSON.stringify(saved),'persisted JSON must equal the normalized library returned by saveLibrary');
assert.equal(JSON.stringify(api.loadLibrary()),JSON.stringify(saved),'read/write round-trip must preserve the normalized library');

const denied=makeStorage();
denied.setItem=()=>{throw new Error('write denied')};
const deniedApi=load(denied);
assert.throws(()=>deniedApi.saveLibrary([]),/write denied/,'Room Creator write errors must remain visible');

console.log(JSON.stringify({
  scenario:'Phase 4 Room Creator 1.0 storage parity before raccord',
  key,
  fallbacks:['missing','invalid-json','null','non-array'],
  normalizedRoundTrip:true,
  writeErrorsPropagate:true
},null,2));
