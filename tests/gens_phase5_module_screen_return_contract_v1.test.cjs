'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const exists=rel=>fs.existsSync(path.join(root,rel));
const runtime=fs.readFileSync(path.join(root,'index.html'));

function gitBlob(buf){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}

assert.equal(runtime.length,8170815,'contract-only lot must keep the manually validated runtime size');
assert.equal(gitBlob(runtime),'9c762dcb8ad3549cf7175ba9413f925b11f5396c',
  'contract-only lot must keep index.html byte-identical');

const sharedPath='assets/gensrpg/shell/module-screen-return-contract-v1.json';
assert.equal(exists(sharedPath),true,'shared module screen-return contract is missing');
const shared=json(sharedPath);

assert.equal(shared.version,1);
assert.equal(shared.phase,5);
assert.equal(shared.contract,'module-screen-return');
assert.equal(shared.owner,'shell');
assert.equal(shared.operation,'returnToPrimaryView');
assert.deepEqual(shared.providers,['survival','dungeon','capture','pvp']);
assert.deepEqual(shared.arguments,[],'Shell must not pass module-private routing data');
assert.equal(shared.returns,'handled:boolean');
assert.ok(Array.isArray(shared.invariants)&&shared.invariants.length>=5);
assert.ok(shared.invariants.some(x=>/public active module/i.test(x)),
  'Shell selection must depend only on public active-module routing state');
assert.ok(shared.invariants.some(x=>/module decides/i.test(x)),
  'module must decide its own primary view');
assert.ok(shared.invariants.some(x=>/no DOM/i.test(x)),
  'contract must forbid DOM ownership leakage');
assert.ok(shared.invariants.some(x=>/no private runtime state/i.test(x)),
  'contract must forbid private runtime-state leakage');
assert.ok(shared.invariants.some(x=>/no gameplay/i.test(x)),
  'contract must forbid gameplay migration');

const modules=['survival','dungeon','capture','pvp'];
for(const module of modules){
  const contractPath='assets/gensrpg/'+module+'/module-contract-v1.json';
  const entryPath='assets/gensrpg/'+module+'/entry-v1.js';
  const contract=json(contractPath);
  const entry=read(entryPath);

  const expectedStatus=module==='survival'?'partial-runtime-loaded':'contract-only-not-loaded';
  assert.equal(contract.status,expectedStatus,
    module+(module==='survival'?' may activate only its Phase 6 wave-rules slice':' must remain contract-only'));
  assert.ok(contract.publicEntries&&contract.publicEntries.moduleScreenReturn,
    module+' must declare moduleScreenReturn');
  assert.deepEqual(contract.publicEntries.moduleScreenReturn,{
    contract:sharedPath,
    operation:'returnToPrimaryView',
    status:'declared-not-loaded',
    ownership:'module-owned-primary-view'
  },module+' screen-return declaration drifted');

  const executable=entry
    .replace(/\/\*[\s\S]*?\*\//g,'')
    .replace(/\/\/.*$/gm,'')
    .trim();
  if(module==='survival'){
    assert.equal(contract.publicRuntimeApi,'GensSurvivalV1',
      'Phase 6 Survival entry must expose only its declared public runtime namespace');
    assert.match(entry,/GensSurvivalV1/,'Phase 6 Survival wave-rules entry must remain active');
    assert.doesNotMatch(entry,/returnToPrimaryView|GensShellScreenReturnV1|moduleScreenReturn/,
      'activating Survival wave rules must not implement or take ownership of screen return');
    assert.doesNotMatch(entry,/document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|Dungeon|Tactical|Capture|PvP/,
      'active Survival wave-rules slice must stay pure and isolated');
  }else{
    assert.equal(executable,'"use strict";',module+' Phase 3 entry must remain inert');
    assert.doesNotMatch(entry,/window\.|globalThis|document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener/,
      module+' entry must not gain runtime side effects in the contract-only lot');
  }
}

const tactical=json('assets/gensrpg/tactical/module-contract-v1.json');
assert.equal(tactical.publicEntries?.moduleScreenReturn,undefined,
  'Tactical must stay outside general module screen-return routing');

const shell=json('assets/gensrpg/shell/module-contract-v1.json');
assert.ok(shell.consumes.includes('module public entry contracts'));
assert.ok(shell.consumes.includes('module screen-return contract'),
  'Shell must explicitly consume the new public screen-return contract');

console.log(JSON.stringify({
  scenario:'Phase 5 pure module screen-return contract',
  runtime:{size:runtime.length,blob:gitBlob(runtime)},
  sharedContract:sharedPath,
  operation:shared.operation,
  providers:shared.providers,
  runtimeChanged:false
},null,2));
