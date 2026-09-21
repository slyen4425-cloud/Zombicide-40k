'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing owner function '+name);
  const openParen=source.indexOf('(',start);
  let parenDepth=0,quote=null,escaped=false,line=false,block=false,closeParen=-1;
  for(let i=openParen;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='(')parenDepth++;
    else if(c===')'&&--parenDepth===0){closeParen=i;break}
  }
  assert.ok(closeParen>openParen,'missing owner parameter close '+name);
  const brace=source.indexOf('{',closeParen);
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

const slotOwners=['equipRight','equipLeft','equipTwoHands','unequip','equipRpgGear','unequipRpgGear'];
const slotSources=Object.fromEntries(slotOwners.map(name=>[name,extractFunction(index,name)]));

for(const [name,source] of Object.entries(slotSources)){
  assert.match(source,/\bsave\s*\(/,name+' must persist through the historical save boundary');
}

const removeSource=extractFunction(index,'removeInventoryEntry');
assert.doesNotMatch(removeSource,/\bsave\s*\(/,'removeInventoryEntry currently mutates/reindexes without persisting itself');
const removeDefStart=index.indexOf(removeSource);
const removeDefEnd=removeDefStart+removeSource.length;
const removeCallsites=[...index.matchAll(/\bremoveInventoryEntry\s*\(/g)]
  .map(m=>m.index)
  .filter(pos=>pos<removeDefStart||pos>=removeDefEnd)
  .map(pos=>{
    const around=index.slice(Math.max(0,pos-240),Math.min(index.length,pos+420));
    return {pos,nearSave:/\bsave\s*\(/.test(around)};
  });
assert.ok(removeCallsites.length>0,'removeInventoryEntry must have at least one runtime callsite to characterize');

const localInstall=extractFunction(cleanup,'installCacheInvalidators');
const localTargets=[...localInstall.matchAll(/"([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(localTargets,[
  'saveEquipmentEditor'
],'local Equipment cache invalidator list must retain only the editor-specific local boundary after canonical fix');

const localCoveredSlotOwners=slotOwners.filter(name=>localTargets.includes(name));
assert.deepEqual(localCoveredSlotOwners,[],
  'preaudit expects the real inline slot owners to remain absent from the local cache invalidator list');

assert.equal(localTargets.includes('removeInventoryEntry'),false,
  'removeInventoryEntry is not directly wrapped by the local Equipment cache invalidator');
assert.equal(localTargets.includes('dc214Equip'),false,
  'dc214Equip is not directly wrapped by the local Equipment cache invalidator');

assert.match(cleanup,/\bCACHE_TTL_MS=120\b/,'Equipment evolution cache TTL must stay characterized at 120 ms');
assert.match(
  extractFunction(cleanup,'equippedItemsCached'),
  /\(t-equippedSnapshot\.at\)<=CACHE_TTL_MS/,
  'equipped snapshot must use the same 120 ms TTL boundary'
);
assert.match(
  extractFunction(cleanup,'cachedEvolutionBonus'),
  /\(t-hit\.at\)<=CACHE_TTL_MS/,
  'evolution bonus cache must use the same 120 ms TTL boundary'
);

const perfInstall=extractFunction(perf,'install');
const perfTargets=[...perfInstall.matchAll(/\["([^\]]+)"\]/g)];
assert.match(perfInstall,/"dc214Equip"/,'performance cache must directly invalidate on dc214Equip');
assert.match(perfInstall,/"save"/,'performance cache must invalidate on the shared save boundary');
assert.match(perfInstall,/"removeInventoryEntry"/,'performance cache must directly own inventory removal invalidation after the dedicated fix');
assert.match(perf,/GensEquipmentStatCleanup1678102\?\.invalidateEquipmentBonusCache/,'performance invalidator must cascade to the local Equipment cache');
assert.match(perfInstall,/"saveState"/,'performance cache must invalidate on saveState');
assert.match(perfInstall,/"saveDungeonHeroState"/,'performance cache must invalidate on Dungeon hero state save');

for(const name of slotOwners){
  assert.match(slotSources[name],/\bsave\s*\(/,
    name+' reaches the performance invalidator indirectly through save');
}

assert.doesNotMatch(removeSource,/\bsave\s*\(/,
  'inventory removal itself does not reach the performance save invalidator; caller behavior must remain explicit');

const patchEvolution=extractFunction(cleanup,'patchEvolutionFunctions');
assert.match(patchEvolution,/invalidateEquipmentBonusCache\(\)/,
  'evolution editor mutation must explicitly invalidate the local Equipment cache');
assert.match(extractFunction(cleanup,'persistSetRaw'),/invalidateEquipmentBonusCache\(\)/,
  'set definition save must explicitly invalidate the local Equipment cache');
assert.match(cleanup,/persistItemMembership[\s\S]*invalidateEquipmentBonusCache\(\)/,
  'set membership mutation path must explicitly invalidate the local Equipment cache');

assert.match(perf,/wrapValue\("dungeonEquipmentBonus",valueCaches\.equipment/,
  'final Equipment performance cache must stay characterized downstream');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment cache/invalidation preaudit',
  localCache:{
    ttlMs:120,
    directInvalidatorTargets:localTargets,
    directlyCoveredRealSlotOwners:localCoveredSlotOwners,
    removeInventoryEntryDirect:false,
    dc214EquipDirect:false,
    evolutionEditorExplicit:true,
    setSaveExplicit:true,
    setMembershipExplicit:true
  },
  performanceCache:{
    saveBoundaryInvalidates:true,
    dc214EquipDirect:true,
    realSlotOwnersReachSave:true,
    removeInventoryEntryDirectSave:false,
    removeInventoryEntryDirectPerformanceInvalidation:true,
    removeInventoryEntryCallsites:removeCallsites
  },
  risk:{
    localEvolutionCacheCanRelyOnTtlAfterSlotMutation:false,
    equippedSnapshotCanRelyOnTtlAfterSlotMutation:false,
    canonicalInvalidationDelegatedThroughPerformanceOwner:true,
    removeInventoryEntryPersistenceDependsOnCaller:true
  },
  runtimeChanged:false
},null,2));
