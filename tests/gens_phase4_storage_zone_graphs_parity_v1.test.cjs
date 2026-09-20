const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');
const worldSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-builder-167821.js'),'utf8');
const visualSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-config-167826.js'),'utf8');
const KEY='gensrpg_zone_graphs_v1';

function makeStorage(initial,throwWrite=false){
  const values=new Map();
  if(initial!==undefined)values.set(KEY,String(initial));
  return {
    values,
    api:{
      getItem(k){return values.has(k)?values.get(k):null},
      setItem(k,v){if(throwWrite)throw new Error('quota-zone-graphs');values.set(k,String(v))},
      removeItem(k){values.delete(k)}
    }
  };
}

function bootWorld(initial,throwWrite=false){
  const store=makeStorage(initial,throwWrite);
  const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage:store.api};
  ctx.window=ctx;ctx.globalThis=ctx;
  ctx.DungeonRoomCreator100={loadLibrary(){return []},findRoom(){return null}};
  ctx.DungeonRoomCreatorV2={roomMeta(){return {attachments:[],cacheLinks:[]}}};
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(worldSrc,ctx,{filename:'dungeon-world-builder-167821.js'});
  return {ctx,values:store.values,api:ctx.DungeonWorldBuilder167821};
}

function bootVisual(initial){
  const store=makeStorage(initial,false);
  const room={id:'room-a',name:'Salle A',width:3,height:3,cells:Array.from({length:9},()=>({terrain:'floor',object:null}))};
  const ctx={console,Math,Date,setTimeout(){return 1},clearTimeout(){},localStorage:store.api};
  ctx.window=ctx;ctx.globalThis=ctx;
  ctx.DungeonRoomCreator100={
    findRoom(id){return id==='room-a'?JSON.parse(JSON.stringify(room)):null},
    loadLibrary(){return [JSON.parse(JSON.stringify(room))]}
  };
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(visualSrc,ctx,{filename:'dungeon-room-visual-config-167826.js'});
  return {ctx,api:ctx.DungeonRoomVisualConfig167826};
}

for(const raw of [undefined,'','{bad','null','{}','42','"text"']){
  const {api}=bootWorld(raw);
  assert.deepEqual(Array.from(api.loadLibrary()),[],String(raw)+' must keep [] World Builder fallback');
}

{
  const seed=JSON.stringify([{schema:1,id:'world-a',kind:'dungeon',name:'Monde A',theme:'dungeon',notes:'',startNodeId:'',nodes:[],edges:[],cacheBindings:[],createdAt:'2026-01-01',updatedAt:'2026-01-01'}]);
  const {api}=bootWorld(seed);
  const list=api.loadLibrary();
  assert.equal(list.length,1);
  assert.equal(list[0].id,'world-a');
  assert.equal(list[0].name,'Monde A');
  assert.equal(list[0].kind,'dungeon');
}

{
  const {api,values}=bootWorld();
  const made=api.createDungeon({name:'Round trip storage'});
  assert.ok(made.id);
  const persisted=JSON.parse(values.get(KEY));
  assert.equal(persisted.length,1);
  assert.equal(persisted[0].name,'Round trip storage');
  assert.equal(persisted[0].kind,'dungeon');
  assert.equal(persisted[0].schema,1);
  const reread=api.findDungeon(made.id);
  assert.equal(reread.name,'Round trip storage');
}

{
  const {api}=bootWorld(undefined,true);
  assert.throws(()=>api.createDungeon({name:'write failure'}),/quota-zone-graphs/,'World Builder write errors must remain visible');
}

for(const raw of [undefined,'','{bad','null','{}','42','"text"']){
  const {api}=bootVisual(raw);
  assert.deepEqual(Array.from(api.contextsForRoom('room-a')),[],String(raw)+' must keep [] Visual Config fallback');
}

{
  const seed=JSON.stringify([{schema:1,id:'world-v',kind:'dungeon',name:'Monde visuel',theme:'dungeon',notes:'',startNodeId:'zone-a',nodes:[{id:'zone-a',roomId:'room-a',label:'Entrée'}],edges:[],cacheBindings:[],createdAt:'2026-01-01',updatedAt:'2026-01-01'}]);
  const {api}=bootVisual(seed);
  const contexts=api.contextsForRoom('room-a');
  assert.equal(contexts.length,1);
  assert.equal(contexts[0].dungeonId,'world-v');
  assert.equal(contexts[0].nodeId,'zone-a');
  assert.equal(contexts[0].dungeonName,'Monde visuel');
}

console.log(JSON.stringify({
  scenario:'Phase 4 zone graph storage parity',
  key:KEY,
  worldBuilder:{read:true,write:true,fallback:'[]',normalizer:'normalizeGraph'},
  visualConfig:{read:true,write:false,fallback:'[]'},
  formatMigration:false
},null,2));