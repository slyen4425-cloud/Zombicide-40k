'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const owner=read('assets/gensrpg/capture/session-start-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const shellFinal=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165823,'Rule 26 closure must stay on the exact Capture session-owner runtime');
assert.equal(blob,'26421e0347305437fe2b1dc149b3e4fb8b3761bd','Rule 26 closure must stay on the exact Capture session-owner blob');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing '+id);
  return m[1];
}

const c139=block('captureFix139');

assert.doesNotMatch(c139,/const\s+start139\s*=|window\.startConfiguredGame\s*=|gensCaptureStartConfiguredGame139V1|legacyStartConfiguredGame/,
  'Capture139 must remain retired from global/session-start ownership');
assert.doesNotMatch(c139,/_captureStarting139|setTimeout\([\s\S]*?1200/,
  'dead Capture139 launch lock/timer must remain retired');
assert.doesNotMatch(c139,/const\s+participants\s*=\s*normalizeGameParticipants\(\)/,
  'Capture139 must no longer own the session-start body');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 must only wire explicit historical dependencies into the dedicated owner');
assert.match(c139,/normalizeParticipants:\(\)=>normalizeGameParticipants\(\)/);
assert.match(c139,/participantsReady:/);
assert.match(c139,/activateParticipant:/);
assert.match(c139,/saveParticipants:/);
assert.match(c139,/loadWorld:/);
assert.match(c139,/saveWorld:/);
assert.match(c139,/ensureStarterKits:/);
assert.match(c139,/readTurnOrderEnabled:/);
assert.match(c139,/enterWorld:\(\)=>captureEnterWorld139\(\)/);
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/);

assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,1,
  'dedicated Capture session-start owner must be loaded exactly once');
assert.match(owner,/GensCaptureSessionStartV1/);
assert.match(owner,/function\s+install\s*\(/);
assert.match(owner,/async\s+function\s+start\s*\(/);
assert.match(owner,/function\s+dispose\s*\(/);
assert.match(owner,/function\s+status\s*\(/);
assert.doesNotMatch(owner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'session-start owner must consume explicit bindings and own no DOM/storage/timer authority');

assert.match(entry,/sessionStartOwner/);
assert.match(entry,/await sessionStartOwner\.start\(\)/);
assert.doesNotMatch(entry,/legacyStartConfiguredGame|Capture139 legacy start/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);

assert.ok(contract.owns.includes('Capture session initialization'));
assert.ok(contract.consumes.includes('Capture session-start owner public API'));
assert.ok(!contract.consumes.includes('temporary legacy Capture139 session start binding'));
assert.ok(contract.invariants.some(x=>/Capture139 no longer owns session initialization/i.test(x)));

assert.match(shellFinal,/launchService\.startModuleSession\(moduleId\)/,
  'final Shell must remain the global startConfiguredGame routing boundary');
assert.doesNotMatch(shellFinal,/captureEnterWorld139|normalizeGameParticipants|captureWorldState|GensCaptureSessionStartV1/,
  'generic Shell must not absorb Capture session initialization');

console.log(JSON.stringify({
  scenario:'Phase 9 Capture session-start owner-transfer Rule 26 closure',
  rule26:{bytes:bytes.length,blob},
  currentOwner:'GensCaptureSessionStartV1',
  capture139SessionOwner:false,
  shellRoutingCanonical:true,
  selectedSeam:{
    owner:'assets/gensrpg/capture/session-start-v1.js',
    publicApi:'GensCaptureSessionStartV1',
    lexicalAdapter:'activateParticipant(current,state) only',
    deferred:'moduleScreenReturn / captureEnterWorld139 ownership remains a separate lot'
  },
  runtimeChanged:true
},null,2));
