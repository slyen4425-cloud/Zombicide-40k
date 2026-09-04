const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const feedbackSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-feedback-167821.js'),'utf8');
const builderSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-builder-167821.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const htmlArg=process.argv[2];

const rooms=[
  {id:'room_a',name:'Entrée antique',roomType:'room',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:'cache'},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}
  ]},
  {id:'room_b',name:'Salle des gardes',roomType:'room',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}
  ]},
  {id:'room_secret',name:'Crypte secrète',roomType:'special',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:'exit'},{terrain:'floor',object:null}
  ]}
];
const values=new Map();
const localStorage={
  getItem(k){return values.has(k)?values.get(k):null},
  setItem(k,v){values.set(k,String(v))},
  removeItem(k){values.delete(k)}
};
const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage};
ctx.globalThis=ctx;
ctx.DungeonRoomCreator100={
  loadLibrary(){return JSON.parse(JSON.stringify(rooms))},
  findRoom(id){const r=rooms.find(x=>x.id===String(id));return r?JSON.parse(JSON.stringify(r)):null}
};
ctx.DungeonRoomCreatorV2={
  roomMeta(id){
    if(id==='room_a')return {roomId:id,attachments:[{id:'p1',kind:'puzzle',targetType:'chest',targetIndex:4}],cacheLinks:[{sourceIndex:2,targetRoomId:'room_secret'}]};
    return {roomId:id,attachments:[],cacheLinks:[]};
  }
};
vm.createContext(ctx);
vm.runInContext(feedbackSrc,ctx,{filename:'dungeon-room-creator-feedback-167821.js'});
vm.runInContext(builderSrc,ctx,{filename:'dungeon-world-builder-167821.js'});

const ui=ctx.DungeonRoomCreatorFeedback167821;
const b=ctx.DungeonWorldBuilder167821;
assert.ok(ui&&b,'feedback + phase-3 builder APIs must load');
assert.equal(ui.VERSION,'16.78.21');
assert.equal(b.VERSION,'3.0.0');
assert.equal(b.APP_VERSION,'16.78.21');
assert.equal(b.STORAGE_KEY,'gensrpg_zone_graphs_v1');

const d=b.createDungeon({name:'Donjon test'});
assert.equal(d.name,'Donjon test');
assert.equal(d.nodes.length,0);

const a=b.addRoomInstance(d.id,'room_a').node;
const guard=b.addRoomInstance(d.id,'room_b').node;
const secret=b.addRoomInstance(d.id,'room_secret').node;
assert.equal(b.findDungeon(d.id).startNodeId,a.id,'first room becomes start automatically');
assert.equal(b.findDungeon(d.id).nodes.length,3);

const edge=b.connectRooms(d.id,{fromNodeId:a.id,fromExitIndex:7,toNodeId:guard.id,toEntryIndex:0}).edge;
assert.ok(edge.id);
assert.throws(()=>b.connectRooms(d.id,{fromNodeId:a.id,fromExitIndex:7,toNodeId:secret.id,toEntryIndex:0}),/déjà connectée/,'same exit cannot connect twice');

let expected=b.expectedCacheBindings(b.findDungeon(d.id));
assert.equal(expected.length,1);
assert.equal(expected[0].targetRoomId,'room_secret');
b.bindCache(d.id,a.id,2,secret.id);
let current=b.findDungeon(d.id);
assert.equal(current.cacheBindings.length,1);
assert.equal(current.cacheBindings[0].targetNodeId,secret.id);

const valid=b.validation(current);
assert.equal(valid.valid,true);
assert.equal(valid.nodeCount,3);
assert.equal(valid.edgeCount,1);
assert.equal(valid.cacheCount,1);
assert.ok(valid.warnings.some(x=>/non reliée/.test(x)),'secret sub-room may be outside door network without invalidating graph');

const pack=b.runtimePackage(d.id);
assert.equal(pack.kind,'gensrpg-zone-graph');
assert.equal(pack.zones.length,3);
assert.equal(pack.zones.find(z=>z.instance.id===a.id).interactions.attachments.length,1,'runtime-ready package carries V2 interactions');
assert.equal(pack.validation.valid,true);

const copy=b.duplicateDungeon(d.id);
assert.notEqual(copy.id,d.id);
assert.equal(copy.nodes.length,3);
assert.notEqual(copy.nodes[0].id,current.nodes[0].id,'duplicated dungeon remaps instance ids');
assert.ok(copy.startNodeId&&copy.nodes.some(n=>n.id===copy.startNodeId),'duplicated start room is remapped');

b.removeRoomInstance(d.id,guard.id);
current=b.findDungeon(d.id);
assert.equal(current.nodes.some(n=>n.id===guard.id),false);
assert.equal(current.edges.length,0,'removing a room cleans its door connections');

assert.match(feedbackSrc,/Sauvegarde automatique active/);
assert.match(feedbackSrc,/Interaction ajoutée/);
assert.match(feedbackSrc,/Liaison de cache mise à jour/);
assert.match(builderSrc,/Constructeur de donjon — Phase 3/);
assert.match(builderSrc,/gensrpg_zone_graphs_v1/);
assert.match(builderSrc,/kind:"gensrpg-zone-graph"/);
assert.doesNotMatch(builderSrc,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom|trackSpawnedEnemyInstances)\s*\(/,'builder must not rewrite movement/combat/timeline/spawn');

assert.match(workflow,/dungeon-room-creator-feedback-167821\.js/);
assert.match(workflow,/dungeon-world-builder-167821\.js/);
assert.match(workflow,/dungeon_world_builder_v167821\.test\.cjs/);
assert.match(sw,/dungeon-room-creator-feedback-167821\.js/);
assert.match(sw,/dungeon-world-builder-167821\.js/);
assert.match(sw,/gensrpg-cache-16\.78\.21-/);

if(htmlArg){
  const html=fs.readFileSync(htmlArg,'utf8');
  const v2=html.indexOf('assets/dungeon/dungeon-room-creator-v2-167819.js?v=167819');
  const feedback=html.indexOf('assets/dungeon/dungeon-room-creator-feedback-167821.js?v=167821');
  const builder=html.indexOf('assets/dungeon/dungeon-world-builder-167821.js?v=167821');
  assert.ok(v2>=0&&feedback>v2&&builder>feedback,'final HTML must load V2, autosave feedback, then phase-3 builder');
}

console.log('Dungeon World Builder Phase 3 / V16.78.21 regressions: OK');
