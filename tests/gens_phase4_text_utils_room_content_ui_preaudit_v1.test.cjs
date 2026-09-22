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
assert.equal(gitBlob(consumerBuf),'983a12bf6edad2eaec502bb08981e04b6c800be3','Room Content UI must remain unchanged during preaudit');
assert.equal(indexBuf.length,8174314,'runtime index size drifted during inert-consumer preaudit');
assert.equal(gitBlob(indexBuf),'8ef7c65fca1f72f0393f0f6ccb6fea8426b41f91','runtime index blob drifted during inert-consumer preaudit');

assert.match(consumer,/UI-only layer over the existing zone\/template content APIs/);
assert.match(consumer,/function esc\(v\)\{return String\(v\?\?""\)\.replace\(\/\[&<>\\"'\]\/g,/,
  'selected consumer local escape helper drifted');

const escCalls=(consumer.match(/\besc\(/g)||[]).length;
assert.equal(escCalls,5,'Room Content UI local esc inventory drifted: definition + four callsites expected');

assert.match(consumer,/function optionHtml\(items,value\).*esc\(x\.id\).*esc\(x\.label\).*esc\(x\.rarity\)/s,
  'option HTML must remain the main escaping consumer');
assert.match(consumer,/function renderItems\(surface\).*esc\(names\.get\(String\(it\.itemId\)\)\|\|it\.itemId\)/s,
  'rendered item names must remain escaped');
assert.doesNotMatch(consumer,/localStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|Supabase|setInterval/,
  'selected helper surface must stay outside storage/network/permanent timers');

const m=consumer.match(/function esc\(v\)\{([^}]+\}\[c\]\)\)\}\n)/);
assert.ok(m,'unable to extract local esc helper');
const fnSource='function esc(v){'+m[1];
const localCtx={};vm.createContext(localCtx);vm.runInContext(fnSource+';globalThis.__esc=esc;',localCtx);
const coreCtx={};coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;vm.createContext(coreCtx);vm.runInContext(core,coreCtx,{filename:corePath});

const cases=[
  null,undefined,'',0,42,true,false,'texte simple',
  '&','<','>','"',"'",'&<>"\'',
  '&amp;','A & B < C > D "Q" \'X\'','éèà 😀'
];
for(const value of cases){
  assert.equal(localCtx.__esc(value),coreCtx.GensTextUtilsV1.escapeHtml(value),
    'escape parity drift for '+String(value));
}
assert.equal(coreCtx.GensTextUtilsV1.escapeHtml('&amp;'),'&amp;amp;','historical double escaping must remain');

assert.match(loader,/function loadIntuitiveUI\(\).*dungeon-room-content-ui-167831\.js\?v=167833/s,
  'Room Content UI dynamic loader path drifted');
assert.doesNotMatch(loader,/text-utils-v1\.js|GensTextUtilsV1/,
  'Text Utils must still be inert before a dedicated raccord lot');
assert.doesNotMatch(index,/text-utils-v1\.js|GensTextUtilsV1/,
  'Text Utils U1 must not be loaded by index during this preaudit');

const selection={
  selected:consumerPath,
  owner:'DungeonRoomContentUI167831',
  localHelper:'esc',
  parityCases:cases.length,
  localEscOccurrences:escCalls,
  runtimeLoadedTextUtils:false,
  raccordRisk:'Text Utils is inert and loader does not yet guarantee dependency order',
  futureRaccord:[
    'load text-utils-v1.js explicitly before Room Content UI',
    'replace only the Room Content UI local esc helper',
    'remove the local duplicate after parity',
    'leave World Builder, Stats UI and Tactical untouched'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 4 Text Utils first-consumer preaudit',
  index:{bytes:indexBuf.length,blob:gitBlob(indexBuf)},
  coreBlob:gitBlob(coreBuf),
  consumerBlob:gitBlob(consumerBuf),
  selection,
  runtimeChanged:false
},null,2));
