const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx);
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function');

const KEY='gensrpg_challenge_library_v1';
class FakeStorage{
  constructor(raw=null,opts={}){this.raw=raw;this.failRead=!!opts.failRead;this.failWrite=!!opts.failWrite;this.writes=[]}
  getItem(){if(this.failRead)throw new Error('read-fail');return this.raw}
  setItem(k,v){if(this.failWrite)throw new Error('write-fail');this.writes.push([String(k),String(v)])}
}
const plain=v=>JSON.parse(JSON.stringify(v));

function legacyOwnerRead(raw,opts={}){
  const s=new FakeStorage(raw,opts);let lib=[];
  try{lib=JSON.parse(s.getItem(KEY)||'[]')}catch(e){lib=[]}
  if(!Array.isArray(lib))lib=[];
  return lib;
}
function coreOwnerRead(raw,opts={}){
  const s=new FakeStorage(raw,opts);let lib=[];
  try{lib=api.readJson(s,KEY,[])}catch(e){lib=[]}
  if(!Array.isArray(lib))lib=[];
  return lib;
}

for(const raw of [null,'','null','{}','0','false','"x"','[]','[{"id":"a"}]','[1,null,"x"]','{oops']){
  assert.deepEqual(plain(coreOwnerRead(raw)),plain(legacyOwnerRead(raw)),'owner read parity failed for '+String(raw));
}
assert.deepEqual(plain(coreOwnerRead(null,{failRead:true})),plain(legacyOwnerRead(null,{failRead:true})),'owner read-error parity failed');

function legacyFallbackRead(raw,opts={}){
  const s=new FakeStorage(raw,opts);
  try{return JSON.parse(s.getItem(KEY)||'[]')||[]}catch(e){return[]}
}
function coreFallbackRead(raw,opts={}){
  const s=new FakeStorage(raw,opts);
  try{return api.readJson(s,KEY,[])||[]}catch(e){return[]}
}
for(const raw of [null,'','null','{}','0','false','"x"','[]','[{"id":"a"}]','{oops']){
  assert.deepEqual(plain(coreFallbackRead(raw)),plain(legacyFallbackRead(raw)),'fallback read parity failed for '+String(raw));
}
assert.deepEqual(plain(coreFallbackRead(null,{failRead:true})),plain(legacyFallbackRead(null,{failRead:true})),'fallback read-error parity failed');

function legacyWrite(value,normalize=false,failWrite=false){
  const s=new FakeStorage(null,{failWrite});
  try{s.setItem(KEY,JSON.stringify(normalize?(Array.isArray(value)?value:[]):value))}catch(e){}
  return s.writes;
}
function coreWrite(value,normalize=false,failWrite=false){
  const s=new FakeStorage(null,{failWrite});
  try{api.writeJson(s,KEY,normalize?(Array.isArray(value)?value:[]):value)}catch(e){}
  return s.writes;
}
for(const value of [[],[{id:'a'}],{id:'not-array'},null,false,0,'x']){
  assert.deepEqual(coreWrite(value,false),legacyWrite(value,false),'merged-library write parity failed');
  assert.deepEqual(coreWrite(value,true),legacyWrite(value,true),'save-library write parity failed');
}
assert.deepEqual(coreWrite([{id:'a'}],false,true),legacyWrite([{id:'a'}],false,true),'write failure must remain swallowed by owner catch');

console.log(JSON.stringify({
  scenario:'Phase 4 Challenge Library storage parity',
  key:KEY,
  ownerRead:'array-normalized',
  fallbackReads:2,
  writes:2,
  writeErrors:'swallowed by historical Dungeon try/catch'
},null,2));
