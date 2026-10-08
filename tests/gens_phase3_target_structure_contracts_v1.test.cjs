const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));

const domains=['core','shell','survival','dungeon','tactical','capture','pvp','builders'];
const composition={
  index:read('index.html'),
  preview:read('preview.html'),
  pages:read('.github/workflows/main.yml'),
  bootstrap:read('assets/gensrpg/core/runtime-bootstrap-v1.js')
};

for(const domain of domains){
  const dir='assets/gensrpg/'+domain;
  const entry=dir+'/entry-v1.js';
  const contractPath=dir+'/module-contract-v1.json';
  assert.equal(exists(entry),true,entry+' missing');
  assert.equal(exists(contractPath),true,contractPath+' missing');

  const source=read(entry);
  const contract=JSON.parse(read(contractPath));

  assert.equal(contract.version,1,domain+' contract version');
  assert.equal(contract.phase,3,domain+' contract phase');
  assert.equal(contract.module,domain,domain+' contract module');
  assert.equal(contract.plannedEntry,entry,domain+' planned entry');
  assert.ok(Array.isArray(contract.owns)&&contract.owns.length,domain+' must declare ownership');
  assert.ok(Array.isArray(contract.consumes),domain+' consumes must be explicit');
  assert.ok(Array.isArray(contract.forbidden)&&contract.forbidden.length,domain+' forbidden boundary must be explicit');
  assert.ok(Array.isArray(contract.invariants)&&contract.invariants.length>=3,domain+' invariants missing');

  if(domain==='survival'||domain==='dungeon'||domain==='tactical'||domain==='capture'){
    const phase=domain==='survival'?6:domain==='dungeon'?7:domain==='tactical'?8:9;
    const api=domain==='survival'?'GensSurvivalV1':domain==='dungeon'?'GensDungeonV1':domain==='tactical'?'GensTacticalV1':'GensCaptureV1';
    assert.equal(contract.status,'partial-runtime-loaded',domain+' contract status');
    assert.equal(contract.activatedPhase,phase,domain+' activation phase');
    assert.equal(contract.publicRuntimeApi,api,domain+' public runtime API');

    if(domain==='survival'){
      assert.match(source,/GensSurvivalV1/,'Survival entry must expose its Phase 6 namespace');
      assert.doesNotMatch(source,/\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|\bDungeon\b|\bTactical\b|\bCapture\b|\bPvP\b/,
        'first active Survival slice must stay pure and isolated');
      assert.equal(composition.index.includes(entry),true,'survival entry must be directly loaded by source index in Phase 6');
      for(const name of ['preview','pages','bootstrap'])assert.equal(composition[name].includes(entry),false,'survival source entry must not be redundantly injected by '+name);
    }else if(domain==='dungeon'){
      assert.match(source,/function planGeneratedAdvance\(/,'Dungeon entry must expose its first pure Phase 7 exploration slice');
      assert.match(source,/root\.GensDungeonV1=Object\.freeze\(/,'Dungeon entry must publish only GensDungeonV1');
      assert.doesNotMatch(source,/returnToPrimaryView|GensShellScreenReturnV1|startConfiguredGame|\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|\bTactical\b|\bCapture\b|\bSurvival\b|\bPvP\b/,
        'first active Dungeon slice must stay pure and isolated from Shell routing and other modules');
      assert.equal(composition.index.includes(entry),true,'dungeon entry must be directly loaded by source index in Phase 7');
      for(const name of ['preview','pages','bootstrap'])assert.equal(composition[name].includes(entry),false,'dungeon source entry must not be redundantly injected by '+name);
    }else if(domain==='tactical'){
      assert.match(source,/R\.GensTacticalV1=Object\.freeze\(/,'Tactical entry must expose GensTacticalV1 in Phase 8');
      assert.equal(composition.bootstrap.includes(entry),true,'Tactical public entry must be loaded only through Core RuntimeBootstrap in Phase 8');
      for(const name of ['index','preview','pages'])assert.equal(composition[name].includes(entry),false,'Tactical entry must not be redundantly loaded by '+name);
    }else{
      assert.match(source,/root\.GensCaptureV1=Object\.freeze\(/,'Capture entry must expose GensCaptureV1 in Phase 9');
      assert.match(source,/function install\(owner\)/,'Capture entry must expose the explicit session-start owner binding boundary');
      assert.match(source,/function startModuleSession\(\)/,'Capture entry must own the public module-launch provider');
      assert.doesNotMatch(source,/\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
        'Capture public entry must stay isolated from DOM storage and private module runtimes');
      const sessionStart='assets/gensrpg/capture/session-start-v1.js';
      assert.equal(exists(sessionStart),true,'Capture session-start owner must exist in the active Phase 9 structure');
      assert.equal(composition.index.includes(sessionStart),true,'Capture session-start owner must be directly loaded by source index in Phase 9');
      assert.equal(composition.index.includes(entry),true,'capture entry must be directly loaded by source index in Phase 9');
      assert.ok(composition.index.indexOf(entry)<composition.index.indexOf(sessionStart),
        'public Capture entry must load before its session-start owner');
      const screenReturn='assets/gensrpg/capture/screen-return-v1.js';
      assert.equal(exists(screenReturn),true,'Capture screen-return owner must exist');
      assert.equal(composition.index.split(screenReturn).length-1,1,'Capture screen-return owner must be loaded exactly once');
      assert.ok(composition.index.indexOf(sessionStart)<composition.index.indexOf(screenReturn),'Capture screen-return must load after session-start');
      assert.ok(composition.index.indexOf(screenReturn)<composition.index.indexOf('id="captureFix139"'),'Capture screen-return owner must load before historical dependency injection');
      for(const name of ['preview','pages','bootstrap'])assert.equal(composition[name].includes(screenReturn),false,'Capture screen-return owner must not be doubly injected');
      assert.ok(composition.index.indexOf(sessionStart)<composition.index.indexOf('id="captureFix139"'),
        'Capture session-start owner must load before Capture139 performs explicit dependency wiring');
      for(const name of ['preview','pages','bootstrap']){
        assert.equal(composition[name].includes(sessionStart),false,'Capture session-start owner must not be redundantly injected by '+name);
        assert.equal(composition[name].includes(entry),false,'capture source entry must not be redundantly injected by '+name);
      }
    }
    assert.equal(composition.index.includes(contractPath),false,domain+' contract metadata must not be runtime-loaded');
    continue;
  }

  assert.equal(contract.status,'contract-only-not-loaded',domain+' contract status');
  const forbidden=/\b(?:window|globalThis|document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|fetch|XMLHttpRequest|navigator|location)\b|\bnew\s+Worker\b|\.install\s*\(|\bimport\s*\(/;
  assert.doesNotMatch(source,forbidden,entry+' must remain inert');
  const executable=source
    .replace(/\/\*[\s\S]*?\*\//g,'')
    .replace(/\/\/.*$/gm,'')
    .trim();
  assert.equal(executable,'"use strict";',entry+' must contain no Phase 3 runtime implementation');

  for(const [name,text] of Object.entries(composition)){
    assert.equal(text.includes(entry),false,entry+' must not be loaded by '+name);
    assert.equal(text.includes(contractPath),false,contractPath+' must not be loaded by '+name);
  }
}

const ownerManifest=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
assert.equal(Object.keys(ownerManifest.files||{}).length,85,
  'Phase 3 scaffolding remains inert; Phase 9 registers two Capture auxiliary runtime owners (session start and screen return)');
assert.deepEqual(ownerManifest.files?.['assets/gensrpg/capture/session-start-v1.js'],{
  owner:'GenSrpG Capture Session Start',
  domain:'capture',
  role:'active Phase 9 owner of Capture session initialization through explicit injected bindings; owns no Shell routing or screen-return authority'
},'Capture session-start owner manifest contract drifted');
assert.deepEqual(ownerManifest.files?.['assets/gensrpg/capture/screen-return-v1.js'],{
  owner:'GenSrpG Capture Screen Return',
  domain:'capture',
  role:'active Phase 9 unique Shell screen-return provider for Capture using explicitly injected Capture-owned session/context and Hub rendering bindings'
},'Capture screen-return manifest contract drifted');
for(const rel of Object.keys(ownerManifest.files||{}))assert.equal(exists(rel),true,'existing production owner disappeared: '+rel);

assert.equal(exists('assets/gensrpg/core/runtime-bootstrap-v1.js'),true,'existing Core bootstrap must remain untouched');
assert.equal(exists('assets/gensrpg/dungeon/progression-runtime-v1.js'),true,'existing non-production Dungeon progression file must remain present');

console.log(JSON.stringify({
  scenario:'Phase 3 inert target structure contracts',
  domains:domains.length,
  entrypoints:domains.length,
  contracts:domains.length,
  productionOwnerGraph:85,
  loadedEntrySlices:4,
  captureAuxiliaryRuntimeOwners:2
},null,2));
