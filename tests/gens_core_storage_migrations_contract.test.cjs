const assert=require('node:assert/strict');
const path=require('node:path');
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','storage.js'));

assert.equal(Core.VERSION,'1.0.0');

function memoryStorage(seed={}){
  const map=new Map(Object.entries(seed).map(([k,v])=>[String(k),String(v)]));
  const writes=[];
  return {
    writes,
    getItem(key){return map.has(String(key))?map.get(String(key)):null},
    setItem(key,value){map.set(String(key),String(value));writes.push([String(key),String(value)])},
    removeItem(key){map.delete(String(key));writes.push([String(key),null])},
    snapshot(){return Object.fromEntries(map)},
  };
}

{
  const storage=memoryStorage();
  const missing=Core.readJson(storage,'missing',{fallback:{safe:true}});
  assert.equal(missing.ok,true);
  assert.equal(missing.exists,false);
  assert.deepEqual(missing.value,{safe:true});
  assert.equal(storage.writes.length,0,'reading a missing key must never create data');

  const write=Core.writeJson(storage,'profile',{id:'hero',xp:12});
  assert.equal(write.ok,true);
  assert.deepEqual(Core.readJson(storage,'profile').value,{id:'hero',xp:12});
}

{
  const storage=memoryStorage({broken:'{not-json'});
  const out=Core.readJson(storage,'broken',{fallback:{recovered:true}});
  assert.equal(out.ok,false,'corrupted JSON must be reported, not silently overwritten');
  assert.equal(out.exists,true);
  assert.deepEqual(out.value,{recovered:true});
  assert.equal(storage.getItem('broken'),'{not-json','read fallback must not destroy corrupted source data');
  assert.equal(storage.writes.length,0);
}

const migrations=[
  {version:1,migrate:value=>({...value,stats:value.stats||{}})},
  {version:2,migrate:value=>({...value,stats:{...value.stats,force:Number(value.stats?.force)||10}})},
  {version:3,migrate:value=>({...value,mode:value.mode||'dungeon'})},
];

{
  const plan=Core.migrationPlan({fromVersion:0,toVersion:3,migrations});
  assert.equal(plan.ok,true);
  assert.deepEqual(plan.steps.map(x=>x.version),[1,2,3]);
  const missing=Core.migrationPlan({fromVersion:0,toVersion:4,migrations});
  assert.equal(missing.ok,false);
  assert.equal(missing.error,'missing-migration-4');
}

{
  const original={id:'hero'};
  const out=Core.migrateValue(original,{fromVersion:0,toVersion:3,migrations});
  assert.equal(out.ok,true);
  assert.equal(out.changed,true);
  assert.deepEqual(out.applied,[1,2,3]);
  assert.deepEqual(out.value,{id:'hero',stats:{force:10},mode:'dungeon'});
  assert.deepEqual(original,{id:'hero'},'pure migrations must not mutate their input object');

  const again=Core.migrateValue(out.value,{fromVersion:3,toVersion:3,migrations});
  assert.equal(again.ok,true);
  assert.equal(again.changed,false,'same target version must be idempotent');
  assert.deepEqual(again.applied,[]);
  assert.deepEqual(again.value,out.value);
}

{
  const bad=[
    {version:1,migrate:value=>({...value,a:1})},
    {version:2,migrate:()=>{throw new Error('boom')}},
  ];
  const source={id:'hero'};
  const out=Core.migrateValue(source,{fromVersion:0,toVersion:2,migrations:bad});
  assert.equal(out.ok,false);
  assert.equal(out.changed,false);
  assert.deepEqual(out.applied,[],'failed migration chain must not report partial application');
  assert.deepEqual(out.value,source,'failed migration chain must return the original data');
}

{
  const storage=memoryStorage({
    hero:JSON.stringify({id:'hero'}),
    hero_schema:'0',
  });
  const out=Core.migrateStoredJson({
    storage,
    key:'hero',
    versionKey:'hero_schema',
    targetVersion:3,
    migrations,
    validate:value=>value?.id==='hero'&&value?.mode==='dungeon',
  });
  assert.equal(out.ok,true);
  assert.equal(out.changed,true);
  assert.equal(out.written,true);
  assert.equal(storage.getItem('hero_schema'),'3');
  assert.deepEqual(JSON.parse(storage.getItem('hero')),{id:'hero',stats:{force:10},mode:'dungeon'});
  const writesAfterFirst=storage.writes.length;

  const again=Core.migrateStoredJson({
    storage,
    key:'hero',
    versionKey:'hero_schema',
    targetVersion:3,
    migrations,
    validate:value=>value?.id==='hero'&&value?.mode==='dungeon',
  });
  assert.equal(again.ok,true);
  assert.equal(again.changed,false);
  assert.equal(again.written,false);
  assert.equal(storage.writes.length,writesAfterFirst,'idempotent rerun must not rewrite storage');
}

{
  const storage=memoryStorage({hero:JSON.stringify({id:'hero'}),hero_schema:'0'});
  const before=storage.snapshot();
  const out=Core.migrateStoredJson({
    storage,
    key:'hero',
    versionKey:'hero_schema',
    targetVersion:3,
    migrations,
    validate:()=>false,
  });
  assert.equal(out.ok,false,'validation failure must block persistence');
  assert.equal(out.written,undefined);
  assert.deepEqual(storage.snapshot(),before,'failed validation must leave both data and version untouched');
  assert.equal(storage.writes.length,0);
}

{
  const storage=memoryStorage({hero:JSON.stringify({id:'hero'}),hero_schema:'0'});
  const before=storage.snapshot();
  const out=Core.migrateStoredJson({
    storage,
    key:'hero',
    versionKey:'hero_schema',
    targetVersion:4,
    migrations,
  });
  assert.equal(out.ok,false,'missing migration step must block persistence');
  assert.equal(out.error,'missing-migration-4');
  assert.deepEqual(storage.snapshot(),before);
  assert.equal(storage.writes.length,0);
}

assert.equal(globalThis.localStorage,undefined,'Core contract test must not require a browser localStorage global');
console.log('GenSrpG Core storage/migrations contract OK');
