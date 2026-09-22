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
  assert.equal(contract.status,'contract-only-not-loaded',domain+' contract status');
  assert.equal(contract.plannedEntry,entry,domain+' planned entry');
  assert.ok(Array.isArray(contract.owns)&&contract.owns.length,domain+' must declare ownership');
  assert.ok(Array.isArray(contract.consumes),domain+' consumes must be explicit');
  assert.ok(Array.isArray(contract.forbidden)&&contract.forbidden.length,domain+' forbidden boundary must be explicit');
  assert.ok(Array.isArray(contract.invariants)&&contract.invariants.length>=3,domain+' invariants missing');

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
assert.equal(Object.keys(ownerManifest.files||{}).length,78,'Phase 3 scaffolding must remain inert while the current Phase 4 production owner graph contains 78 files');
for(const rel of Object.keys(ownerManifest.files||{}))assert.equal(exists(rel),true,'existing production owner disappeared: '+rel);

assert.equal(exists('assets/gensrpg/core/runtime-bootstrap-v1.js'),true,'existing Core bootstrap must remain untouched');
assert.equal(exists('assets/gensrpg/dungeon/progression-runtime-v1.js'),true,'existing non-production Dungeon progression file must remain present');

console.log(JSON.stringify({
  scenario:'Phase 3 inert target structure contracts',
  domains:domains.length,
  entrypoints:domains.length,
  contracts:domains.length,
  productionOwnerGraph:78,
  loadedByProduction:0
},null,2));
