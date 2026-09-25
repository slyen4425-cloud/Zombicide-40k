'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const index=fs.readFileSync('index.html','utf8');
const entryPath='assets/gensrpg/survival/entry-v1.js';
const contractPath='assets/gensrpg/survival/module-contract-v1.json';
const entry=fs.readFileSync(entryPath,'utf8');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));

assert.match(entry,/GensSurvivalV1/,'Phase 6 micro-lot 2 requires an active Survival entry API');
assert.doesNotMatch(entry,/\bdocument\b|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener|Dungeon|Tactical|Capture|PvP/,
  'Survival wave rules entry must remain pure and isolated');

const ctx={};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

assert.ok(ctx.GensSurvivalV1,'Survival entry must expose one module namespace');
assert.ok(ctx.GensSurvivalV1.waveRules,'Survival entry must expose waveRules');
assert.equal(typeof ctx.GensSurvivalV1.waveRules.defaultProfile,'function');
assert.equal(typeof ctx.GensSurvivalV1.waveRules.collectEnemyIds,'function');

const expected={
  enabled:false,
  mode:'xp',
  manualLevel:0,
  levels:[
    {name:'Bleu',color:'#2779b9',threshold:0,cards:[
      {kind:'enemy',enemy:'walker',qty:1},
      {kind:'enemy',enemy:'walker',qty:2},
      {kind:'enemy',enemy:'fatty',qty:1},
      {kind:'none',enemy:'walker',qty:0}
    ]},
    {name:'Jaune',color:'#c79a20',threshold:7,cards:[
      {kind:'enemy',enemy:'walker',qty:3},
      {kind:'enemy',enemy:'runner',qty:1},
      {kind:'enemy',enemy:'fatty',qty:1},
      {kind:'activation',enemy:'walker',qty:0}
    ]},
    {name:'Orange',color:'#cd6b20',threshold:19,cards:[
      {kind:'enemy',enemy:'walker',qty:5},
      {kind:'enemy',enemy:'runner',qty:2},
      {kind:'enemy',enemy:'fatty',qty:2},
      {kind:'double',enemy:'walker',qty:0}
    ]},
    {name:'Rouge',color:'#9f241f',threshold:43,cards:[
      {kind:'enemy',enemy:'walker',qty:7},
      {kind:'enemy',enemy:'runner',qty:3},
      {kind:'enemy',enemy:'abomination',qty:1},
      {kind:'double',enemy:'walker',qty:0}
    ]}
  ]
};
const normalize=v=>JSON.parse(JSON.stringify(v));
const a=ctx.GensSurvivalV1.waveRules.defaultProfile();
const b=ctx.GensSurvivalV1.waveRules.defaultProfile();
assert.deepEqual(normalize(a),expected,'default Survival wave profile must preserve exact behavior');
assert.notEqual(a,b,'defaultProfile must return a fresh object');
assert.notEqual(a.levels,b.levels,'defaultProfile nested arrays must be fresh');

const ids=normalize(ctx.GensSurvivalV1.waveRules.collectEnemyIds({
  levels:[
    {cards:[
      {kind:'enemy',enemy:'walker'},
      {kind:'none',enemy:'runner'},
      {kind:'activation',enemy:'runner'},
      {kind:'enemy',enemy:'walker'}
    ]},
    {cards:[{kind:'enemy',enemy:'fatty'}]}
  ]
}));
assert.deepEqual(ids,['walker','runner','fatty'],'enemy id collection must preserve insertion order and deduplicate');

const tag='<script src="assets/gensrpg/survival/entry-v1.js?v=1"></script>';
assert.equal(index.split(tag).length-1,1,'Survival entry must be loaded exactly once');
assert.ok(index.indexOf(tag)<index.indexOf('const Z40K_GENERIC_SHEET_BG'),
  'Survival entry must load before the legacy base script consumes wave rules');

assert.doesNotMatch(index,/function\s+defaultWaveProfile\s*\(/,'legacy defaultWaveProfile owner must be retired');
assert.doesNotMatch(index,/function\s+collectEnemyIdsFromProfile\s*\(/,'legacy enemy-id collector owner must be retired');
assert.equal((index.match(/GensSurvivalV1\.waveRules\.defaultProfile\(\)/g)||[]).length,5,
  'five legacy index consumers must still use Survival API directly after Zombicide base conversion moves into the module');
assert.match(entry,/function\s+zombicideBaseProfile\s*\([^)]*\)\s*\{[\s\S]*?const\s+base=defaultProfile\(\)/,
  'the sixth default-profile consumption now belongs inside the Survival Zombicide base converter');
assert.equal((index.match(/GensSurvivalV1\.waveRules\.collectEnemyIds\(/g)||[]).length,1,
  'one legacy index consumer must still use Survival API directly after auto-reserve ownership moves into the module');
assert.match(entry,/function\s+autoReserve\s*\([^)]*\)\s*\{[\s\S]*?collectEnemyIds\(profile\)/,
  'automatic reserve derivation must reuse the module-owned enemy-id collector');

assert.equal(contract.status,'partial-runtime-loaded','Survival contract must record the first active runtime slice');
assert.equal(contract.publicRuntimeApi,'GensSurvivalV1','Survival contract must name its public runtime namespace');

console.log(JSON.stringify({
  scenario:'Phase 6 Survival wave-rules entry',
  expected:'RED before active Survival entry, GREEN after pure wave-rule extraction',
  legacyOwnersRetired:2,
  defaultProfileConsumers:6,
  collectEnemyIdsConsumers:2
},null,2));
