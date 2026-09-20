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
const KEY='gensrpg_rpg_gameplay_by_profile_v1';
const ID='capture-profile';
const GAMEPLAY={capture:true,movement:false,nested:{mode:'demo'}};
const clone=v=>JSON.parse(JSON.stringify(v));
const neutral=v=>JSON.parse(JSON.stringify(v));

function legacy(raw,opts={}){
  const st=new FakeStorage(raw,opts), warnings=[];
  let map={};
  try{
    try{map=JSON.parse(st.getItem(KEY)||'{}')||{}}catch(e){}
    if(!map[ID]){
      map[ID]=clone(GAMEPLAY);
      st.setItem(KEY,JSON.stringify(map));
    }
  }catch(e){warnings.push(e.message)}
  return {map,writes:st.writes,warnings};
}

function core(raw,opts={}){
  const st=new FakeStorage(raw,opts), warnings=[];
  let map={};
  try{
    try{map=api.readJson(st,KEY,{})||{}}catch(e){}
    if(!map[ID]){
      map[ID]=clone(GAMEPLAY);
      api.writeJson(st,KEY,map);
    }
  }catch(e){warnings.push(e.message)}
  return {map,writes:st.writes,warnings};
}

for(const raw of [
  null,'','null','false','0','""','{}','[]','[1,2]','"truthy"','{oops',
  '{"capture-profile":{"capture":false}}',
  '{"other":{"kept":true}}'
]){
  assert.deepEqual(neutral(core(raw)),neutral(legacy(raw)),'seed parity failed for '+String(raw));
}
assert.deepEqual(neutral(core(null,{failRead:true})),neutral(legacy(null,{failRead:true})),'read failure parity must hold');
assert.deepEqual(neutral(core('{"other":1}',{failWrite:true})),neutral(legacy('{"other":1}',{failWrite:true})),'write failure must remain caught by outer boundary');

const preserved=core('{"capture-profile":{"capture":false,"user":true}}');
assert.equal(preserved.writes.length,0,'existing profile must never be overwritten');
assert.deepEqual(neutral(preserved.map[ID]),{capture:false,user:true},'existing user value must remain exact');

const seeded=core('{"other":{"kept":true}}');
assert.equal(seeded.writes.length,1,'missing profile must seed exactly once');
assert.deepEqual(neutral(JSON.parse(seeded.writes[0][1])),{
  other:{kept:true},
  [ID]:GAMEPLAY
},'seed must preserve other profiles and add a JSON clone');

console.log(JSON.stringify({
  scenario:'Phase 4 Capture gameplay-by-profile storage parity',
  key:KEY,
  owner:'builtinMonsterCapture162',
  reads:1,
  writes:'conditional 1',
  seedOnlyIfMissing:true,
  existingUserValue:'preserved',
  writeErrors:'caught by outer historical boundary'
},null,2));
