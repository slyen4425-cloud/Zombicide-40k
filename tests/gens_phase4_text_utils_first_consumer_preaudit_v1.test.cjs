const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bytes=rel=>fs.readFileSync(path.join(root,rel));
const gitBlob=data=>crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+data.length),
  Buffer.from([0]),
  data
])).digest('hex');

const roomRel='assets/dungeon/dungeon-room-creator-100.js';
const serviceRel='assets/gensrpg/core/text-utils-v1.js';
const roomBuf=bytes(roomRel);
const serviceBuf=bytes(serviceRel);
const room=roomBuf.toString('utf8');
const service=serviceBuf.toString('utf8');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');

assert.equal(gitBlob(roomBuf),'19c0fff57bfe27648819a12ed657cebe4f41f6df',
  'Room Creator source drifted during first-consumer preaudit');
assert.equal(gitBlob(serviceBuf),'f0befe5feaf3bb2536b9b15267399988c949aab8',
  'Text Utils U1 source drifted during first-consumer preaudit');

const lineFunction=(src,name)=>{
  const line=src.split('\n').find(x=>x.startsWith('function '+name+'('));
  assert.ok(line,'missing function '+name);
  return line;
};

const escSource=lineFunction(room,'esc');
const renderLibrary=lineFunction(room,'renderLibrary');
const renderGrid=lineFunction(room,'renderGrid');
const renderStatus=lineFunction(room,'renderStatus');

assert.equal((room.match(/function esc\(/g)||[]).length,1,
  'Room Creator must keep one local esc owner before raccord');
assert.equal((room.match(/\besc\(/g)||[]).length,11,
  'Room Creator esc occurrence inventory drifted');
assert.doesNotMatch(room,/GensTextUtilsV1/,
  'preaudit must stay before runtime raccord');

assert.equal((renderLibrary.match(/\besc\(/g)||[]).length,7,
  'renderLibrary esc callsite inventory drifted');
assert.equal((renderGrid.match(/\besc\(/g)||[]).length,1,
  'renderGrid esc callsite inventory drifted');
assert.equal((renderStatus.match(/\besc\(/g)||[]).length,2,
  'renderStatus esc callsite inventory drifted');

const accounted=1+
  (renderLibrary.match(/\besc\(/g)||[]).length+
  (renderGrid.match(/\besc\(/g)||[]).length+
  (renderStatus.match(/\besc\(/g)||[]).length;
assert.equal(accounted,(room.match(/\besc\(/g)||[]).length,
  'all Room Creator esc usages must stay confined to helper plus three render functions');

const localCtx={console};
localCtx.globalThis=localCtx;localCtx.window=localCtx;
vm.createContext(localCtx);
vm.runInContext(escSource+';globalThis.__localEsc=esc;',localCtx,{filename:roomRel});

const coreCtx={console};
coreCtx.globalThis=coreCtx;coreCtx.window=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(service,coreCtx,{filename:serviceRel});

const localEsc=localCtx.__localEsc;
const coreEsc=coreCtx.GensTextUtilsV1.escapeHtml;

const cases=[
  null,undefined,'',0,42,false,true,'plain text',
  '&','<','>','"',String.fromCharCode(39),"&<>\"'",
  'already &lt; escaped','éèà 😀',
  {toString(){return '<object & value>'}}
];
for(const value of cases){
  assert.equal(coreEsc(value),localEsc(value),
    'Room Creator local esc parity drift for '+String(value));
}

assert.ok(escSource.includes('String(v??"")'),
  'Room Creator helper must preserve nullish-to-empty String semantics');
assert.ok(escSource.includes('replace(/[&<>"\\']/g'),
  'Room Creator helper HTML character set drifted');

assert.ok(!pages.includes('text-utils-v1.js'),
  'Text Utils must remain inert in Pages during preaudit');
assert.ok(!preview.includes('text-utils-v1.js'),
  'Text Utils must remain inert in preview during preaudit');
assert.ok(pages.includes('dungeon-room-creator-100.js'),
  'Pages Room Creator load anchor missing');
assert.ok(preview.includes('dungeon-room-creator-100.js'),
  'Preview Room Creator load anchor missing');

const futureHelper='function esc(v){return GensTextUtilsV1.escapeHtml(v)}';

console.log(JSON.stringify({
  scenario:'Phase 4 Text Utils first consumer preaudit',
  selected:roomRel,
  localHelper:'esc',
  totalEscOccurrences:11,
  callsites:{renderLibrary:7,renderGrid:1,renderStatus:2},
  parityCases:cases.length,
  coreService:serviceRel,
  currentCoreReachable:false,
  futureCompositionRequirement:'load text-utils-v1.js before dungeon-room-creator-100.js in Pages and preview',
  futureMinimalHelper:futureHelper,
  runtimeModified:false
},null,2));
