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
const KEY='gensrpg_manual_mj_effects_v1';
const neutral=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v;

function legacyRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  try{const a=JSON.parse(st.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}
}
function coreRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  const a=api.readJson(st,KEY,[]);
  return Array.isArray(a)?a:[];
}

for(const raw of [
  null,'','null','0','false','"x"','{}','{oops','[]',
  '[{"id":"e1","target":"hero:h1","name":"Poison","turns":2}]'
]){
  assert.deepEqual(neutral(coreRead(raw)),neutral(legacyRead(raw)),'read parity failed for '+String(raw));
}
assert.deepEqual(neutral(coreRead(null,{failRead:true})),neutral(legacyRead(null,{failRead:true})),'read failure must keep [] fallback');

function legacyWrite(value,opts={}){
  const st=new FakeStorage(null,opts);
  let error=null;
  try{st.setItem(KEY,JSON.stringify(value||[]))}catch(e){error=e}
  return {writes:st.writes,error:error?error.message:null};
}
function coreWrite(value,opts={}){
  const st=new FakeStorage(null,opts);
  let error=null;
  try{api.writeJson(st,KEY,value||[])}catch(e){error=e}
  return {writes:st.writes,error:error?error.message:null};
}

for(const value of [undefined,null,false,0,'',[],[{id:'e1',turns:2}],{}]){
  assert.deepEqual(coreWrite(value),legacyWrite(value),'write parity failed');
}
const circular={};circular.self=circular;
assert.deepEqual(coreWrite(circular),legacyWrite(circular),'serialization errors must remain propagated');
assert.deepEqual(coreWrite([{id:'e1'}],{failWrite:true}),legacyWrite([{id:'e1'}],{failWrite:true}),'storage write failures must remain propagated');

console.log(JSON.stringify({
  scenario:'Phase 4 Manual MJ effects storage parity',
  key:KEY,
  reads:1,
  writes:1,
  readFallback:'[]',
  writeErrors:'propagated',
  schemaOwner:'Dungeon Manual MJ'
},null,2));
