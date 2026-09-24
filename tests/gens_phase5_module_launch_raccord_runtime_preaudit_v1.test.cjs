'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const preview=read('preview.html');
const deploy=read('.github/workflows/main.yml');
const launchContract=JSON.parse(read('assets/gensrpg/shell/module-launch-contract-v1.json'));
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));

const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8172742,'module-launch preaudit guard must track the current S1 runtime');
assert.equal(gitBlob,'95f8c96e7e221eb743f7c8013ffa8af499eca1c8','preaudit runtime blob must match the user-supplied checkpoint file');

assert.match(index,/function\s+gensShellActiveModuleV1\(\)\s*\{/,'Shell must already own one active-module resolver');
assert.match(index,/window\.GensShellScreenReturnV1\s*=\s*Object\.freeze\(\{[\s\S]*activeModule:gensShellActiveModuleV1/,'screen-return must expose the existing active-module resolver');
assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,'do not introduce a second active-module resolver');

assert.equal(launchContract.contract,'module-launch');
assert.equal(launchContract.operation,'startModuleSession');
assert.deepEqual(launchContract.providers,['survival','dungeon','capture','pvp']);
assert.ok(shellContract.consumes.includes('module launch contract'));

assert.match(index,/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze\(\{/,
  'S1 Shell module-launch registry must now be present while the preaudit invariants remain protected');
assert.doesNotMatch(preview,/assets\/gensrpg\/shell\/entry-v1\.js/,'Shell Phase 3 entry must remain outside preview load graph during preaudit');
assert.doesNotMatch(deploy,/assets\/gensrpg\/shell\/entry-v1\.js/,'Shell Phase 3 entry must remain outside Pages load graph during preaudit');

const native=(index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length;
const wrappers=(index.match(/window\.startConfiguredGame\s*=\s*async\s+function\s*\(\)\s*\{/g)||[]).length;
assert.equal(native,1,'Shell native startConfiguredGame owner must remain present');
assert.equal(wrappers,5,'preaudit must preserve the five historical module wrappers');

function scriptBody(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const chain=['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild'];
for(const id of chain){
  assert.match(scriptBody(id),/window\.startConfiguredGame\s*=\s*async\s+function/,'missing startConfiguredGame owner '+id);
}

assert.match(scriptBody('captureFix135'),/gensCapturePregameMode[\s\S]*saveCaptureWorldState/,'Capture135 reset semantics must remain');
assert.match(scriptBody('captureFix138'),/isCaptureContext138[\s\S]*renderCaptureWorldHub[\s\S]*setTimeout/,'Capture138 post-launch UI semantics must remain');
assert.match(scriptBody('captureFix139'),/if\(!isCaptureContext138\(\)\)return await start139\.apply[\s\S]*normalizeGameParticipants[\s\S]*captureEnterWorld139/,'Capture139 remains the dedicated Capture launch path');
assert.match(scriptBody('gensDungeonCore01Js'),/if\(eligible\(\)\)return start\(\)/,'Dungeon Core01 remains a real Dungeon launch owner');
assert.match(scriptBody('dungeonCore200Rebuild'),/isDungeonMode[\s\S]*isCaptureContext138[\s\S]*return start\(\)/,'Dungeon Core200 remains the final Dungeon launch owner');

assert.match(index,/Le moteur PvP n’est pas encore construit\./,'PvP must remain a placeholder');
assert.match(index,/PVP — À VENIR/,'PvP must not receive a runtime launch provider yet');

const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
assert.doesNotMatch(shellEntry,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,'Shell entry must remain inert in this preaudit');

const selectedSequence={
  s1:'add Shell-owned GensShellModuleLaunchV1 registry beside GensShellScreenReturnV1; reuse gensShellActiveModuleV1; do not call it from startConfiguredGame',
  s2:'register Survival provider against the proven native Shell launch path without changing production routing',
  s3:'register Capture provider from Capture-owned launch logic without deleting captureFix135/138/139',
  s4:'register Dungeon provider from the final Dungeon-owned start path without deleting Dungeon global owners',
  pvp:'no provider while PvP remains a placeholder',
  finalAuthority:'only after provider parity on real E2E paths may Shell become the final startConfiguredGame owner',
  retirements:'remove historical global owners one at a time with dedicated RED/GREEN proof; never from static shadowing alone'
};

console.log(JSON.stringify({
  scenario:'Phase 5 module-launch runtime raccord preaudit',
  exactRuntime:{bytes:bytes.length,gitBlob},
  activeModuleAuthority:'gensShellActiveModuleV1 / GensShellScreenReturnV1.activeModule',
  startConfiguredGame:{nativeOwners:native,wrapperOwners:wrappers,chain},
  selectedSequence,
  runtimeChanged:false
},null,2));
