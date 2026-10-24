'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing function '+name);
  const openParen=source.indexOf('(',start);
  let paren=0,quote=null,escaped=false,line=false,block=false,close=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')paren++;
    else if(c===')'&&--paren===0){close=i;break}
  }
  const brace=source.indexOf('{',close);
  let depth=0;quote=null;escaped=false;line=false;block=false;
  for(let i=brace;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const localInstall=extractFunction(cleanup,'installCacheInvalidators');
const perfInstall=extractFunction(perf,'install');
const legacyTargets=[
  'dungeonEquipItem','dungeonUnequipItem','equipDungeonItem',
  'unequipDungeonItem','toggleDungeonEquipment'
];
const canonicalTargets=['save','dc214Equip','removeInventoryEntry'];
const countToken=name=>(index.match(new RegExp('\\b'+name+'\\b','g'))||[]).length;

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment cache invalidation fix characterization',
  legacy:Object.fromEntries(legacyTargets.map(name=>[name,countToken(name)])),
  canonical:Object.fromEntries(canonicalTargets.map(name=>[name,countToken(name)]))
},null,2));

assert.match(cleanup,/\bCACHE_TTL_MS=120\b/,'Equipment cache TTL must remain 120 ms');
assert.match(localInstall,/"saveEquipmentEditor"/,'Equipment editor save keeps its local invalidation');
for(const name of legacyTargets){
  assert.doesNotMatch(
    localInstall,
    new RegExp('["\\\']'+name+'["\\\']'),
    'dead local cache invalidator target must be retired: '+name
  );
}
for(const name of canonicalTargets){
  assert.doesNotMatch(
    localInstall,
    new RegExp('["\\\']'+name+'["\\\']'),
    'canonical mutations must not gain a second local wrapper: '+name
  );
}

assert.match(perfInstall,/"save"/,'performance owner must retain save invalidation');
assert.match(perfInstall,/"dc214Equip"/,'performance owner must retain dc214Equip invalidation');
assert.match(perfInstall,/"removeInventoryEntry"/,'performance owner must directly cover inventory removal');

const isEquipment=extractFunction(perf,'isEquipmentInvalidator');
const invalidateLocal=extractFunction(perf,'invalidateEquipmentLocal');
const wrapPerf=extractFunction(perf,'wrapInvalidator');

for(const name of canonicalTargets){
  assert.match(isEquipment,new RegExp('["\\\']'+name+'["\\\']'),name+' must be classified as an Equipment invalidator');
}
assert.match(
  invalidateLocal,
  /GensEquipmentStatCleanup1678102/,
  'performance invalidation owner must reach the existing local Equipment cache API'
);
assert.match(
  invalidateLocal,
  /invalidateEquipmentBonusCache/,
  'performance invalidation owner must reuse the existing local cache invalidator'
);
assert.match(
  wrapPerf,
  /isEquipmentInvalidator\(name\)/,
  'existing performance wrapper must classify Equipment mutations'
);
assert.match(
  wrapPerf,
  /invalidateEquipmentLocal\(\)/,
  'existing performance wrapper must cascade Equipment-local invalidation'
);

// Runtime proof: one existing performance wrapper owns each canonical boundary.
const calls={save:0,dc214Equip:0,removeInventoryEntry:0};
const R={
  save(){calls.save++;return 'save-ok'},
  dc214Equip(){calls.dc214Equip++;return 'dc-ok'},
  removeInventoryEntry(){calls.removeInventoryEntry++;return 'remove-ok'},
  GensEquipmentStatCleanup1678102:{
    invalidateEquipmentBonusCache(){R.localInvalidations++;return true}
  },
  localInvalidations:0
};
const ctx={R,calls,perfClears:0};
vm.createContext(ctx);
vm.runInContext(`
  function clear(){perfClears++;return true}
  ${isEquipment}
  ${invalidateLocal}
  ${wrapPerf}
`,ctx,{filename:'equipment-cache-shared-invalidation-owner'});

for(const name of canonicalTargets)assert.equal(ctx.wrapInvalidator(name),true);
for(const name of canonicalTargets){
  const localBefore=ctx.R.localInvalidations,clearBefore=ctx.perfClears;
  const out=ctx.R[name]();
  assert.equal(ctx.calls[name],1,name+' mutation must execute exactly once');
  assert.equal(ctx.perfClears,clearBefore+1,name+' must keep final performance invalidation');
  assert.equal(ctx.R.localInvalidations,localBefore+1,name+' must invalidate local Equipment cache after mutation');
  assert.equal(ctx.R[name].__gensMobileCombat1022Invalidator,true,name+' must reuse the existing performance wrapper identity');
  assert.equal(typeof ctx.R[name].__original,'function',name+' must retain wrapper lineage');
  assert.ok(out,name+' return value must be preserved');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment cache invalidation fix contract',
  canonicalTargets,
  retiredDeadLocalTargets:legacyTargets,
  ttlMs:120,
  canonicalWrapperOwner:'gens-mobile-combat-performance-16781022',
  secondCanonicalWrapperAdded:false,
  newCache:false
},null,2));
