const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bytes=rel=>fs.readFileSync(path.join(root,rel));
const gitBlob=buf=>crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+buf.length+'\0'),buf
])).digest('hex');

const corePath='assets/gensrpg/core/text-utils-v1.js';
const roomPath='assets/dungeon/dungeon-room-creator-100.js';
const coreBuf=bytes(corePath),core=coreBuf.toString('utf8');
const roomBuf=bytes(roomPath),room=roomBuf.toString('utf8');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const browserTest=read('tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs');

assert.equal(gitBlob(coreBuf),'c84cd370c5c2874a51d5314abbf695fc4a63a7ee',
  'Core Text Utility blob drifted during consumer preaudit');
assert.equal(gitBlob(roomBuf),'19c0fff57bfe27648819a12ed657cebe4f41f6df',
  'Room Creator must remain byte-identical during preaudit');

const legacySource=room.split("\n").find(line=>line.startsWith('function esc(v){'));
assert.ok(legacySource,'Room Creator esc source line missing');

const legacyCtx={};
vm.createContext(legacyCtx);
vm.runInContext(legacySource+';globalThis.__legacy=esc;',legacyCtx);

const coreCtx={};
coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(core,coreCtx,{filename:corePath});

const legacy=legacyCtx.__legacy;
const current=coreCtx.GensTextUtilsV1.escapeHtml;
const cases=[
  null,undefined,'',0,42,false,true,'hello',
  '&','<','>','"',"'",
  '<&>"\'',
  'already &amp; escaped',
  'Salle <Boss> & "élite" \'ancienne\''
];
for(const value of cases){
  assert.equal(current(value),legacy(value),'Room Creator/Core parity drift for '+String(value));
}

const roomEscCallsites=(room.match(/\besc\s*\(/g)||[]).length-1;
assert.equal(roomEscCallsites,10,'Room Creator escape callsite inventory drifted');

const renderStart=room.indexOf('function renderLibrary');
assert.ok(renderStart>=0,'Room Creator render boundary missing');
const roomCalls=[...room.matchAll(/\besc\s*\(/g)].map(m=>m.index)
  .filter(i=>i>room.indexOf('function esc'));
assert.equal(roomCalls.length,10);
assert.ok(roomCalls.every(i=>i>=renderStart),
  'Room Creator escape calls must stay confined to render/UI functions');

assert.doesNotMatch(room,/GensTextUtilsV1/,
  'preaudit must not raccord Room Creator yet');

assert.ok(workflow.includes('dungeon-room-creator-100.js'),
  'Pages must keep loading Room Creator');
assert.ok(preview.includes('dungeon-room-creator-100.js'),
  'preview must keep loading Room Creator');
assert.ok(!workflow.includes('text-utils-v1.js'),
  'Core Text Utility must remain inert in Pages during preaudit');
assert.ok(!preview.includes('text-utils-v1.js'),
  'Core Text Utility must remain inert in preview during preaudit');

assert.ok(workflow.indexOf('dungeon-room-creator-100.js')<workflow.indexOf('dungeon-world-builder-167821.js'),
  'Pages Room Creator/World Builder order drifted');
assert.ok(preview.indexOf('dungeon-room-creator-100.js')<preview.indexOf('dungeon-world-builder-167821.js'),
  'preview Room Creator/World Builder order drifted');

assert.match(browserTest,/roomApi:!!window\.DungeonRoomCreator100/,
  'browser Builder coverage must observe Room Creator API');
assert.match(browserTest,/Room Creator launcher must remain visible/,
  'browser Builder coverage must keep the Room Creator launcher visible');

console.log(JSON.stringify({
  scenario:'Phase 4 U1 first consumer preaudit',
  selected:'DungeonRoomCreator100',
  selectedPath:roomPath,
  parityCases:cases.length,
  roomEscapeCallsites:roomEscCallsites,
  futureLoadOrder:'GensTextUtilsV1 before DungeonRoomCreator100 in Pages and preview',
  runtimeModified:false
},null,2));
