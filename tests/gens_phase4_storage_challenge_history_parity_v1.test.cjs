const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx);
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function');

const KEY='gensrpg_dc067_challenge_history';

class FakeStorage{
  constructor(raw=null,opts={}){this.raw=raw;this.failRead=!!opts.failRead;this.failWrite=!!opts.failWrite;this.writes=[]}
  getItem(){if(this.failRead)throw new Error('read-fail');return this.raw}
  setItem(key,value){if(this.failWrite)throw new Error('write-fail');this.writes.push([String(key),String(value)])}
}

function legacyRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  let hist=[];
  try{hist=JSON.parse(st.getItem(KEY)||'[]');if(!Array.isArray(hist))hist=[]}catch(e){hist=[]}
  return hist;
}
function coreRead(raw,opts={}){
  const st=new FakeStorage(raw,opts);
  let hist=[];
  try{hist=api.readJson(st,KEY,[]);if(!Array.isArray(hist))hist=[]}catch(e){hist=[]}
  return hist;
}
const neutral=x=>JSON.parse(JSON.stringify(x));

for(const raw of [
  null,'','null','0','false','"x"','{}','[]','["a","b"]','[1,2,null]','{oops'
]){
  assert.deepEqual(neutral(coreRead(raw)),neutral(legacyRead(raw)),'read parity failed for '+String(raw));
}
assert.deepEqual(neutral(coreRead(null,{failRead:true})),neutral(legacyRead(null,{failRead:true})),'read failure must fall back to []');

function legacyWrite(hist,opts={}){
  const st=new FakeStorage(null,opts);
  let threw=false;
  try{st.setItem(KEY,JSON.stringify(hist.slice(-24)))}catch(e){threw=true}
  return {writes:st.writes,threw};
}
function coreWrite(hist,opts={}){
  const st=new FakeStorage(null,opts);
  let threw=false;
  try{api.writeJson(st,KEY,hist.slice(-24))}catch(e){threw=true}
  return {writes:st.writes,threw};
}
for(const hist of [
  [],
  ['a'],
  Array.from({length:12},(_,i)=>'c'+i),
  Array.from({length:30},(_,i)=>String(i))
]){
  assert.deepEqual(coreWrite(hist),legacyWrite(hist),'write parity failed');
}
assert.deepEqual(coreWrite(['x'],{failWrite:true}),legacyWrite(['x'],{failWrite:true}),'write failures must remain swallowed by the historical caller boundary');

function chooseContract(lib,hist,chosenId){
  const recent=new Set(hist.slice(-12).map(String));
  let fresh=lib.filter(x=>!recent.has(String(x.id)));
  if(!fresh.length)fresh=lib;
  const chosen=fresh.find(x=>String(x.id)===String(chosenId))||fresh[0];
  hist.push(String(chosen.id));
  return {recent:[...recent],fresh:fresh.map(x=>String(x.id)),persisted:hist.slice(-24)};
}
const lib=Array.from({length:15},(_,i)=>({id:String(i+1)}));
const hist=Array.from({length:12},(_,i)=>String(i+1));
const contract=chooseContract(lib,[...hist],'13');
assert.equal(contract.fresh.includes('13'),true);
assert.equal(contract.fresh.includes('1'),false);
assert.equal(contract.persisted.length,13);

const allRecent=Array.from({length:15},(_,i)=>String(i+1));
const fallback=chooseContract(lib,[...allRecent],'1');
assert.equal(fallback.fresh.length,15,'full pool must become available when every challenge is recent');

const longHist=Array.from({length:30},(_,i)=>String(i+1));
const capped=chooseContract(lib,[...longHist],'1');
assert.equal(capped.persisted.length,24,'persisted history must remain capped at 24');

console.log(JSON.stringify({
  scenario:'Phase 4 Challenge History 0.67 storage parity',
  key:KEY,
  readFallback:'[]',
  recentWindow:12,
  persistedHistory:24,
  writeErrors:'swallowed by historical caller try/catch'
},null,2));
