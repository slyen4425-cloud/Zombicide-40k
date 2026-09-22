const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const roomPath='assets/dungeon/dungeon-room-creator-100.js';
const u1Path='assets/gensrpg/core/text-utils-v1.js';
const roomBuf=fs.readFileSync(path.join(root,roomPath));
const u1Buf=fs.readFileSync(path.join(root,u1Path));
const room=roomBuf.toString('utf8');
const u1=u1Buf.toString('utf8');
const main=fs.readFileSync(path.join(root,'.github/workflows/main.yml'),'utf8');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');

const gitBlob=buf=>crypto.createHash('sha1')
  .update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

assert.equal(gitBlob(roomBuf),'19c0fff57bfe27648819a12ed657cebe4f41f6df',
  'Room Creator source drifted before U1 raccord preaudit');
assert.equal(gitBlob(u1Buf),'d8dd5091963e180a18dfa5274aa4030cbaadaa90',
  'U1 source drifted before first consumer preaudit');

assert.equal((room.match(/function esc\(v\)/g)||[]).length,1,
  'Room Creator must have exactly one local esc helper before raccord');
assert.equal((room.match(/\besc\(/g)||[]).length,11,
  'Room Creator esc callsite inventory drifted');

const m=room.match(/function esc\(v\)\{return String\(v\?\?""\)\.replace\(\/\[&<>"'\]\/g,c=>\(\{[^\n]+\}\[c\]\)\)\}/);
assert.ok(m,'exact Room Creator pure esc helper missing');

const legacyCtx={};
legacyCtx.globalThis=legacyCtx;
vm.createContext(legacyCtx);
vm.runInContext(m[0]+';globalThis.__legacyEsc=esc;',legacyCtx);

const u1Ctx={console};
u1Ctx.window=u1Ctx;u1Ctx.globalThis=u1Ctx;
vm.createContext(u1Ctx);
vm.runInContext(u1,u1Ctx,{filename:u1Path});

const cases=[
  null,undefined,'',0,42,true,false,'texte normal',
  '&','<','>','"',"'",
  '&<>"\'',
  'A&B <tag> "x" \'y\'',
  '&amp;'
];

for(const input of cases){
  assert.equal(
    u1Ctx.GensTextUtilsV1.escapeHtml(input),
    legacyCtx.__legacyEsc(input),
    'Room Creator/U1 parity failed for '+String(input)
  );
}

assert.ok(main.includes('assets/dungeon/dungeon-room-creator-100.js'),
  'Pages composition must currently include Room Creator');
assert.ok(preview.includes('assets/dungeon/dungeon-room-creator-100.js'),
  'preview must currently include Room Creator');
assert.ok(!main.includes('assets/gensrpg/core/text-utils-v1.js'),
  'U1 must still be inert in Pages during preaudit');
assert.ok(!preview.includes('assets/gensrpg/core/text-utils-v1.js'),
  'U1 must still be inert in preview during preaudit');

const candidate='const TextUtils=ROOT.GensTextUtilsV1;if(!TextUtils)throw new Error("GensTextUtilsV1 must load before DungeonRoomCreator100");const esc=TextUtils.escapeHtml;';
assert.ok(candidate.includes('GensTextUtilsV1'));
assert.ok(candidate.includes('escapeHtml'));

console.log(JSON.stringify({
  scenario:'Phase 4 U1 Room Creator raccord preaudit',
  roomCreatorBlob:gitBlob(roomBuf),
  textUtilsBlob:gitBlob(u1Buf),
  escOccurrences:(room.match(/\besc\(/g)||[]).length,
  parityCases:cases.length,
  pagesLoadsRoomCreator:true,
  previewLoadsRoomCreator:true,
  textUtilsStillInert:true,
  candidate,
  runtimeModified:false
},null,2));
