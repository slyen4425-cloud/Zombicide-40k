const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','storage.js'));
const Repair=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-runtime-repair-1678106.js'));

function memoryStorage(seed={}){
  const map=new Map(Object.entries(seed).map(([k,v])=>[String(k),String(v)]));
  const writes=[];
  return {
    writes,
    getItem(key){return map.has(String(key))?map.get(String(key)):null},
    setItem(key,value){map.set(String(key),String(value));writes.push([String(key),String(value)])},
    removeItem(key){map.delete(String(key));writes.push([String(key),null])},
    keys(){return [...map.keys()].sort()},
  };
}

assert.equal(Repair.VERSION,'1.1.0');
const profiles=[
  {id:'game_profile_dungeon_demo',name:'Dungeon',gameStyle:'dungeon',builtIn:true},
  {id:'duplicate_dungeon',name:'Dungeon',gameStyle:'dungeon',builtIn:true},
  {id:'custom_world',name:'Mon monde',gameStyle:'dungeon',builtIn:false},
];
const storage=memoryStorage({
  [Repair.FAMILY_KEY]:'adventure',
  [Repair.PROFILES_KEY]:JSON.stringify(profiles),
  [Repair.ACTIVE_KEY]:'duplicate_dungeon',
});
const beforeKeys=storage.keys();
let rerenders=0;
const rt={
  GensRpgCoreStorage:Core,
  localStorage:storage,
  console:{warn(){}},
  renderGensFamilyGamesIfVisible(){rerenders++},
};

assert.equal(Repair.isDungeonContext(rt),true,'session family must still be read from the existing key');
const fixed=Repair.repairStoredProfiles(rt);
assert.equal(fixed.changed,true);
assert.deepEqual(fixed.removed,['duplicate_dungeon']);
assert.equal(fixed.keep,'game_profile_dungeon_demo');
assert.equal(rerenders,1);
assert.equal(storage.getItem(Repair.ACTIVE_KEY),'game_profile_dungeon_demo','active duplicate must redirect to canonical Dungeon profile');
assert.deepEqual(JSON.parse(storage.getItem(Repair.PROFILES_KEY)),[
  profiles[0],profiles[2]
]);
assert.deepEqual(storage.keys(),beforeKeys,'first Core storage wiring must preserve the exact existing key set');
assert.equal(storage.keys().some(k=>/schema|version/i.test(k)),false,'profile repair must not invent migration/version keys yet');

const writesAfterRepair=storage.writes.length;
const again=Repair.repairStoredProfiles(rt);
assert.equal(again.changed,false,'profile repair must be idempotent once duplicates are gone');
assert.equal(storage.writes.length,writesAfterRepair,'idempotent repair must not rewrite profiles');

{
  const badStorage=memoryStorage({[Repair.PROFILES_KEY]:'{broken-json'});
  const badRt={GensRpgCoreStorage:Core,localStorage:badStorage,console:{warn(){}}};
  const out=Repair.repairStoredProfiles(badRt);
  assert.equal(out.changed,false);
  assert.equal(badStorage.getItem(Repair.PROFILES_KEY),'{broken-json','corrupt source must never be overwritten by fallback data');
  assert.equal(badStorage.writes.length,0);
}

const source=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-runtime-repair-1678106.js'),'utf8');
assert.doesNotMatch(source,/localStorage\?\.getItem|localStorage\.getItem|localStorage\?\.setItem|localStorage\.setItem/,'runtime repair must not own direct localStorage reads/writes anymore');
assert.match(source,/GensRpgCoreStorage/,'runtime repair must explicitly depend on Core Storage');

console.log('GenSrpG Core Storage -> runtime profile repair contract OK');
