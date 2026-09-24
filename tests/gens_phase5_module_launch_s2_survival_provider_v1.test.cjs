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

assert.equal(bytes.length,8171576,'S2 RED must start from the exact S1 GREEN runtime');
assert.equal(gitBlob,'12be0fdbaa5c05f7852933b48a3dd5df09da6145','S2 RED must start from the exact S1 GREEN blob');

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
assert.match(provider,/window\.GensShellModuleLaunchV1\.register\(["']survival["'],gensSurvivalStartModuleSessionV1\)/,
  'S2 must register exactly the Survival provider');

assert.doesNotMatch(provider,/document\.|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener/,
  'S2 provider must contain routing only; native launch remains the existing owner');

for(const id of ['capture','dungeon','pvp']){
  assert.doesNotMatch(index,new RegExp('GensShellModuleLaunchV1\\.register\\(["\\\']'+id+'["\\\']'),
    'S2 must not register '+id+' yet');
}

assert.equal((index.match(/window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)\s*\{/g)||[]).length,5,
  'S2 must preserve all five historical startConfiguredGame wrappers');
assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'S2 must preserve the native Shell startConfiguredGame owner');
assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'S2 must leave the production launch button on the legacy global route');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'S2 must not switch production routing to the registry');

for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing historical launch owner '+id);
  assert.match(m[1],/window\.startConfiguredGame\s*=\s*async\s+function/,'historical owner changed: '+id);
}

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S2 Survival provider',
  expected:'RED before provider insertion, GREEN after provider registration',
  legacyProductionRouting:true,
  historicalWrappers:5,
  provider:'survival'
},null,2));
