'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const indexPath=path.join(root,'index.html');
const entryPath=path.join(root,'assets/gensrpg/survival/entry-v1.js');
const contractPath=path.join(root,'assets/gensrpg/survival/module-contract-v1.json');

const bytes=fs.readFileSync(indexPath);
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8170815,'base-reserve lot must start from the exact GREEN Survival skill-library runtime size');
assert.equal(blob,'9c762dcb8ad3549cf7175ba9413f925b11f5396c','base-reserve lot must target the exact GREEN Survival skill-library runtime');

const entry=fs.readFileSync(entryPath,'utf8');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

assert.ok(ctx.GensSurvivalV1?.waveRules,'Survival waveRules API must remain available');
assert.equal(
  typeof ctx.GensSurvivalV1.waveRules.zombicideBaseReserve,
  'function',
  'Phase 6 requires Zombicide base-reserve derivation in Survival'
);

const defaults={walker:35,runner:14,fatty:7,abomination:1,custom:4};
const normalize=v=>JSON.parse(JSON.stringify(v));
const a=ctx.GensSurvivalV1.waveRules.zombicideBaseReserve(defaults);
const b=ctx.GensSurvivalV1.waveRules.zombicideBaseReserve(defaults);

assert.deepEqual(normalize(a),defaults,'base reserve must preserve all provided default quantities exactly');
assert.notEqual(a,defaults,'base reserve must not reuse the source object');
assert.notEqual(a,b,'base reserve must return a fresh object on every call');
a.walker=999;
assert.equal(defaults.walker,35,'mutating the returned reserve must not mutate the provided defaults');

for(const token of ['document','localStorage','sessionStorage','MutationObserver','setTimeout','setInterval','addEventListener','Dungeon','Tactical','Capture','PvP']){
  assert.equal(entry.includes(token),false,'Survival wave-rules entry must remain pure/module-isolated; forbidden token: '+token);
}
assert.equal(entry.includes('defaultZombieConfig('),false,
  'zombicideBaseReserve must receive default reserve data explicitly instead of reading gameplay globals');

assert.equal(index.includes('function zombicideBaseReserve('),false,
  'legacy inline zombicideBaseReserve owner must be retired');

const direct='GensSurvivalV1.waveRules.zombicideBaseReserve(defaultZombieConfig())';
assert.equal(
  index.split(direct).length-1,
  3,
  'all three historical Zombicide base-reserve consumers must call the Survival API directly'
);

assert.ok(
  (contract.owns||[]).some(x=>/Zombicide base reserve/i.test(String(x))),
  'Survival contract must record ownership of Zombicide base reserve derivation'
);

console.log(JSON.stringify({
  scenario:'Phase 6 Survival Zombicide base reserve',
  expected:'RED before extraction, GREEN after direct Survival raccord',
  legacyOwnerRetired:true,
  directConsumers:3
},null,2));
