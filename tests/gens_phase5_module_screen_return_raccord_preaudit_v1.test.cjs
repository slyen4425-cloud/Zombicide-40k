'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const exists=rel=>fs.existsSync(path.join(root,rel));
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const source=indexBuf.toString('utf8');

function gitBlob(buf){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}

assert.equal(indexBuf.length,8171576,'raccord guard must target current Dungeon S2 runtime size');
assert.equal(gitBlob(indexBuf),'12be0fdbaa5c05f7852933b48a3dd5df09da6145',
  'raccord guard current runtime blob drifted');

const shared=json('assets/gensrpg/shell/module-screen-return-contract-v1.json');
assert.equal(shared.operation,'returnToPrimaryView');
assert.deepEqual(shared.providers,['survival','dungeon','capture','pvp']);

for(const module of shared.providers){
  const contract=json('assets/gensrpg/'+module+'/module-contract-v1.json');
  assert.equal(contract.publicEntries?.moduleScreenReturn?.operation,'returnToPrimaryView',
    module+' must declare the public screen-return operation');
  assert.equal(contract.publicEntries?.moduleScreenReturn?.status,'declared-not-loaded',
    module+' screen-return must remain declaration-only in this preaudit');
}

const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const executable=shellEntry.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'').trim();
assert.equal(executable,'"use strict";','Shell Phase 3 entry must remain inert before raccord');

const phase3Test=read('tests/gens_phase3_target_structure_contracts_v1.test.cjs');
assert.ok(phase3Test.includes("assert.equal(text.includes(entry),false,entry+' must not be loaded by '+name);"),
  'Phase 3 guard must still forbid loading target entries in production');

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
assert.doesNotMatch(bootstrap,/assets\/gensrpg\/shell\/entry-v1\.js/,
  'historical RuntimeBootstrap must not already load Shell entry');
assert.doesNotMatch(bootstrap,/assets\/gensrpg\/(?:capture|dungeon|pvp)\/entry-v1\.js/,
  'historical RuntimeBootstrap must not already load module target entries');
assert.match(bootstrap,/setTimeout\(apply,250\)/);
assert.match(bootstrap,/setTimeout\(apply,1200\)/);
assert.match(bootstrap,/setTimeout\(apply,3000\)/);

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
const chain=[];
for(const block of blocks){
  if(/window\.goMenu\s*=/.test(block.body))chain.push(block.id);
}
assert.deepEqual(chain,[],
  'Dungeon S2 must leave no inline window.goMenu override');

assert.ok(exists('tests/gens_phase5_gomenu_e2e_browser_v1.test.cjs'));
assert.ok(exists('tests/gens_phase5_gomenu_survival_e2e_browser_v1.test.cjs'));
assert.ok(exists('tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'));
assert.ok(exists('tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs'));
assert.ok(exists('tests/gens_phase5_dungeon_map_combat_e2e_browser_v1.test.cjs'));

console.log(JSON.stringify({
  scenario:'Phase 5 module screen-return runtime raccord preaudit',
  runtime:{size:indexBuf.length,blob:gitBlob(indexBuf)},
  goMenuChain:chain,
  publicContract:{
    operation:shared.operation,
    providers:shared.providers,
    status:'declared-not-loaded'
  },
  rejectedRaccordPattern:{
    runtimeBootstrapV1:true,
    reason:'historical loader uses retry timers and does not load the target Shell/module entries'
  },
  runtimeChanged:true,
  nextRequirement:'preserve native Shell goMenu as the sole global return authority'
},null,2));
