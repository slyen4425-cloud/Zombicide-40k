const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');
const worldSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-builder-167821.js'),'utf8');
const KEY='gensrpg_zone_graphs_v1';

function boot(initial,{throwOnWrite=false}={}){
  const values=new Map();
  if(initial!==undefined)values.set(KEY,String(initial));
  const localStorage={
    getItem(k){return values.has(k)?values.get(k):null},
    setItem(k,v){if(throwOnWrite)throw new Error('quota-zone-graphs');values.set(k,String(v))},
    removeItem(k){values.delete(k)}
  };
  const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage};
  ctx.globalThis=ctx;ctx.window=ctx;
  ctx.DungeonRoomCreator100={loadLibrary(){return []},findRoom(){return null}};
  ctx.DungeonRoomCreatorV2={roomMeta(id){return {roomId:id,attachments:[],cacheLinks:[]}}};
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(worldSrc,ctx,{filename:'dungeon-world-builder-167821.js'});
  return {api:ctx.DungeonWorldBuilder167821,values};
}

for(const raw of [undefined,'','{bad','null','{}','42','"text"']){
  const {api}=boot(raw);
  assert.deepEqual(Array.from(api.loadLibrary()),[],String(raw)+' must keep [] fallback');
}

{
  const seed=JSON.stringify([{id:'world-old',name:'Ancien monde',nodes:[],edges:[],cacheBindings:[]}]);
  const {api}=boot(seed);
  const list=api.loadLibrary();
  assert.equal(list.length,1);
  assert.equal(list[0].id,'world-old');
  assert.equal(list[0].schema,api.SCHEMA_VERSION,'normalization stays World Builder-owned');
}

{
  const {api,values}=boot();
  const created=api.createDungeon({name:'Round trip'});
  const persisted=JSON.parse(values.get(KEY));
  assert.equal(persisted.length,1);
  assert.equal(persisted[0].id,created.id);
  assert.equal(api.findDungeon(created.id).name,'Round trip');
}

{
  const {api}=boot(undefined,{throwOnWrite:true});
  assert.throws(()=>api.createDungeon({name:'Write failure'}),/quota-zone-graphs/,'write errors must remain visible');
}

console.log(JSON.stringify({
  scenario:'Phase 4 zone graph storage parity',
  key:KEY,
  fallbacks:['missing','empty','invalid-json','null','non-array'],
  formatMigration:false
},null,2));
