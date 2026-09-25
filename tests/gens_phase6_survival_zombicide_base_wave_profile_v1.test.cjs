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

assert.equal(bytes.length,8170730,'micro-lot 3 must start from the final GREEN micro-lot 2 index');
assert.equal(blob,'7663392f163aac32c4c3b918cbce67472856b3b6','micro-lot 3 must target the exact micro-lot 2 runtime');

const entry=fs.readFileSync(entryPath,'utf8');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));

const ctx={};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:entryPath});

assert.ok(ctx.GensSurvivalV1?.waveRules,'Survival waveRules API must remain available');
assert.equal(
  typeof ctx.GensSurvivalV1.waveRules.zombicideBaseProfile,
  'function',
  'Phase 6 micro-lot 3 requires the Zombicide base-profile converter in Survival'
);

const cards=[
  {id:1,b:['none'],y:['double'],o:['activation','runner'],r:['fatty',2]},
  {id:2,b:['walker',3],y:['ghost',4],o:null,r:['abomination',1]}
];
const enemyTypes=[
  {id:'walker'},{id:'runner'},{id:'fatty'},{id:'abomination'}
];
const normalize=v=>JSON.parse(JSON.stringify(v));
const actual=normalize(ctx.GensSurvivalV1.waveRules.zombicideBaseProfile(cards,enemyTypes));

assert.deepEqual(actual,{
  enabled:true,
  mode:'xp',
  manualLevel:0,
  levels:[
    {name:'Bleu',color:'#2779b9',threshold:0,cards:[
      {kind:'none',enemy:'walker',qty:1},
      {kind:'enemy',enemy:'walker',qty:3}
    ]},
    {name:'Jaune',color:'#c79a20',threshold:7,cards:[
      {kind:'double',enemy:'walker',qty:1},
      {kind:'enemy',enemy:'walker',qty:4}
    ]},
    {name:'Orange',color:'#cd6b20',threshold:19,cards:[
      {kind:'activation',enemy:'runner',qty:1},
      {kind:'none',enemy:'walker',qty:1}
    ]},
    {name:'Rouge',color:'#9f241f',threshold:43,cards:[
      {kind:'enemy',enemy:'fatty',qty:2},
      {kind:'enemy',enemy:'abomination',qty:1}
    ]}
  ]
},'Zombicide base deck conversion must preserve exact historical behavior');

const a=ctx.GensSurvivalV1.waveRules.zombicideBaseProfile(cards,enemyTypes);
const b=ctx.GensSurvivalV1.waveRules.zombicideBaseProfile(cards,enemyTypes);
assert.notEqual(a,b,'converter must return a fresh profile');
assert.notEqual(a.levels,b.levels,'converter nested levels must be fresh');

assert.doesNotMatch(entry,/\bdocument\b|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener|Dungeon|Tactical|Capture|PvP/,
  'Survival wave-rules entry must remain pure and module-isolated');

assert.doesNotMatch(index,/function\s+zombicideBaseWaveProfile\s*\(/,
  'legacy inline Zombicide base-profile owner must be retired');

assert.equal(
  (index.match(/GensSurvivalV1\.waveRules\.zombicideBaseProfile\(/g)||[]).length,
  3,
  'all three historical consumers must call the Survival API directly'
);

assert.ok(
  (contract.owns||[]).some(x=>/Zombicide base wave profile conversion/i.test(String(x))),
  'Survival contract must record ownership of Zombicide base wave conversion'
);

console.log(JSON.stringify({
  scenario:'Phase 6 Survival Zombicide base wave profile',
  expected:'RED before converter extraction, GREEN after direct Survival raccord',
  legacyOwnerRetired:true,
  directConsumers:3
},null,2));
