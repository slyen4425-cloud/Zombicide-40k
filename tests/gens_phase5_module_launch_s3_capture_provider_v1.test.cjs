'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8167044,'S3 must track the current Phase 7 generated Boss policy runtime');
assert.equal(gitBlob,'d38eae0b46208f71bc4c290b25b625cc9c12e052','S3 must track the current Phase 7 generated Boss policy blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const c139=block('captureFix139');
assert.match(c139,/const\s+start139\s*=\s*window\.startConfiguredGame/);
assert.match(c139,/window\.startConfiguredGame\s*=\s*async\s+function/);

const wrapperPos=c139.indexOf('window.startConfiguredGame=async function(){');
const captureRefPos=c139.indexOf('const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;');
const installPos=c139.indexOf('window.GensCaptureV1.install(gensCaptureStartConfiguredGame139V1);');

assert.ok(wrapperPos>=0,'Capture139 wrapper must remain');
assert.ok(captureRefPos>wrapperPos,'S3 stable Capture139 reference must remain after its wrapper is installed');
assert.ok(installPos>captureRefPos,'Phase 9 must bind the stable Capture139 reference into the public Capture entry');
assert.doesNotMatch(c139,/const gensCaptureStartModuleSessionV1=async\(\)=>/,
  'Capture139 must no longer own the public provider implementation');
assert.doesNotMatch(c139,/GensShellModuleLaunchV1\.register\("capture"/,
  'Capture139 must no longer register Capture directly');

assert.match(entry,/function startModuleSession\(\)/);
assert.match(entry,/if\(shell\.activeModule\(\)!=="capture"\)return false/);
assert.match(entry,/await legacyStartConfiguredGame\(\)/);
assert.match(entry,/return true/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(entry,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'Phase 9 Capture provider must remain routing-only; Capture139 remains the gameplay/session owner');

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
assert.deepEqual(chain,['captureFix138','captureFix139','gensDungeonCore01Js'],
  'S3 must track the three remaining historical global launch owners after Capture135 retirement');
assert.doesNotMatch(block('captureFix135'),/window\.startConfiguredGame\s*=(?!=)/,
  'Capture135 global launch owner must remain retired');

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S3 must keep the production button on the historical global route');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S3 must not switch production routing to the registry');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S3 Capture provider',
  expected:'historical S3 reference preserved; Phase 9 provider ownership moved to GensCaptureV1',
  historicalChain:chain,
  productionRouting:'legacy startConfiguredGame unchanged',
  provider:'GensCaptureV1'
},null,2));
