'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

const allowedExactRuntimes=new Map([
  [8172529,'696014056409dda9b6ef25ace58dfd9d5f9e2718'],
  [8170150,'ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9'],
  [8170350,'e513d23c7a8c7aef9a187202bbcc34ab540e856f']
]);
assert.equal(allowedExactRuntimes.get(bytes.length),gitBlob,
  'final Shell authority preaudit must remain on either exact S4 or the exact final-authority index composition');

assert.equal((index.match(/function\s+gensShellActiveModuleV1\s*\(/g)||[]).length,1,
  'Shell must keep one active-module resolver');
assert.match(index,/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze\(\{/,
  'public module-launch registry must remain loaded');

for(const id of ['survival','capture','dungeon']){
  assert.equal(
    (index.match(new RegExp('GensShellModuleLaunchV1\\.register\\(["\\\']'+id+'["\\\']','g'))||[]).length,
    1,
    id+' provider must remain registered exactly once before Shell authority switch'
  );
}
assert.equal((index.match(/GensShellModuleLaunchV1\.register\(["']pvp["']/g)||[]).length,0,
  'PvP must remain without runtime provider while it is a placeholder');

assert.match(index,/Le moteur PvP n’est pas encore construit\./,
  'PvP placeholder explanation must remain');
assert.match(index,/PVP — À VENIR/,
  'PvP placeholder card must remain');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return {body:m[1],start:m.index};
}

const chain=[];
for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js','dungeonCore200Rebuild']){
  const body=block(id).body;
  const count=(body.match(/window\.startConfiguredGame\s*=(?!=)/g)||[]).length;
  for(let i=0;i<count;i++)chain.push(id);
}
assert.deepEqual(chain,
  ['captureFix138','captureFix139','gensDungeonCore01Js'],
  'preaudit must track the three remaining historical global launch owners after captureFix135 retirement');
assert.doesNotMatch(block('captureFix135').body,/window\.startConfiguredGame\s*=(?!=)/,
  'captureFix135 global launch owner must remain retired');

assert.equal((index.match(/async\s+function\s+startConfiguredGame\s*\(\)\s*\{/g)||[]).length,1,
  'native Shell launch implementation must remain present for the Survival provider');
assert.match(index,/onclick=["']startConfiguredGame\(\)["']/,
  'production launch callsite must remain on startConfiguredGame');
assert.equal((index.match(/GensShellModuleLaunchV1\.startModuleSession\(/g)||[]).length,0,
  'production markup/runtime must not directly call the registry before final authority switch');

for(const p of [
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
]){
  const src=read(p);
  assert.doesNotMatch(src,/startConfiguredGame|GensShellModuleLaunchV1/,
    p+' must not silently take launch authority after Core200');
}

const mobileTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';
const finalPath='assets/gensrpg/shell/module-launch-final-authority-v1.js';
const finalTag='<script src="'+finalPath+'"></script>';
const bodyClose=index.lastIndexOf('</body>');
const mobilePos=index.lastIndexOf(mobileTag);
const finalPos=index.lastIndexOf(finalTag);
const finalExists=fs.existsSync(path.join(root,finalPath));

assert.ok(mobilePos>0&&bodyClose>mobilePos,'mobile performance script must remain at the current tail');
assert.equal(finalExists,finalPos>=0,
  'future final Shell authority file and load-graph entry must appear together');

if(!finalExists){
  assert.equal(index.slice(mobilePos+mobileTag.length,bodyClose).trim(),'',
    'before the switch, no later script may exist after the current tail');
}else{
  assert.ok(finalPos>mobilePos&&bodyClose>finalPos,
    'final Shell authority must load after every current runtime script');
  assert.equal(index.slice(finalPos+finalTag.length,bodyClose).trim(),'',
    'final Shell authority must remain the last production script before body close');

  const src=read(finalPath);
  assert.match(src,/window\.startConfiguredGame\s*=\s*async\s+function/,
    'future Shell file must own the final global startConfiguredGame');
  assert.match(src,/GensShellModuleLaunchV1/,
    'future Shell owner must delegate only through the public launch service');
  assert.match(src,/activeModule/,
    'future Shell owner must use the public active-module resolver');
  assert.match(src,/startModuleSession/,
    'future Shell owner must invoke the public module-launch operation');
  assert.doesNotMatch(src,/const\s+\w*start\w*\s*=\s*window\.startConfiguredGame|oldStart|legacyStart|\.apply\(this,arguments\)/i,
    'final Shell owner must not capture or fallback to the legacy global chain');
  assert.doesNotMatch(src,/isDungeonMode|isCaptureContext|gensCapture|DungeonCore|localStorage|sessionStorage|document\.|MutationObserver|setTimeout|setInterval|addEventListener/,
    'final Shell owner must contain routing only and no module-private or DOM/storage authority');
}

for(const p of [
  'tests/gens_survival_shell_launch_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s2_survival_provider_browser_v1.test.cjs',
  'tests/gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs',
  'tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/dungeon_event_ambush_position_v167878.test.cjs',
  'tests/gens_core209_detection_direct_bridge_lot4e.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs',
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s3_capture_provider_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_pvp_placeholder_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_object_config_editor_browser_v11411.test.cjs',
  'tests/gens_phase5_openchar_core028_browser_characterization_v1.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,p)),'missing parity proof '+p);
}

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
  scenario:'Phase 5 final Shell startConfiguredGame authority preaudit',
  exactRuntime:{bytes:bytes.length,gitBlob},
  providers:{survival:1,capture:1,dungeon:1,pvp:0},
  historicalChain:chain,
  productionCallsite:'startConfiguredGame() remains unchanged',
  selectedSeam:{
    ownerFile:finalPath,
    loadPosition:'last production script before </body>, after mobile performance',
    dispatch:'GensShellModuleLaunchV1.startModuleSession(GensShellModuleLaunchV1.activeModule())',
    legacyFallback:false,
    retirementInSameLot:false
  },
  runtimeChanged:false
},null,2));
