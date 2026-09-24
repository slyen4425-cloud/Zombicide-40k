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

assert.equal(bytes.length,8172687,'S2 runtime must match the exact Survival-provider candidate');
assert.equal(gitBlob,'e56f7b63963d991717e1738c3e5188011276a2b7','S2 runtime blob must match the exact Survival-provider candidate');

assert.match(index,/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze\(\{/,
  'S2 requires the S1 Shell registry');
assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,
  'S2 must keep one active-module resolver');

const nativeStart=index.indexOf('async function startConfiguredGame(){');
const nextOwner=index.indexOf('function gensCleanDungeonBaseHeroesFromOtherRpgProfiles(){',nativeStart);
assert.ok(nativeStart>0&&nextOwner>nativeStart,'native Shell start owner boundary must remain exact');

const providerStart=index.indexOf('const gensSurvivalNativeStartV1=startConfiguredGame;',nativeStart);
assert.ok(providerStart>nativeStart&&providerStart<nextOwner,
  'S2 requires a captured native Survival start reference directly after the native Shell owner');

const provider=index.slice(providerStart,nextOwner);
assert.match(provider,/const\s+gensSurvivalStartModuleSessionV1\s*=\s*async\s*\(\)\s*=>\s*\{/,
  'S2 requires a dedicated Survival provider');
assert.match(provider,/if\(gensShellActiveModuleV1\(\)!==["']survival["']\)return false/,
  'Survival provider must refuse non-Survival routing state');
assert.match(provider,/await\s+gensSurvivalNativeStartV1\(\)/,
  'Survival provider must call the captured native Shell launch path');
assert.match(provider,/return true/,
  'Survival provider must report handled=true after delegating');
assert.doesNotMatch(provider,/GensShellModuleLaunchV1\.register/,
  'S2 must not register Survival before the S1 registry exists');

const registryExpose=index.indexOf('window.GensShellModuleLaunchV1=Object.freeze({');
const goMenu=index.indexOf('function goMenu(){',registryExpose);
const registration=index.indexOf('window.GensShellModuleLaunchV1.register("survival",gensSurvivalStartModuleSessionV1);');
assert.ok(registryExpose>nextOwner&&registration>registryExpose&&registration<goMenu,
  'S2 must register Survival only after the S1 registry is exposed and before goMenu');

assert.doesNotMatch(provider,/document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'S2 provider must contain routing only; native launch remains the existing owner');

assert.ok((index.match(/GensShellModuleLaunchV1\.register\("dungeon"/g)||[]).length<=1,
  'later S4 may register Dungeon once; S2 must not permit duplicate Dungeon providers');
assert.doesNotMatch(index,/GensShellModuleLaunchV1\.register\(["']pvp["']/,
  'PvP must remain unrouted during the module-launch provider sequence');

assert.equal((index.match(/window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)\s*\{/g)||[]).length,4,
  'S2 must preserve the four remaining historical startConfiguredGame globals');
assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'S2 must preserve the native Shell startConfiguredGame owner');
assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S2 must leave the production launch button on the legacy global route');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S2 must not switch production routing to the registry');

for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js']){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing historical launch owner '+id);
  assert.match(m[1],/window\.startConfiguredGame\s*=\s*async\s+function/,'historical owner changed: '+id);
}
const core200=index.match(/<script\\b[^>]*\\bid=["\\']dungeonCore200Rebuild["\\'][^>]*>([\\s\\S]*?)<\\/script>/i)?.[1]||'';
assert.match(core200,/const gensDungeonStartConfiguredGame200V1=async function/,'Core200 local Dungeon launch dispatcher must remain');
assert.doesNotMatch(core200,/window\.startConfiguredGame\s*=(?!=)/,'Core200 global launch assignment must remain retired');
assert.match(core200,/GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\)/,'Core200 Dungeon provider registration must remain');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S2 Survival provider',
  expected:'RED before provider insertion, GREEN after provider registration',
  legacyProductionRouting:true,
  historicalWrappers:5,
  provider:'survival'
},null,2));
