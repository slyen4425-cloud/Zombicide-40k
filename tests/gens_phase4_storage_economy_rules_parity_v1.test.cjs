const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx);
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function','Core storage API must load');

class FakeStorage{
  constructor(raw=null,opts={}){this.raw=raw;this.failRead=!!opts.failRead;this.failWrite=!!opts.failWrite;this.writes=[]}
  getItem(){if(this.failRead)throw new Error('read-fail');return this.raw}
  setItem(key,value){if(this.failWrite)throw new Error('write-fail');this.writes.push([String(key),String(value)])}
}
const KEY='gensrpg_dungeon_economy_rules_160';
const defaults=()=>({chestMode:'discovered',randomSearchChance:35,merchantMode:'event',sellLootEnabled:true});
const neutral=v=>JSON.parse(JSON.stringify(v));

function legacyRead(raw,opts={}){
  const st=new FakeStorage(raw,opts),d=defaults();
  try{Object.assign(d,JSON.parse(st.getItem(KEY)||'{}'))}catch(e){}
  return d;
}
function coreRead(raw,opts={}){
  const st=new FakeStorage(raw,opts),d=defaults();
  try{Object.assign(d,api.readJson(st,KEY,{}))}catch(e){}
  return d;
}

for(const raw of [
  null,'','null','0','false','"xy"','[]','[1,2]','{}','{oops',
  '{"chestMode":"free","randomSearchChance":80,"merchantMode":"always","sellLootEnabled":false}',
  '{"extraRule":"kept"}'
]){
  assert.deepEqual(neutral(coreRead(raw)),neutral(legacyRead(raw)),'read parity failed for '+String(raw));
}
assert.deepEqual(neutral(coreRead(null,{failRead:true})),neutral(legacyRead(null,{failRead:true})),'read failure must keep defaults');

function legacyWrite(value,raw=null,opts={}){
  const st=new FakeStorage(raw,opts);
  let error=null;
  try{
    const chosen=value||legacyRead(raw,opts.failRead?{failRead:true}:{});
    st.setItem(KEY,JSON.stringify(chosen));
  }catch(e){error=e}
  return {writes:st.writes,error:error?error.message:null};
}
function coreWrite(value,raw=null,opts={}){
  const st=new FakeStorage(raw,opts);
  let error=null;
  try{
    const chosen=value||coreRead(raw,opts.failRead?{failRead:true}:{});
    api.writeJson(st,KEY,chosen);
  }catch(e){error=e}
  return {writes:st.writes,error:error?error.message:null};
}

for(const value of [
  {chestMode:'disabled',randomSearchChance:0,merchantMode:'disabled',sellLootEnabled:false},
  {extraRule:'x'},
  null,false,0,'',undefined
]){
  assert.deepEqual(coreWrite(value,'{"merchantMode":"always"}'),legacyWrite(value,'{"merchantMode":"always"}'),'write parity failed');
}
const circular={};circular.self=circular;
assert.deepEqual(coreWrite(circular),legacyWrite(circular),'serialization errors must remain propagated');
assert.deepEqual(coreWrite({chestMode:'free'},null,{failWrite:true}),legacyWrite({chestMode:'free'},null,{failWrite:true}),'storage write failures must remain propagated');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon Economy rules storage parity',
  key:KEY,
  reads:1,
  writes:1,
  readFallback:'Dungeon defaults merged with JSON',
  writeErrors:'propagated',
  schemaOwner:'Dungeon Economy'
},null,2));
