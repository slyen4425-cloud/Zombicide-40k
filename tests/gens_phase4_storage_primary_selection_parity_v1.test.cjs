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
const KEY='gensrpg_dungeon_primary_selection_v167833';

function legacyFilteredRead(raw,opts={}){const st=new FakeStorage(raw,opts);try{const x=JSON.parse(st.getItem(KEY)||'null');return x&&typeof x==='object'?x:null}catch(e){return null}}
function coreFilteredRead(raw,opts={}){const st=new FakeStorage(raw,opts);const x=api.readJson(st,KEY,null);return x&&typeof x==='object'?x:null}
function legacyRawRead(raw,opts={}){const st=new FakeStorage(raw,opts);try{return JSON.parse(st.getItem(KEY)||'null')}catch(e){return null}}
function coreRawRead(raw,opts={}){const st=new FakeStorage(raw,opts);return api.readJson(st,KEY,null)}
function neutral(v){return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}

const raws=[null,'','null','0','false','"text"','[]','{}','{"kind":"world","id":"w1"}','{"kind":"adventure","id":"a1"}','{oops'];
for(const raw of raws){
  assert.deepEqual(neutral(coreFilteredRead(raw)),neutral(legacyFilteredRead(raw)),'filtered read parity failed for '+String(raw));
  assert.deepEqual(neutral(coreRawRead(raw)),neutral(legacyRawRead(raw)),'raw fallback read parity failed for '+String(raw));
}
assert.deepEqual(neutral(coreFilteredRead(null,{failRead:true})),neutral(legacyFilteredRead(null,{failRead:true})));
assert.deepEqual(neutral(coreRawRead(null,{failRead:true})),neutral(legacyRawRead(null,{failRead:true})));

function legacyWrite(value,opts={}){const st=new FakeStorage(null,opts);try{st.setItem(KEY,JSON.stringify(value||null))}catch(e){}return {writes:st.writes,returned:value}}
function coreWrite(value,opts={}){const st=new FakeStorage(null,opts);try{api.writeJson(st,KEY,value||null)}catch(e){}return {writes:st.writes,returned:value}}
for(const value of [{kind:'world',id:'w1'},{kind:'adventure',id:'a1'},null,false,0,'',undefined,[1,2]]){
  assert.deepEqual(coreWrite(value).writes,legacyWrite(value).writes,'write bytes parity failed');
  assert.equal(coreWrite(value).returned,value,'writer return contract must stay unchanged');
}
const circular={};circular.self=circular;
assert.deepEqual(coreWrite(circular).writes,legacyWrite(circular).writes,'circular serialization must remain swallowed');
assert.deepEqual(coreWrite({a:1},{failWrite:true}).writes,legacyWrite({a:1},{failWrite:true}).writes,'storage write failure must remain swallowed');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon primary selection storage parity',
  key:KEY,
  contracts:['filtered-object-read','raw-json-fallback-read','writer-x-or-null']
},null,2));
