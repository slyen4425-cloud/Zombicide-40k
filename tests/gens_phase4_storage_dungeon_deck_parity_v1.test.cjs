const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx);
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function');

class FakeStorage{
  constructor(raw=null,opts={}){this.raw=raw;this.failRead=!!opts.failRead;this.failWrite=!!opts.failWrite;this.writes=[]}
  getItem(){if(this.failRead)throw new Error('read-fail');return this.raw}
  setItem(key,value){if(this.failWrite)throw new Error('write-fail');this.writes.push([String(key),String(value)])}
}
const KEY='gensrpg_dungeon_deck_v1';
const NOW=123456789;

function normalizeDeck(ds){
  if(!ds||!ds.remaining)ds={remaining:{},createdAt:NOW};
  return JSON.parse(JSON.stringify(ds));
}
function legacyRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  let ds=null;
  try{ds=JSON.parse(st.getItem(KEY)||'null')}catch(e){}
  return normalizeDeck(ds);
}
function coreRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  const ds=api.readJson(st,KEY,null);
  return normalizeDeck(ds);
}
for(const raw of [
  null,'','null','0','false','"x"','[]','{}','{oops',
  '{"remaining":{}}',
  '{"remaining":{"sword":2},"createdAt":10,"dungeonSession":true}'
]){
  assert.deepEqual(coreRead(raw),legacyRead(raw),'read parity failed for '+String(raw));
}
assert.deepEqual(coreRead(null,{failRead:true}),legacyRead(null,{failRead:true}));

function legacyWrite(value,opts={}){
  const st=new FakeStorage(null,opts);
  try{st.setItem(KEY,JSON.stringify(value))}catch(e){}
  return st.writes;
}
function coreWrite(value,opts={}){
  const st=new FakeStorage(null,opts);
  try{api.writeJson(st,KEY,value)}catch(e){}
  return st.writes;
}
for(const value of [
  {remaining:{}},
  {remaining:{sword:0,bow:2},createdAt:NOW},
  null,undefined,false,0,'x',[1,2]
]){
  assert.deepEqual(coreWrite(value),legacyWrite(value),'write parity failed');
}
const circular={};circular.self=circular;
assert.deepEqual(coreWrite(circular),legacyWrite(circular),'circular serialization failure must remain swallowed');
assert.deepEqual(coreWrite({remaining:{}},{failWrite:true}),legacyWrite({remaining:{}},{failWrite:true}),'storage write failure must remain swallowed');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon deck storage parity',
  key:KEY,
  reads:1,
  writes:2,
  schemaOwner:'Dungeon'
},null,2));
