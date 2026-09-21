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

const install=extractFunction(cleanup,'installCacheInvalidators');
const wrap=extractFunction(cleanup,'wrapCacheInvalidator');
const legacyTargets=[
  'dungeonEquipItem','dungeonUnequipItem','equipDungeonItem',
  'unequipDungeonItem','toggleDungeonEquipment'
];
const canonicalTargets=['save','dc214Equip','removeInventoryEntry'];
const countToken=name=>(index.match(new RegExp('\\b'+name+'\\b','g'))||[]).length;

const characterization={
  legacy:Object.fromEntries(legacyTargets.map(name=>[name,countToken(name)])),
  canonical:Object.fromEntries(canonicalTargets.map(name=>[name,countToken(name)]))
};
console.log(JSON.stringify({
  scenario:'Phase 4 Equipment cache invalidation fix RED characterization',
  characterization
},null,2));

assert.match(cleanup,/\bCACHE_TTL_MS=120\b/,'Equipment cache TTL must remain 120 ms');
assert.match(perf,/"save"/,'final performance cache must keep its save invalidation');
assert.match(perf,/"dc214Equip"/,'final performance cache must keep its dc214Equip invalidation');

for(const name of canonicalTargets){
  assert.match(
    install,
    new RegExp('["\\\']'+name+'["\\\']'),
    'local Equipment cache must invalidate at canonical mutation boundary '+name
  );
}

// Runtime proof for the existing local wrapper mechanism after canonical targets are connected.
const calls={save:0,dc214Equip:0,removeInventoryEntry:0};
const R={
  save(){calls.save++;return 'save-ok'},
  dc214Equip(){calls.dc214Equip++;return 'dc-ok'},
  removeInventoryEntry(){calls.removeInventoryEntry++;return 'remove-ok'}
};
const ctx={R,calls,invalidations:0};
vm.createContext(ctx);
vm.runInContext(`
  function invalidateEquipmentBonusCache(){invalidations++;return true}
  ${wrap}
  ${install}
`,ctx,{filename:'equipment-cache-invalidation-owner'});
assert.equal(ctx.installCacheInvalidators(),true);

for(const name of canonicalTargets){
  const before=ctx.invalidations;
  const out=ctx.R[name]();
  assert.equal(ctx.calls[name],1,name+' owner must execute once');
  assert.ok(ctx.invalidations>=before+2,name+' must invalidate local Equipment cache before and after mutation');
  assert.equal(ctx.R[name].__eqCache1021,true,name+' must use the existing cache invalidator identity');
  assert.equal(typeof ctx.R[name].__original,'function',name+' must retain wrapper lineage');
  assert.ok(out,name+' return value must be preserved');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment cache invalidation fix contract',
  canonicalTargets,
  ttlMs:120,
  existingWrapperMechanismReused:true,
  newCache:false,
  performanceCacheChanged:false
},null,2));
