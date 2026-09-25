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

assert.equal(bytes.length,8170815,'current runtime must preserve the S1 registry candidate');
assert.equal(gitBlob,'9c762dcb8ad3549cf7175ba9413f925b11f5396c','current runtime blob must preserve the S1 registry candidate');

const screenReturn=index.indexOf('window.GensShellScreenReturnV1=Object.freeze({');
const goMenu=index.indexOf('function goMenu(){',screenReturn);
assert.ok(screenReturn>0&&goMenu>screenReturn,'Shell screen-return authority must remain in its native owner block');

assert.match(index,/const\s+gensShellModuleLaunchProvidersV1\s*=\s*Object\.create\(null\)/,
  'S1 requires a dedicated Shell module-launch provider registry');
assert.match(index,/function\s+gensRegisterModuleLaunchV1\(moduleId,handler\)/,
  'S1 requires Shell register(moduleId, handler)');
assert.match(index,/async\s+function\s+gensStartModuleSessionV1\(moduleId=gensShellActiveModuleV1\(\)\)/,
  'S1 must reuse the existing active-module resolver');
assert.match(index,/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze\(\{[\s\S]*register:gensRegisterModuleLaunchV1,[\s\S]*activeModule:gensShellActiveModuleV1,[\s\S]*startModuleSession:gensStartModuleSessionV1/,
  'S1 requires the public Shell launch registry API');

const launchPos=index.indexOf('window.GensShellModuleLaunchV1=Object.freeze({');
assert.ok(launchPos>screenReturn&&launchPos<goMenu,'S1 registry must live beside ScreenReturn inside the native Shell owner');

assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,
  'S1 must not create a second active-module resolver');

const serviceStart=index.lastIndexOf('const gensShellModuleLaunchProvidersV1',launchPos);
const registryEnd=index.indexOf('});',launchPos)+3;
assert.ok(registryEnd>launchPos&&registryEnd<goMenu,
  'S1 registry infrastructure must end before later provider registrations and goMenu');
const service=index.slice(serviceStart,registryEnd);
assert.doesNotMatch(service,/MutationObserver|setTimeout|setInterval|localStorage|sessionStorage|document\.|querySelector|addEventListener/,
  'S1 registry must be pure routing infrastructure with no DOM/storage/observer/timer authority');

assert.equal((index.match(/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze/g)||[]).length,1,
  'S1 must keep exactly one public Shell module-launch registry exposure');
assert.doesNotMatch(service,/GensShellModuleLaunchV1\.register/,
  'module provider registrations must remain outside the S1 registry infrastructure block');

const wrappers=(index.match(/window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)\s*\{/g)||[]).length;
assert.equal(wrappers,3,'S1 must track the three remaining historical startConfiguredGame globals');
assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'S1 must preserve the native Shell startConfiguredGame owner');

const expected=['captureFix138','captureFix139','gensDungeonCore01Js'];
function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
for(const id of expected){
  const body=block(id);
  assert.match(body,/window\.startConfiguredGame\s*=\s*async\s+function/,'historical start owner changed: '+id);
  if(id!=='captureFix139'){
    assert.doesNotMatch(body,/GensShellModuleLaunchV1/,'historical owner must not host module-launch provider logic: '+id);
  }
}
const capture135=block('captureFix135');
assert.doesNotMatch(capture135,/window\.startConfiguredGame\s*=(?!=)/,'Capture135 global launch owner must remain retired');
assert.match(capture135,/target135\([\s\S]*render135\(/,'Capture135 non-launch responsibilities must remain');
const core200=block('dungeonCore200Rebuild');
assert.match(core200,/const gensDungeonStartConfiguredGame200V1=async function/,'Core200 local Dungeon launch dispatcher must remain');
assert.doesNotMatch(core200,/window\.startConfiguredGame\s*=(?!=)/,'Core200 global launch assignment must remain retired');
assert.match(core200,/GensShellModuleLaunchV1\.register\("dungeon",gensDungeonStartModuleSessionV1\)/,'Core200 Dungeon provider registration must remain');

assert.match(service,/if\(typeof handler!==["']function["']\)return false/,
  'S1 must return false when a provider is not registered');
assert.match(service,/return\s+\(await handler\(\)\)===true/,
  'S1 public operation must normalize provider success to handled=true');
assert.ok((index.match(/GensShellModuleLaunchV1\.register\("dungeon"/g)||[]).length<=1,
  'later S4 may register Dungeon once; S1 must not permit duplicate Dungeon providers');

assert.match(service,/catch\(e\)\{console\.error\(["']GenSrpG Shell startModuleSession["'],id,e\);return false\}/,
  'S1 registry must contain errors at the Shell contract boundary');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S1 Shell registry',
  expected:'RED before runtime raccord, GREEN after inert registry insertion',
  preservedStartConfiguredGameWrappers:wrappers,
  registryAssignments:1
},null,2));
