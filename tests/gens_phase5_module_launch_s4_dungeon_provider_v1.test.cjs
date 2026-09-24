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

assert.equal(bytes.length,8172529,'S4 RED must start from the exact S3 GREEN runtime');
assert.equal(gitBlob,'696014056409dda9b6ef25ace58dfd9d5f9e2718','S4 RED must start from the exact S3 blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const d200=block('dungeonCore200Rebuild');
const wrapper='window.startConfiguredGame=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};';
const wrapperPos=d200.indexOf(wrapper);
assert.ok(wrapperPos>=0,'Core200 final Dungeon launch interceptor must remain');

const refPos=d200.indexOf('const gensDungeonStartConfiguredGame200V1=window.startConfiguredGame;',wrapperPos);
assert.ok(refPos>wrapperPos,'S4 requires capturing the final Core200 Dungeon launch interceptor');

const providerPos=d200.indexOf('const gensDungeonStartModuleSessionV1=async()=>{',refPos);
const registrationPos=d200.indexOf('window.GensShellModuleLaunchV1.register("dungeon",gensDungeonStartModuleSessionV1);',providerPos);
assert.ok(providerPos>refPos,'S4 requires a Dungeon provider after the captured Core200 reference');
assert.ok(registrationPos>providerPos,'S4 requires Dungeon registration after provider declaration');

const provider=d200.slice(providerPos,registrationPos);
assert.match(provider,/if\(gensShellActiveModuleV1\(\)!==["']dungeon["']\)return false/,
  'Dungeon provider must refuse non-Dungeon routing state');
assert.match(provider,/await\s+gensDungeonStartConfiguredGame200V1\(\)/,
  'Dungeon provider must invoke the captured final Core200 launch owner');
assert.match(provider,/return true/,
  'Dungeon provider must normalize handled=true');
assert.doesNotMatch(provider,/document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'S4 provider must remain routing-only');

assert.equal((index.match(/GensShellModuleLaunchV1\.register\("survival"/g)||[]).length,1,
  'S2 Survival provider must remain registered exactly once');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("capture"/g)||[]).length,1,
  'S3 Capture provider must remain registered exactly once');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("dungeon"/g)||[]).length,1,
  'S4 must register Dungeon exactly once');
assert.equal((index.match(/GensShellModuleLaunchV1\.register\("pvp"/g)||[]).length,0,
  'S4 must not register PvP');

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id);
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(
  chain,
  ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild'],
  'S4 must preserve all five historical launch owners'
);

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S4 must keep the production button on startConfiguredGame');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S4 must not switch production routing to the registry');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S4 Dungeon provider',
  expected:'RED before Dungeon provider insertion, GREEN after Core200-owned registration',
  historicalChain:chain,
  productionRouting:'legacy startConfiguredGame unchanged',
  provider:'dungeon'
},null,2));
