'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,label+' block missing');
  return src.slice(a,b);
};

const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+indexBuf.length+'\0'),indexBuf
])).digest('hex');
assert.equal(indexBuf.length,8165823,'Phase 8 exit audit must target the exact current runtime');
assert.equal(gitBlob,'26421e0347305437fe2b1dc149b3e4fb8b3761bd',
  'Phase 8 exit audit runtime blob drifted');

const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
assert.match(roadmap,/## Phase 8 — Consolider Tactical[\s\S]*Critère de sortie : Tactical n.existe que pendant une session de combat et se démonte proprement\./,
  'Phase 8 official exit criterion must remain explicit');
assert.match(roadmap,/## Phase 9 — Séparer Monster Capture/,
  'Phase 9 must remain the next roadmap phase');

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
assert.match(bootstrap,/const files=\[\s*"assets\/gensrpg\/tactical\/entry-v1\.js",?\s*\]/,
  'Runtime bootstrap must load only the Tactical public entry');
assert.doesNotMatch(bootstrap,/gens-rpg-tactical-combat-v2-(?:bridge|adapter|rules|integration|ui)\.js/,
  'Runtime bootstrap must not eager-load the private Tactical stack');

const entry=read('assets/gensrpg/tactical/entry-v1.js');
const entryApi=block(entry,'R.GensTacticalV1=Object.freeze({','});\ninstall();','entry API');
assert.match(entry,/function install\(\)[\s\S]*loadFacade\(\)/,'bootstrap install must remain facade-only');
assert.match(entryApi,/\bactivate\b/);
assert.match(entryApi,/\bdeactivate\b/);
assert.match(entryApi,/dispose:deactivate/);
assert.match(entry,/active=false/);
assert.match(entry,/__gensTacticalV2Loader105=false/);

const counts={chainActivate:0,chainDeactivate:0,bridgeInstall:0,bridgeDispose:0,uiInstall:0,uiDispose:0};
let appended=0;
const sandbox={console};
sandbox.document={
  head:{appendChild(){appended++;throw new Error('warm lifecycle audit must not reload scripts')}},
  createElement(){return {src:'',async:false,onload:null,onerror:null}}
};
sandbox.GensRpgTacticalCombatV2={};
sandbox.GensRpgTacticalCombatV2Adapter={};
sandbox.GensRpgTacticalCombatV2Rules={};
sandbox.GensRpgTacticalCombatV2Ui={
  installGlobalPolish(){counts.uiInstall++;return true},
  dispose(){counts.uiDispose++;return true}
};
sandbox.GensRpgTacticalCombatV2Bridge={
  install(){counts.bridgeInstall++;return true},
  dispose(){counts.bridgeDispose++;return true}
};
sandbox.GensRpgTacticalCompatibilityChainPhase8={
  activate(){
    counts.chainActivate++;
    sandbox.GensTacticalV1.compatibilityReady(true);
    return true;
  },
  deactivate(){counts.chainDeactivate++;return true}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'tactical/entry-v1.js'});

assert.equal(sandbox.GensTacticalV1.status().active,false,'Tactical must be cold before a session');
let ready1=0;
assert.equal(sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);ready1++}),true);
assert.equal(ready1,1);
assert.equal(sandbox.GensTacticalV1.status().active,true,'first session must activate Tactical');
assert.deepEqual(
  {chain:counts.chainActivate,bridge:counts.bridgeInstall,ui:counts.uiInstall},
  {chain:1,bridge:1,ui:1},
  'first session must install exactly one owned stack'
);

assert.equal(sandbox.GensTacticalV1.deactivate(),true);
const cold=sandbox.GensTacticalV1.status();
assert.equal(cold.active,false);
assert.equal(cold.activating,false);
assert.equal(cold.baseReady,false);
assert.equal(cold.compatibilityDone,false);
assert.equal(cold.bridgeInstalled,false);
assert.equal(sandbox.__gensTacticalV2Loader105,false,'teardown must restore the cold loader guard');
assert.deepEqual(
  {chain:counts.chainDeactivate,bridge:counts.bridgeDispose,ui:counts.uiDispose},
  {chain:1,bridge:1,ui:1},
  'teardown must dispose every top-level owner exactly once'
);

let ready2=0;
assert.equal(sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);ready2++}),true);
assert.equal(ready2,1);
assert.equal(sandbox.GensTacticalV1.status().active,true,'second session must reactivate cleanly');
assert.deepEqual(
  {chain:counts.chainActivate,bridge:counts.bridgeInstall,ui:counts.uiInstall},
  {chain:2,bridge:2,ui:2},
  'second session must reinstall exactly one stack'
);
assert.equal(appended,0,'warm reactivation must reuse loaded APIs instead of duplicating scripts');
sandbox.GensTacticalV1.deactivate();

const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const closeFn=block(ui,'function close(apply=false){','function onClick','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove/);
assert.match(closeFn,/battle=null/);
assert.match(closeFn,/GensTacticalV1\?\.deactivate\?\.\(\)/,
  'UI.close must signal teardown to the lifecycle owner');
assert.match(ui,/function dispose\(/,'base UI must expose teardown');

const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
assert.match(integration,/function deactivateCompatibilityChain\(/);
assert.match(integration,/compatibilityStarted=false/);
const order=[
  'GensRpgTacticalVisualDice16781142',
  'GensRpgTacticalRuntimeAuthority1678113',
  'GensRpgTacticalCombatCoherence1678112',
  'GensRpgTacticalRuntimeFixes1678111',
  'GensRpgTacticalStats1678110',
  'GensRpgTacticalPolish1678109',
  'GensRpgTacticalPolish1678108'
];
let previous=-1;
for(const name of order){
  const pos=integration.indexOf(name,integration.indexOf('function deactivateCompatibilityChain'));
  assert.ok(pos>previous,'compatibility teardown order drifted at '+name);
  previous=pos;
}

const layers=[
  ['V108','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'],
  ['V109','assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js'],
  ['V110','assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js'],
  ['V111','assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js'],
  ['V112','assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js'],
  ['V113','assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js'],
  ['V114.11','assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js']
];
for(const [label,file] of layers){
  const src=read(file);
  assert.match(src,/function installWithRetries\(rt=R\)/,label+' session install seam missing');
  assert.match(src,/function dispose\(rt=R\)/,label+' session teardown missing');
  assert.match(src,/clearTimeout/,label+' pending retries must be cancellable');
}
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
assert.match(v113,/removeEventListener\("click",onBoard,false\)/);
assert.match(v113,/removeEventListener\("pointerup",onBoard,false\)/);
const v114=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
assert.match(v114,/removeEventListener\("click",menuHandler,true\)/);

const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/);
assert.match(bridge,/pending:true,reason:"tactical-activating"/);
assert.match(bridge,/function dispose\(rt=R\)/);

const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
assert.ok(dungeonContract.owns.includes('combat trigger'));
assert.ok(dungeonContract.forbidden.includes('Tactical combat resolution'));

const backlog=read('docs/GENSRPG_PHASE8_BACKLOG.md');
assert.match(backlog,/scripts\/API Tactical déjà chargés après une session/);
assert.match(backlog,/leur présence seule n'est pas une autorité active/i);

const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
for(const required of [
  'gens_phase8_tactical_first_request_activation_v1.test.cjs',
  'gens_phase8_tactical_session_teardown_ownership_v1.test.cjs',
  'gens_phase8_exit_preaudit_v1.test.cjs',
  'gens_phase8_exit_audit_v1.test.cjs'
]){
  assert.ok(workflow.includes(required),'Phase 8 exit guard must remain wired: '+required);
}

console.log(JSON.stringify({
  scenario:'Phase 8 official exit audit',
  runtime:{bytes:indexBuf.length,gitBlob},
  criterion:'Tactical authority is session-scoped and fully teardown-capable',
  lifecycle:{
    facadeOnlyBeforeCombat:true,
    firstActivation:true,
    teardownToCold:true,
    secondActivationClean:true,
    duplicateScriptLoad:false,
    reverseCompatibilityDispose:true,
    pendingRetryCancellation:true,
    documentListenerRemoval:true
  },
  boundary:{dungeonOwnsCombatTrigger:true,bridgeIsPublicBoundary:true},
  runtimeChangeRequired:false,
  phase8ExitReady:true,
  nextPhase:'Phase 9 — Monster Capture'
},null,2));
