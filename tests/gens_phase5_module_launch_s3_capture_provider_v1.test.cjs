'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8172742,'S3 RED must start from the exact S2 GREEN runtime');
assert.equal(gitBlob,'95f8c96e7e221eb743f7c8013ffa8af499eca1c8','S3 RED must start from the exact S2 GREEN blob');

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
const providerPos=c139.indexOf('const gensCaptureStartModuleSessionV1=async()=>{');
const registrationPos=c139.indexOf('window.GensShellModuleLaunchV1.register("capture",gensCaptureStartModuleSessionV1);');

assert.ok(wrapperPos>=0,'Capture139 wrapper must remain');
assert.ok(captureRefPos>wrapperPos,'S3 requires capturing Capture139 after its wrapper is installed');
assert.ok(providerPos>captureRefPos,'S3 requires a Capture-owned provider after the captured reference');
assert.ok(registrationPos>providerPos,'S3 requires registration after provider declaration');

const provider=c139.slice(providerPos,registrationPos);
assert.match(provider,/if\(gensShellActiveModuleV1\(\)!==["']capture["']\)return false/,
  'Capture provider must refuse non-Capture routing state');
assert.match(provider,/await\s+gensCaptureStartConfiguredGame139V1\(\)/,
  'Capture provider must invoke the captured Capture139 owner');
assert.match(provider,/return true/,
  'Capture provider must normalize handled=true');
assert.doesNotMatch(provider,/document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'S3 provider must be routing-only; Capture139 remains the gameplay/session owner');

assert.match(index,/GensShellModuleLaunchV1\.register\("survival",gensSurvivalStartModuleSessionV1\)/,
  'S2 Survival provider must remain');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("capture"/g)||[]).length,1,
  'S3 must register Capture exactly once');
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
assert.deepEqual(chain,['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild'],
  'S3 must preserve all five historical launch owners');

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S3 must keep the production button on the historical global route');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S3 must not switch production routing to the registry');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S3 Capture provider',
  expected:'RED before Capture provider insertion, GREEN after Capture139-owned registration',
  historicalChain:chain,
  productionRouting:'legacy startConfiguredGame unchanged',
  provider:'capture'
},null,2));
