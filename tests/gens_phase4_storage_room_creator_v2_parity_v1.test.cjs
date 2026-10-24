const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const storageSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','storage-v1.js'),'utf8');
const v2Src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-v2-167819.js'),'utf8');
const KEY='gensrpg_dungeon_room_interactions_v2';

function boot(initial){
  const values=new Map();
  if(initial!==undefined)values.set(KEY,String(initial));
  const localStorage={
    getItem(k){return values.has(k)?values.get(k):null},
    setItem(k,v){values.set(k,String(v))},
    removeItem(k){values.delete(k)}
  };
  const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage};
  ctx.globalThis=ctx;ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
  vm.runInContext(v2Src,ctx,{filename:'dungeon-room-creator-v2-167819.js'});
  return {ctx,values,api:ctx.DungeonRoomCreatorV2};
}

for(const raw of [undefined,'','{bad','null','[]','42','"text"']){
  const {api}=boot(raw);
  const meta=api.roomMeta('room-a');
  assert.equal(meta.schema,2);
  assert.equal(meta.roomId,'room-a');
  assert.deepEqual(Array.from(meta.attachments),[]);
  assert.deepEqual(Array.from(meta.cacheLinks),[]);
}

{
  const seeded=JSON.stringify({
    'room-a':{
      roomId:'room-a',
      attachments:[{id:'legacy',kind:'puzzle',targetIndex:3,refId:'runes'}],
      cacheLinks:[]
    }
  });
  const {api}=boot(seeded);
  const meta=api.roomMeta('room-a');
  assert.equal(meta.attachments.length,1);
  assert.equal(meta.attachments[0].targetType,'cell','legacy attachment normalization must stay in V2');
  assert.equal(meta.attachments[0].refId,'runes');
}

{
  const {api,values}=boot();
  const saved=api.saveRoomMeta({
    roomId:'room-b',
    attachments:[{id:'a1',kind:'trap',targetType:'door',targetIndex:2,refId:'needle'}],
    cacheLinks:[{id:'l1',sourceIndex:4,targetRoomId:'room-secret'}]
  });
  assert.equal(saved.schema,2);
  const persisted=JSON.parse(values.get(KEY));
  assert.ok(persisted['room-b']);
  assert.equal(persisted['room-b'].attachments[0].refId,'needle');
  assert.equal(persisted['room-b'].cacheLinks[0].targetRoomId,'room-secret');
  const reread=api.roomMeta('room-b');
  assert.equal(reread.attachments[0].targetType,'door');
  assert.equal(reread.cacheLinks[0].linkType,'subroom');
}

{
  const localStorage={getItem(){return null},setItem(){throw new Error('quota-test')}};
  const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage};ctx.globalThis=ctx;ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(storageSrc,ctx);
  vm.runInContext(v2Src,ctx);
  assert.throws(()=>ctx.DungeonRoomCreatorV2.saveRoomMeta({roomId:'room-c'}),/quota-test/,'write errors must remain visible');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Room Creator V2 storage parity',
  key:KEY,
  fallbacks:['missing','empty','invalid-json','null','array','primitive'],
  formatMigration:false
},null,2));
