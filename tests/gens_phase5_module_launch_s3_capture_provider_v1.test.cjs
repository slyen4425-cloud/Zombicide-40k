'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const owner=fs.readFileSync(path.join(root,'assets/gensrpg/capture/session-start-v1.js'),'utf8');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8164674,'S3 must track the current Phase 7 generated Boss policy runtime');
assert.equal(gitBlob,'644fc5d0ce5fd195c5496d42cc0204bd1f9a9831','S3 must track the current Phase 7 generated Boss policy blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const c139=block('captureFix139');
assert.doesNotMatch(c139,/const\s+start139\s*=|window\.startConfiguredGame\s*=|gensCaptureStartConfiguredGame139V1/,
  'Capture139 must remain retired from global launch ownership');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 must wire the dedicated Capture session owner');
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/,
  'Capture139 must bind the dedicated owner into the public entry');
assert.doesNotMatch(c139,/const gensCaptureStartModuleSessionV1=async\(\)=>/,
  'Capture139 must no longer own the public provider implementation');
assert.doesNotMatch(c139,/GensShellModuleLaunchV1\.register\("capture"/,
  'Capture139 must no longer register Capture directly');

assert.match(entry,/function startModuleSession\(\)/);
assert.match(entry,/if\(shell\.activeModule\(\)!=="capture"\)return false/);
assert.match(entry,/sessionStartOwner/);
assert.match(entry,/await sessionStartOwner\.start\(\)/);
assert.match(entry,/return true/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(entry,/legacyStartConfiguredGame|document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'Phase 9 Capture provider must remain routing-only and delegate to GensCaptureSessionStartV1');
assert.match(owner,/GensCaptureSessionStartV1/);
assert.doesNotMatch(owner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/);

assert.match(index,/GensShellModuleLaunchV1\.register\("survival",gensSurvivalStartModuleSessionV1\)/,
  'S2 Survival provider must remain');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("capture"/g)||[]).length,0,
  'Phase 9 must retire the direct inline Capture registration');
assert.equal((entry.match(/shell\.register\("capture",startModuleSession\)/g)||[]).length,1,
  'Phase 9 Capture entry must register Capture exactly once');
assert.ok((index.match(/GensShellModuleLaunchV1\.register\("dungeon"/g)||[]).length<=1,
  'later S4 may register Dungeon once; S3 must not permit duplicate Dungeon providers');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("pvp"/g)||[]).length,0,
  'S3 must not register PvP');

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id);
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,['gensDungeonCore01Js'],
  'S3 must track the post-transfer historical global launch owners');
assert.doesNotMatch(block('captureFix135'),/window\.startConfiguredGame\s*=(?!=)/,
  'Capture135 global launch owner must remain retired');

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S3 must keep the production button on the historical global route');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S3 must not switch production routing to the registry');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S3 Capture provider',
  expected:'Capture provider remains in GensCaptureV1 and session initialization is owned by GensCaptureSessionStartV1',
  historicalChain:chain,
  productionRouting:'legacy startConfiguredGame unchanged',
  provider:'GensCaptureV1'
},null,2));
