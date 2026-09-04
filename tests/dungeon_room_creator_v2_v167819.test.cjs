const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const baseSrc=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-100.js'),'utf8');
const v2Src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-v2-167819.js'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const htmlArg=process.argv[2];

const values=new Map();
const ctx={console,Math,Date,setTimeout,clearTimeout,localStorage:{getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}}};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(baseSrc,ctx,{filename:'dungeon-room-creator-100.js'});
vm.runInContext(v2Src,ctx,{filename:'dungeon-room-creator-v2-167819.js'});

const base=ctx.DungeonRoomCreator100;
const v2=ctx.DungeonRoomCreatorV2;
assert.ok(base&&v2,'Room Creator V1 + V2 APIs must load');
assert.equal(v2.VERSION,'2.0.0');
assert.equal(v2.APP_VERSION,'16.78.19');
assert.equal(v2.SCHEMA_VERSION,2);
assert.ok(base.TOOLS.cache,'V2 must extend the existing creator with a cache/secret-passage tool');

let roomA=base.createRoom({name:'Salle principale',width:6,height:6});
roomA=base.applyTool(roomA,7,'chest');
roomA=base.applyTool(roomA,8,'cache');
roomA=base.upsertRoom(roomA);
let roomB=base.createRoom({name:'Sous-pièce secrète',width:5,height:5});
roomB=base.upsertRoom(roomB);

const legacy=v2.normalizeAttachment({kind:'puzzle',targetIndex:3});
assert.equal(legacy.targetType,'cell','old/unspecified attachments must default to cell');

const chestAtt=v2.addAttachment(roomA.id,{kind:'puzzle',targetType:'chest',targetIndex:7,refId:'enigme-runes'});
assert.equal(chestAtt.targetType,'chest');
assert.equal(v2.attachmentsForTarget(roomA.id,'chest',7,'puzzle').length,1);

const doorTarget=v2.roomTargets(roomA,'door')[0];
assert.ok(doorTarget,'new rooms must expose entry/exit as door targets');
const doorTrap=v2.addAttachment(roomA.id,{kind:'trap',targetType:'door',targetIndex:doorTarget.index,refId:'piege-aiguille'});
assert.equal(v2.attachmentsForTarget(roomA.id,'door',doorTarget.index,'trap')[0].id,doorTrap.id);

assert.throws(()=>v2.addAttachment(roomA.id,{kind:'puzzle',targetType:'chest',targetIndex:7,refId:'enigme-runes'}),/déjà attachée/,'exact duplicate attachments must be rejected');
assert.throws(()=>v2.addAttachment(roomA.id,{kind:'trap',targetType:'chest',targetIndex:9}),/Cible invalide/,'chest attachment must target an actual chest');

const link=v2.upsertCacheLink(roomA.id,8,roomB.id);
assert.equal(link.targetRoomId,roomB.id);
assert.equal(v2.cacheLinkFor(roomA.id,8).targetRoomId,roomB.id,'cache -> sub-room link must persist');
assert.equal(v2.roomPackage(roomA.id).interactions.cacheLinks.length,1,'room package must include phase-3-ready links');

roomA=base.findRoom(roomA.id);
roomA=base.applyTool(roomA,7,'erase');
base.upsertRoom(roomA);
const reconciled=v2.reconcileRoom(roomA.id);
assert.equal(reconciled.attachments.some(a=>a.id===chestAtt.id),false,'attachments to removed targets must be cleaned safely');
assert.equal(reconciled.attachments.some(a=>a.id===doorTrap.id),true,'unrelated valid attachments must survive reconciliation');

assert.doesNotMatch(v2Src,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom|trackSpawnedEnemyInstances)\s*\(/,'Room Creator V2 must not rewrite stable movement/combat/timeline/spawn systems');
assert.match(v2Src,/Cache → sous-pièce/,'cache/sub-room UI must be present');
assert.match(v2Src,/Porte \(entrée\/sortie\)/,'door target UI must be present');
assert.match(v2Src,/Coffre/,'chest target UI must be present');
assert.match(workflow,/dungeon-room-creator-v2-167819\.js/,'Pages workflow must inject Room Creator V2');
assert.match(workflow,/dungeon_room_creator_v2_v167819\.test\.cjs/,'Pages workflow must run Room Creator V2 regression test');
assert.match(sw,/dungeon-room-creator-v2-167819\.js/,'Room Creator V2 must be pre-cached');

if(htmlArg){
  const html=fs.readFileSync(htmlArg,'utf8');
  const basePos=html.indexOf('assets/dungeon/dungeon-room-creator-100.js');
  const v2Pos=html.indexOf('assets/dungeon/dungeon-room-creator-v2-167819.js?v=167819');
  assert.ok(basePos>=0&&v2Pos>basePos,'final HTML must load Room Creator V2 after V1');
}

console.log('Dungeon Room Creator V2 / V16.78.19 regressions: OK');
