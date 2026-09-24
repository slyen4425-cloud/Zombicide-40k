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

assert.equal(bytes.length,8171879,'current runtime must preserve the S1 registry candidate');
assert.equal(gitBlob,'cacee0bb95d8c046264668c1ccc721fc88bbed2d','current runtime blob must preserve the S1 registry candidate');

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
const service=index.slice(serviceStart,goMenu);
assert.doesNotMatch(service,/MutationObserver|setTimeout|setInterval|localStorage|sessionStorage|document\.|querySelector|addEventListener/,
  'S1 registry must be pure routing infrastructure with no DOM/storage/observer/timer authority');

assert.equal((index.match(/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze/g)||[]).length,1,
  'S1 must keep exactly one public Shell module-launch registry exposure');
assert.doesNotMatch(service,/GensShellModuleLaunchV1\.register/,
  'later module providers must remain outside the S1 registry infrastructure block');

const wrappers=(index.match(/window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)\s*\{/g)||[]).length;
assert.equal(wrappers,5,'S1 must preserve all five historical startConfiguredGame wrappers');
assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'S1 must preserve the native Shell startConfiguredGame owner');

const expected=['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild'];
function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
for(const id of expected){
  const body=block(id);
  assert.match(body,/window\.startConfiguredGame\s*=\s*async\s+function/,'historical start owner changed: '+id);
  assert.doesNotMatch(body,/GensShellModuleLaunchV1/,'S1 must not route a module through the new registry yet: '+id);
}

assert.match(service,/if\(typeof handler!==["']function["']\)return false/,
  'S1 must return false when a provider is not registered');
assert.match(service,/return\s+\(await handler\(\)\)===true/,
  'S1 public operation must normalize provider success to handled=true');
assert.match(service,/catch\(e\)\{console\.error\(["']GenSrpG Shell startModuleSession["'],id,e\);return false\}/,
  'S1 registry must contain errors at the Shell contract boundary');

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch S1 Shell registry',
  expected:'RED before runtime raccord, GREEN after inert registry insertion',
  preservedStartConfiguredGameWrappers:wrappers,
  registryAssignments:1
},null,2));
