const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=src.match(/<script[^>]*id=["']dungeonMj72_2Script["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(m,'missing dungeonMj72_2Script');
const block=m[1];

const sourceRead='JSON.parse(localStorage.getItem(GENS_DUNGEON_SCENE_KEY)||"[]")';
const targetRead='GensStorageV1.readJson(localStorage,GENS_DUNGEON_SCENE_KEY,[])';
const sourceWrite='localStorage.setItem(GENS_DUNGEON_SCENE_KEY,JSON.stringify(a||[]))';
const targetWrite='GensStorageV1.writeJson(localStorage,GENS_DUNGEON_SCENE_KEY,a||[])';

assert.equal((block.split(sourceRead).length-1)+(block.split(targetRead).length-1),1,'Dungeon Scene read transport must have exactly one owner expression');
assert.equal((block.split(sourceWrite).length-1)+(block.split(targetWrite).length-1),1,'Dungeon Scene write transport must have exactly one owner expression');
assert.match(block,/return Array\.isArray\(a\)\?a:\[\]/,'array normalization must remain in owner');
assert.match(block,/try\{renderDungeonMasterScene\(\)\}catch\(e\)\{\}/,'render error boundary must remain in owner');

const KEY='gensrpg_dungeon_scene_v1';

function makeStorage(initial,{throwGet=false,throwSet=false}={}){
  let raw=initial;
  return {
    getItem(key){ assert.equal(key,KEY); if(throwGet)throw new Error('get'); return raw; },
    setItem(key,value){ assert.equal(key,KEY); if(throwSet)throw new Error('set'); raw=String(value); },
    raw(){return raw;}
  };
}

const core={
  readJson(storage,key,fallback){
    const raw=storage.getItem(key);
    if(raw==null||raw==='')return fallback;
    return JSON.parse(raw);
  },
  writeJson(storage,key,value){
    const encoded=JSON.stringify(value);
    storage.setItem(key,encoded);
  }
};

function sourceLoad(storage){
  try{
    const a=JSON.parse(storage.getItem(KEY)||'[]');
    return Array.isArray(a)?a:[];
  }catch(e){return []}
}
function targetLoad(storage){
  try{
    const a=core.readJson(storage,KEY,[]);
    return Array.isArray(a)?a:[];
  }catch(e){return []}
}
function sourceSave(storage,a,render){
  storage.setItem(KEY,JSON.stringify(a||[]));
  try{render()}catch(e){}
}
function targetSave(storage,a,render){
  core.writeJson(storage,KEY,a||[]);
  try{render()}catch(e){}
}

for(const raw of [null,'','[]','[{"id":1}]','{}','null','7','"x"','{bad']){
  for(const throwGet of [false,true]){
    const s=sourceLoad(makeStorage(raw,{throwGet}));
    const t=targetLoad(makeStorage(raw,{throwGet}));
    assert.deepEqual(s,t,'read parity raw='+String(raw)+' throwGet='+throwGet);
  }
}

for(const value of [undefined,null,[],[{id:1}],{},0,false,'x']){
  const ss=makeStorage('[]');
  const ts=makeStorage('[]');
  let sr=0,tr=0,se=null,te=null;
  try{sourceSave(ss,value,()=>{sr++})}catch(e){se=e.constructor.name}
  try{targetSave(ts,value,()=>{tr++})}catch(e){te=e.constructor.name}
  assert.equal(se,te,'write error parity');
  assert.equal(ss.raw(),ts.raw(),'write bytes parity');
  assert.equal(sr,tr,'render parity');
}

for(const value of [[],[{id:1}]]){
  const ss=makeStorage('[]',{throwSet:true});
  const ts=makeStorage('[]',{throwSet:true});
  let sr=0,tr=0,se=false,te=false;
  try{sourceSave(ss,value,()=>{sr++})}catch(e){se=true}
  try{targetSave(ts,value,()=>{tr++})}catch(e){te=true}
  assert.equal(se,true);
  assert.equal(te,true);
  assert.equal(sr,0);
  assert.equal(tr,0);
}

const circular={}; circular.self=circular;
for(const save of [sourceSave,targetSave]){
  const st=makeStorage('[]');
  let rendered=0,threw=false;
  try{save(st,circular,()=>{rendered++})}catch(e){threw=true}
  assert.equal(threw,true,'serialization error must propagate');
  assert.equal(rendered,0,'render must not run after failed serialization');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon Scene storage parity',
  key:KEY,
  result:'source and Core JSON transport semantics equivalent'
},null,2));
