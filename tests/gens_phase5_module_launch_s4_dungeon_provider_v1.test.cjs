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

assert.equal(bytes.length,8170815,'S4 provider contract must run on the exact Core200-global-retired runtime');
assert.equal(gitBlob,'9c762dcb8ad3549cf7175ba9413f925b11f5396c','S4 provider contract must keep the exact reviewed Core200 retirement blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const d200=block('dungeonCore200Rebuild');
const wrapper='const gensDungeonStartConfiguredGame200V1=async function(){if(isDungeonMode?.()&&!(typeof isCaptureContext138==="function"&&isCaptureContext138()))return start();return startOutside200?.apply(this,arguments)};';
const wrapperPos=d200.indexOf(wrapper);
assert.ok(wrapperPos>=0,'Core200 Dungeon launch dispatcher must remain as the stable local S4 reference');

const refPos=wrapperPos;
assert.doesNotMatch(d200,/window\.startConfiguredGame\s*=(?!=)/,
  'Core200 must no longer publish startConfiguredGame globally');

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
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'S4 must preserve the three remaining historical launch owners after captureFix135 retirement'
);

assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S4 must keep the production button on startConfiguredGame');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S4 must not switch production routing to the registry');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S4 Dungeon provider',
  expected:'GREEN with Dungeon provider bound to the local Core200 dispatcher after global retirement',
  historicalChain:chain,
  productionRouting:'final Shell global routing with local Core200 provider target',
  provider:'dungeon'
},null,2));
