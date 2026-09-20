const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx);
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function','Core storage API must load');

class FakeStorage{
  constructor(raw=null,failWrite=false){this.raw=raw;this.failWrite=failWrite;this.writes=[]}
  getItem(){return this.raw}
  setItem(key,value){if(this.failWrite)throw new Error('quota');this.writes.push([String(key),String(value)])}
}
const defaults=()=>({xpMultiplier:1,statCap:300,statPointsPerLevel:5,talentEvery:5,maxMoves:4,moveRelearn:'free'});
function normalize(d){
  d.xpMultiplier=Math.max(0,Number(d.xpMultiplier)||1);
  d.statCap=Math.max(1,Math.round(Number(d.statCap)||300));
  d.statPointsPerLevel=Math.max(0,Math.round(Number(d.statPointsPerLevel)||5));
  d.talentEvery=Math.max(1,Math.round(Number(d.talentEvery)||5));
  d.maxMoves=Math.max(1,Math.min(12,Math.round(Number(d.maxMoves)||4)));
  return d;
}
function legacyRead(raw){const d=defaults(),st=new FakeStorage(raw);try{Object.assign(d,JSON.parse(st.getItem('k')||'{}'))}catch(e){}return normalize(d)}
function coreRead(raw){const d=defaults(),st=new FakeStorage(raw);try{Object.assign(d,api.readJson(st,'k',{}))}catch(e){}return normalize(d)}
for(const raw of [null,'','{}','null','0','false','[]','{oops','{"xpMultiplier":2.5,"statCap":123,"maxMoves":9,"extra":7}','"abc"']){
  assert.deepEqual(coreRead(raw),legacyRead(raw),'read parity failed for '+String(raw));
}
function legacyWrite(value,fail=false){const st=new FakeStorage(null,fail);let err=null;try{st.setItem('k',JSON.stringify(value))}catch(e){err=e}return {writes:st.writes,err:err&&err.message}}
function coreWrite(value,fail=false){const st=new FakeStorage(null,fail);let err=null;try{api.writeJson(st,'k',value)}catch(e){err=e}return {writes:st.writes,err:err&&err.message}}
for(const value of [{a:1},null,[1,2],0,false,'x',undefined])assert.deepEqual(coreWrite(value),legacyWrite(value));
const circular={};circular.self=circular;assert.equal(!!coreWrite(circular).err,!!legacyWrite(circular).err);
assert.deepEqual(coreWrite({a:1},true),legacyWrite({a:1},true));

assert.match(index,/return "gensrpg_capture_progress_v2_"\+id;/,'Capture progress key family must remain unchanged');
assert.equal((index.match(/localStorage\.getItem\(captureCreatureProgressRulesKey\(\)\)/g)||[]).length,0,'target family must have no direct getItem');
assert.equal((index.match(/localStorage\.setItem\(captureCreatureProgressRulesKey\(\)/g)||[]).length,0,'target family must have no direct setItem');
assert.equal((index.match(/GensStorageV1\.readJson\(localStorage,captureCreatureProgressRulesKey\(\),\{\}\)/g)||[]).length,1,'exactly one Core JSON read expected');
assert.equal((index.match(/GensStorageV1\.writeJson\(localStorage,captureCreatureProgressRulesKey\(\),(?:r|pr)\)/g)||[]).length,6,'exactly six Core JSON writes expected');
console.log(JSON.stringify({scenario:'Phase 4 Capture progress storage parity',reads:1,writes:6,family:'gensrpg_capture_progress_v2_<profileId>'},null,2));
