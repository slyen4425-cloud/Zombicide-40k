const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const consumerPath='assets/dungeon/dungeon-room-content-ui-167831.js';
const loaderPath='assets/dungeon/dungeon-room-creator-feedback-167821.js';
const corePath='assets/gensrpg/core/text-utils-v1.js';

const consumerBuf=fs.readFileSync(path.join(root,consumerPath));
const consumer=consumerBuf.toString('utf8');
const loader=fs.readFileSync(path.join(root,loaderPath),'utf8');
const coreBuf=fs.readFileSync(path.join(root,corePath));
const core=coreBuf.toString('utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');

const gitBlob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

assert.equal(gitBlob(coreBuf),'f0befe5feaf3bb2536b9b15267399988c949aab8','U1 Core Text Utils drifted');
assert.equal(gitBlob(consumerBuf),'5f0082699d71232a378a8163f4907bf5af3e72e8','Room Content UI raccord blob drifted');
assert.equal(indexBuf.length,8174314,'runtime index size drifted during inert-consumer preaudit');
assert.equal(gitBlob(indexBuf),'8ef7c65fca1f72f0393f0f6ccb6fea8426b41f91','runtime index blob drifted during inert-consumer preaudit');

assert.match(consumer,/UI-only layer over the existing zone\/template content APIs/);
assert.doesNotMatch(consumer,/function esc\(v\)/,
  'local duplicate must stay removed after dedicated raccord');
assert.match(consumer,/const escapeHtml=ROOT\.GensTextUtilsV1\?\.escapeHtml/,
  'Room Content UI must keep the Core Text Utils dependency');
const escCalls=(consumer.match(/\bescapeHtml\(/g)||[]).length;
assert.equal(escCalls,4,'Room Content UI Core escape callsite inventory drifted');

assert.match(consumer,/function optionHtml\(items,value\).*escapeHtml\(x\.id\).*escapeHtml\(x\.label\).*escapeHtml\(x\.rarity\)/s,
  'option HTML must remain the main escaping consumer');
assert.match(consumer,/function renderItems\(surface\).*escapeHtml\(names\.get\(String\(it\.itemId\)\)\|\|it\.itemId\)/s,
  'rendered item names must remain escaped');
assert.doesNotMatch(consumer,/localStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|Supabase|setInterval/,
  'selected helper surface must stay outside storage/network/permanent timers');

const coreCtx={};coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;vm.createContext(coreCtx);vm.runInContext(core,coreCtx,{filename:corePath});
assert.equal(coreCtx.GensTextUtilsV1.escapeHtml('&amp;'),'&amp;amp;','historical double escaping must remain');

assert.match(loader,/function loadIntuitiveUI\(\).*dungeon-room-content-ui-167831\.js\?v=167833/s,
  'Room Content UI dynamic loader path drifted');
assert.match(loader,/assets\/gensrpg\/core\/text-utils-v1\.js/,
  'dedicated raccord must load Text Utils before Room Content UI');
assert.doesNotMatch(index,/text-utils-v1\.js|GensTextUtilsV1/,
  'Text Utils U1 must not be loaded by index during this preaudit');

const selection={
  selected:consumerPath,
  owner:'DungeonRoomContentUI167831',
  localHelper:'esc',
  parityCases:cases.length,
  localEscOccurrences:escCalls,
  runtimeLoadedTextUtils:true,
  raccordRisk:'resolved by explicit loader dependency gate',
  futureRaccord:[
    'installed: Text Utils loads before Room Content UI',
    'installed: Room Content UI uses only Core escapeHtml',
    'installed: local duplicate removed',
    'World Builder, Stats UI and Tactical remain untouched'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 4 Text Utils first-consumer preaudit',
  index:{bytes:indexBuf.length,blob:gitBlob(indexBuf)},
  coreBlob:gitBlob(coreBuf),
  consumerBlob:gitBlob(consumerBuf),
  selection,
  runtimeChanged:true
},null,2));
