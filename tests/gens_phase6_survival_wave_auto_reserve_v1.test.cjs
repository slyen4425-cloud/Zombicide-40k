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

assert.equal(bytes.length,8170402,'micro-lot 4 must start from the final GREEN micro-lot 3 index');
assert.equal(blob,'2a7dae75115d83b4edc368c42453a7cb58d0bd73','micro-lot 4 must target the exact final GREEN micro-lot 3 runtime');

const entry=fs.readFileSync(entryPath,'utf8');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));

const ctx={};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

assert.ok(ctx.GensSurvivalV1?.waveRules,'Survival waveRules API must remain available');
assert.equal(
  typeof ctx.GensSurvivalV1.waveRules.autoReserve,
  'function',
  'Phase 6 micro-lot 4 requires automatic wave-reserve derivation in Survival'
);

const profile={
  levels:[
    {cards:[
      {kind:'enemy',enemy:'walker',qty:3},
      {kind:'activation',enemy:'runner',qty:1},
      {kind:'none',enemy:'fatty',qty:1}
    ]},
    {cards:[
      {kind:'enemy',enemy:'ghost',qty:2},
      {kind:'enemy',enemy:'walker',qty:7}
    ]}
  ]
};
const defaults={walker:35,runner:14,fatty:7,abomination:1,ghost:0};
const normalize=v=>JSON.parse(JSON.stringify(v));

const actual=normalize(ctx.GensSurvivalV1.waveRules.autoReserve(profile,defaults));
assert.deepEqual(actual,{
  walker:35,
  runner:14,
  fatty:0,
  abomination:0,
  ghost:1
},'automatic reserve derivation must preserve exact historical behavior');

const a=ctx.GensSurvivalV1.waveRules.autoReserve(profile,defaults);
const b=ctx.GensSurvivalV1.waveRules.autoReserve(profile,defaults);
assert.notEqual(a,b,'autoReserve must return a fresh reserve object');

assert.doesNotMatch(entry,/\bdocument\b|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener|Dungeon|Tactical|Capture|PvP/,
  'Survival wave-rules entry must remain pure and module-isolated');
assert.doesNotMatch(entry,/\bZOMBIE_TYPES\b|defaultZombieConfig\s*\(/,
  'autoReserve must receive its default reserve explicitly instead of reading gameplay globals');

assert.doesNotMatch(index,/function\s+autoReserveFromProfile\s*\(/,
  'legacy inline autoReserveFromProfile owner must be retired');

assert.equal(
  (index.match(/GensSurvivalV1\.waveRules\.autoReserve\([^\n]*defaultZombieConfig\(\)\)/g)||[]).length,
  6,
  'all six historical consumers must call Survival autoReserve with explicit default reserve data'
);

assert.ok(
  (contract.owns||[]).some(x=>/automatic wave reserve|wave reserve derivation/i.test(String(x))),
  'Survival contract must record ownership of automatic wave reserve derivation'
);

console.log(JSON.stringify({
  scenario:'Phase 6 Survival automatic wave reserve',
  expected:'RED before autoReserve extraction, GREEN after direct Survival raccord',
  legacyOwnerRetired:true,
  directConsumers:6
},null,2));
