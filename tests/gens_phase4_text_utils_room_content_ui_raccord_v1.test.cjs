const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const consumerPath='assets/dungeon/dungeon-room-content-ui-167831.js';
const loaderPath='assets/dungeon/dungeon-room-creator-feedback-167821.js';
const corePath='assets/gensrpg/core/text-utils-v1.js';

const consumer=fs.readFileSync(path.join(root,consumerPath),'utf8');
const loader=fs.readFileSync(path.join(root,loaderPath),'utf8');
const core=fs.readFileSync(path.join(root,corePath),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

assert.match(consumer,/GensTextUtilsV1.*escapeHtml|escapeHtml.*GensTextUtilsV1/s,
  'RED expected: Room Content UI must consume Core Text Utils');
assert.doesNotMatch(consumer,/function esc\(v\)\{return String\(v\?\?""\)\.replace/,
  'local escape implementation must be removed after raccord');
assert.equal((consumer.match(/\bescapeHtml\(/g)||[]).length,4,
  'exactly four Room Content UI callsites must use the Core alias');

assert.match(loader,/assets\/gensrpg\/core\/text-utils-v1\.js/,
  'Room Creator loader must load Text Utils');
assert.match(loader,/onload=loadIntuitiveUI/,
  'Text Utils load must gate Room Content UI loading');
assert.match(loader,/loadGridCapture\(\).*loadTextUtils/s,
  'grid-capture completion must continue through the Text Utils dependency gate');

assert.match(sw,/"\.\/assets\/gensrpg\/core\/text-utils-v1\.js"/,
  'Text Utils must be pre-cached once it becomes a runtime dependency');

const ctx={console,document:null};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(core,ctx,{filename:corePath});
vm.runInContext(consumer,ctx,{filename:consumerPath});
assert.ok(ctx.DungeonRoomContentUI167831,'Room Content UI must still install with Text Utils present');

assert.equal(ctx.GensTextUtilsV1.escapeHtml('&<>"\''),'&amp;&lt;&gt;&quot;&#39;');
assert.doesNotMatch(loader,/setTimeout\(loadTextUtils|setInterval\(|MutationObserver/,
  'raccord must not add retry/observer authority');

console.log(JSON.stringify({
  scenario:'Phase 4 Text Utils Room Content UI runtime raccord',
  consumer:'DungeonRoomContentUI167831',
  core:'GensTextUtilsV1.escapeHtml',
  callsites:4,
  loaderGate:true,
  pwaPrecache:true
},null,2));
