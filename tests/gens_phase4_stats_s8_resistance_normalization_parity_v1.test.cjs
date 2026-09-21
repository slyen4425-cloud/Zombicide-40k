const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const v110Src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');
const corePath=path.join(root,'assets','gensrpg','core','stats-resistance-normalization-v1.js');
const coreSrc=fs.readFileSync(corePath,'utf8');

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const genericCtx={Math,Number,Array,String};
genericCtx.globalThis=genericCtx;
vm.createContext(genericCtx);
vm.runInContext(extractFunction('gensNormalizeResistances'),genericCtx,{filename:'index-resistance-owner.js'});
assert.equal(typeof genericCtx.gensNormalizeResistances,'function');

const oracleCtx={console,Math,Number,Date,Set,Map,Object};
oracleCtx.globalThis=oracleCtx;
vm.createContext(oracleCtx);
const instrumented=v110Src.replace(
  'const api={VERSION,APP_VERSION,SNAPSHOT_VERSION,metrics,resetMetrics,',
  'R.__S8_RESISTANCE_ORACLE__={normalizeResistanceKey,collectResistanceObjects}; const api={VERSION,APP_VERSION,SNAPSHOT_VERSION,metrics,resetMetrics,'
);
assert.notEqual(instrumented,v110Src,'V110 oracle instrumentation seam missing');
vm.runInContext(instrumented,oracleCtx,{filename:'v110-resistance-oracle.js'});
const V110=oracleCtx.__S8_RESISTANCE_ORACLE__;
assert.ok(V110&&typeof V110.normalizeResistanceKey==='function'&&typeof V110.collectResistanceObjects==='function','V110 resistance oracle missing');

const coreCtx={console,Math,Number,JSON,Set,Map,Object,String,Array};
coreCtx.globalThis=coreCtx;
coreCtx.window=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'stats-resistance-normalization-v1.js'});
const Core=coreCtx.GensStatsResistanceNormalizationV1;
assert.ok(Core&&typeof Core.normalizeKey==='function'&&typeof Core.normalize==='function'&&typeof Core.collapse==='function','S8 Core API missing');

const plain=v=>JSON.parse(JSON.stringify(v));

const genericInput=[
  {kind:'physical',value:'25'},
  {kind:'element:fire',value:30},
  {kind:'element:feu',value:5},
  {kind:'magic',value:'bad'},
  {kind:'element:psy',value:1400},
  {kind:'element:psy',value:-1500},
  {kind:'',value:99}
];
const genericBefore=JSON.stringify(genericInput);
const genericLegacy=plain(genericCtx.gensNormalizeResistances(genericInput));
const genericCore=plain(Core.normalize(genericInput,{invalid:'zero',min:-1000,max:1000}));
assert.equal(JSON.stringify(genericInput),genericBefore,'S8 must not mutate generic input');
assert.deepEqual(
  genericCore,
  genericLegacy.map(x=>({key:Core.normalizeKey(x.kind),value:x.value})),
  'Core array normalization must preserve generic owner order/value semantics while canonicalizing keys'
);
assert.deepEqual(
  plain(Core.collapse(genericCore,{strategy:'sum'})),
  {physical:25,fire:35,magic:0,psy:0},
  'explicit sum projection must preserve generic duplicate additivity'
);

assert.equal(Core.normalizeKey('element:fire'),'fire');
assert.equal(Core.normalizeKey('element:feu'),'fire');
assert.equal(Core.normalizeKey('FEU'),'fire');
assert.equal(Core.normalizeKey('électricité'),'electric');
assert.equal(Core.normalizeKey('lightning'),'electric');
assert.equal(Core.normalizeKey('element:psy'),'psy');

const tacticalSources=[
  {feu:20,electricite:15,psy:200,bad:'x'},
  {fire:25,electricity:-150},
  {FEU:35,lightning:40,water:10}
];
const tacticalBefore=JSON.stringify(tacticalSources);
const tacticalLegacy=plain(V110.collectResistanceObjects(...tacticalSources));
const tacticalEntries=tacticalSources.flatMap(src=>plain(Core.normalize(src,{invalid:'skip',min:-100,max:100})));
const tacticalCollapsed=plain(Core.collapse(tacticalEntries,{strategy:'last'}));
assert.equal(JSON.stringify(tacticalSources),tacticalBefore,'S8 must not mutate Tactical object sources');
assert.deepEqual(tacticalCollapsed,tacticalLegacy,'explicit last projection must match V110 object precedence');
assert.deepEqual(tacticalCollapsed,{fire:35,electric:40,psy:100,water:10});

const equivalent=[
  Core.normalize([{kind:'element:fire',value:25}],{invalid:'zero',min:-1000,max:1000}),
  Core.normalize({fire:25},{invalid:'skip',min:-100,max:100}),
  Core.normalize({feu:25},{invalid:'skip',min:-100,max:100})
].map(x=>plain(x));
assert.deepEqual(equivalent,[
  [{key:'fire',value:25}],
  [{key:'fire',value:25}],
  [{key:'fire',value:25}]
],'array/object/alias forms must converge on the same transport entry');

assert.deepEqual(
  plain(Core.normalize(['fire','water'],{invalid:'zero',min:-1000,max:1000})),
  [],
  'Capture element ID arrays must not be misread as percentage resistance rows'
);

const defaults=plain(Core.normalize([{kind:'element:fire',value:'bad'}]));
assert.deepEqual(defaults,[],'default policy must skip invalid numeric values and apply no hidden gameplay rule');

const duplicate=Core.normalize([{kind:'element:fire',value:10},{kind:'fire',value:15}]);
assert.equal(duplicate.length,2,'normalization must never merge duplicates implicitly');
assert.equal(Object.isFrozen(duplicate),true);
for(const row of duplicate)assert.equal(Object.isFrozen(row),true,'normalized entries must be frozen');
const collapsed=Core.collapse(duplicate,{strategy:'sum'});
assert.equal(Object.isFrozen(collapsed),true,'collapsed projection must be frozen');

assert.throws(()=>Core.collapse(duplicate,{strategy:'unknown'}),/strategy/i,'collapse requires an explicit supported strategy');

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','state','currentRpgProfile','getActiveGameProfile',
  'gensResistanceMultiplier','resistanceFor','adjustedDamage',
  'armorReduction','hitChance','D100','magicResistance',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067'
]){
  assert.equal(coreSrc.includes(forbidden),false,'S8 Core normalizer must stay transport-only: '+forbidden);
}
assert.equal(/\*\s*\(1\s*-|\/\s*100|damage/i.test(coreSrc),false,'S8 must not contain damage application math');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S8 resistance normalization parity',
  genericArrayParity:true,
  tacticalObjectParity:true,
  explicitSumAndLast:true,
  aliases:true,
  arrayObjectConvergence:true,
  captureIdsExcluded:true,
  immutable:true,
  transportOnly:true
},null,2));
