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

assert.equal(bytes.length,8170143,'micro-lot 5 must target the current Phase 7 Dungeon room-kind runtime size');
assert.equal(blob,'23b4f59009c5e51fdb91e9bfe3fd87d2a79bba3d','micro-lot 5 must target the current Phase 7 room-kind runtime baseline');

const entry=fs.readFileSync(entryPath,'utf8');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));

const ctx={};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

assert.ok(ctx.GensSurvivalV1?.waveRules,'Survival waveRules API must remain available');
assert.equal(
  typeof ctx.GensSurvivalV1.waveRules.normalizeReserve,
  'function',
  'Phase 6 micro-lot 5 requires wave-reserve normalization in Survival'
);

const normalize=v=>JSON.parse(JSON.stringify(v));
const defaults={walker:35,runner:14,fatty:7,abomination:1,ghost:0};
const profile={
  levels:[
    {cards:[
      {kind:'enemy',enemy:'walker',qty:2},
      {kind:'enemy',enemy:'walker',qty:5},
      {kind:'activation',enemy:'runner',qty:7},
      {kind:'none',enemy:'abomination',qty:9}
    ]},
    {cards:[
      {kind:'enemy',enemy:'fatty',qty:4},
      {kind:'double',enemy:'ghost',qty:12}
    ]}
  ]
};

assert.deepEqual(
  normalize(ctx.GensSurvivalV1.waveRules.normalizeReserve(
    profile,
    {walker:0,runner:2,fatty:'bad',ghost:9},
    defaults
  )),
  {walker:5,runner:2,fatty:4,abomination:1,ghost:9},
  'reserve normalization must preserve exact historical zero/invalid repair behavior'
);

assert.deepEqual(
  normalize(ctx.GensSurvivalV1.waveRules.normalizeReserve(
    {levels:[{cards:[{kind:'enemy',enemy:'walker',qty:8}]}]},
    {walker:2},
    defaults
  )).walker,
  2,
  'a positive custom reserve must remain authoritative even when lower than one card quantity'
);

const a=ctx.GensSurvivalV1.waveRules.normalizeReserve(profile,{walker:0},defaults);
const b=ctx.GensSurvivalV1.waveRules.normalizeReserve(profile,{walker:0},defaults);
assert.notEqual(a,b,'normalizeReserve must return a fresh reserve object');

assert.doesNotMatch(entry,/\bdocument\b|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener|Dungeon|Tactical|Capture|PvP/,
  'Survival wave-rules entry must remain pure and module-isolated');
assert.doesNotMatch(entry,/refreshCustomEnemiesIntoZombieTypes|defaultZombieConfig\s*\(/,
  'normalizeReserve must receive default reserve data explicitly and must not own custom-enemy refresh side effects');

assert.doesNotMatch(index,/function\s+normalizeWaveReserveForProfile\s*\(/,
  'legacy inline normalizeWaveReserveForProfile owner must be retired');

assert.equal(
  (index.match(/GensSurvivalV1\.waveRules\.normalizeReserve\(/g)||[]).length,
  4,
  'all four historical consumers must call Survival normalizeReserve directly'
);

assert.equal(
  (index.match(/refreshCustomEnemiesIntoZombieTypes\(\);[\s\S]{0,260}?GensSurvivalV1\.waveRules\.normalizeReserve\(/g)||[]).length,
  4,
  'all four normalizeReserve callsites must keep custom-enemy refresh in the historical runtime before the pure API call'
);

assert.ok(
  (contract.owns||[]).some(x=>/wave reserve normalization|reserve normalization/i.test(String(x))),
  'Survival contract must record ownership of wave reserve normalization'
);

console.log(JSON.stringify({
  scenario:'Phase 6 Survival wave reserve normalization',
  expected:'RED before normalizeReserve extraction, GREEN after direct Survival raccord',
  legacyOwnerRetired:true,
  directConsumers:4
},null,2));
