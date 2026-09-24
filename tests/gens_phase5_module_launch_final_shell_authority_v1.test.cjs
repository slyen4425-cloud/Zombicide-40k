'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
const pagesWorkflow=read('.github/workflows/main.yml');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

const finalPath='assets/gensrpg/shell/module-launch-final-authority-v1.js';
const finalTag='<script src="'+finalPath+'"></script>';
const mobileTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';

assert.equal(bytes.length,8172118,
  'final Shell authority contract must run on the exact Core200-global-retired index');
assert.equal(gitBlob,'198207e3f52730498831f196caa35c4a0283e934',
  'final Shell authority contract must keep the exact reviewed Core200 retirement composition');

assert.ok(fs.existsSync(path.join(root,finalPath)),
  'final Shell authority file must exist');

const mobilePos=index.lastIndexOf(mobileTag);
const finalPos=index.lastIndexOf(finalTag);
const bodyClose=index.lastIndexOf('</body>');
assert.ok(mobilePos>0&&finalPos>mobilePos&&bodyClose>finalPos,
  'final Shell authority must load after mobile performance and before body close');
assert.equal((index.match(new RegExp(finalTag.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,
  'final Shell authority script must be loaded exactly once');
assert.equal(index.slice(finalPos+finalTag.length,bodyClose).trim(),'',
  'final Shell authority must be the last production script before body close');

const pagesPerfTuple='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const pagesFinalTuple='assets/gensrpg/shell/module-launch-final-authority-v1.js';
assert.ok(pagesWorkflow.lastIndexOf(pagesFinalTuple)>pagesWorkflow.lastIndexOf(pagesPerfTuple),
  'Pages build must inject final Shell authority after mobile performance');
assert.ok(pagesWorkflow.includes(`final_shell_tag = '<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>'`),
  'Pages build must explicitly remove/reinject the final Shell authority tag');
assert.ok(pagesWorkflow.includes('html = html.replace(final_shell_tag + "\\n", "").replace(final_shell_tag, "")'),
  'Pages build must normalize the source final Shell tag before canonical reinjection');

const src=read(finalPath);
assert.match(src,/window\.startConfiguredGame\s*=\s*async\s+function/,
  'Shell final file must own window.startConfiguredGame');
assert.match(src,/GensShellModuleLaunchV1/,
  'Shell final owner must use the public module-launch registry');
assert.match(src,/activeModule\s*\(/,
  'Shell final owner must resolve the active module through the public API');
assert.match(src,/startModuleSession\s*\(/,
  'Shell final owner must delegate through startModuleSession');
assert.doesNotMatch(src,/const\s+\w*start\w*\s*=\s*window\.startConfiguredGame|oldStart|legacyStart|\.apply\s*\(/i,
  'Shell final owner must not capture or fallback to the legacy global chain');
assert.doesNotMatch(src,/isDungeonMode|isCaptureContext|gensCapture|DungeonCore|localStorage|sessionStorage|document\.|MutationObserver|setTimeout|setInterval|addEventListener/,
  'Shell final owner must contain routing only and no module-private, DOM, storage, timer or observer authority');

assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,
  'active module resolver must remain unique');
for(const id of ['survival','capture','dungeon']){
  assert.equal((index.match(new RegExp('GensShellModuleLaunchV1\\.register\\(["\\\']'+id+'["\\\']','g'))||[]).length,1,
    id+' provider must remain registered exactly once');
}
assert.equal((index.match(/GensShellModuleLaunchV1\.register\(["']pvp["']/g)||[]).length,0,
  'PvP must remain without a runtime provider');
assert.match(index,/PVP — À VENIR/,
  'PvP placeholder must remain the product behavior');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const count=(block(id).match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,
  ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js'],
  'Core200 retirement must preserve exactly the four remaining historical owners');

assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'native Shell implementation must remain available behind the Survival provider');
assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'production HTML callsite must remain startConfiguredGame()');

for(const step of [
  'Vérifier le lancement Survie par le vrai Shell',
  'Vérifier le provider public Survival module-launch S2',
  'Verrouiller Dungeon map vers Tactical V2',
  'Vérifier le provider Dungeon module-launch S4',
  'Vérifier Save & Quit puis reprise par le vrai Shell',
  'Verrouiller Capture victoire et reprise inter-module',
  'Vérifier le provider Capture module-launch S3',
  'Vérifier le placeholder PvP par le vrai Shell',
  'Vérifier la non-interférence des quatre modules'
]){
  assert.ok(workflow.includes(step),'workflow must retain E2E parity step: '+step);
}

console.log(JSON.stringify({
  scenario:'Phase 5 final Shell startConfiguredGame authority switch',
  exactIndex:{bytes:bytes.length,gitBlob},
  ownerFile:finalPath,
  dispatch:'GensShellModuleLaunchV1.startModuleSession(GensShellModuleLaunchV1.activeModule())',
  legacyFallback:false,
  historicalOwnersRetained:chain,
  productionCallsite:'startConfiguredGame()'
},null,2));
