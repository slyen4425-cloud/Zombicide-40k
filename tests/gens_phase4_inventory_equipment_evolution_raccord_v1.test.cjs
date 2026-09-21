'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');
const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');
const statsNormalization=read('assets/gensrpg/core/stats-normalization-v1.js');
const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');

const core='assets/gensrpg/core/equipment-evolution-v1.js';
const pageTag='<script src="assets/gensrpg/core/equipment-evolution-v1.js?v=1"></script>';
const previewTag='<script src="assets/gensrpg/core/equipment-evolution-v1.js?v=1"><\\/script>';

assert.ok(pages.includes(core),'Pages must publish the Core Equipment evolution service');
assert.ok(pages.includes(pageTag),'Pages must inject the Core Equipment evolution service');
assert.ok(preview.includes(previewTag),'preview must inject the Core Equipment evolution service');
assert.ok(sw.includes('./assets/gensrpg/core/equipment-evolution-v1.js'),'PWA must precache the Core Equipment evolution service');

assert.match(
  graph,
  /phase4ConnectedServices=\[[^\]]*assets\/gensrpg\/core\/equipment-evolution-v1\.js/,
  'runtime graph must classify Core Equipment evolution as connected'
);
assert.doesNotMatch(
  graph,
  /phase4InertServices=\[[^\]]*assets\/gensrpg\/core\/equipment-evolution-v1\.js/,
  'Core Equipment evolution must leave the inert set after raccord'
);

function extractFunction(source,name){
  const token='function '+name+'(';
  const start=source.indexOf(token);
  assert.ok(start>=0,'missing function '+name);
  const open=source.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=open;i<source.length;i++){
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

const cached=extractFunction(cleanup,'cachedEvolutionBonus');
assert.match(cached,/GensEquipmentEvolutionV1/,'existing cache owner must depend on Core Equipment evolution');
assert.match(cached,/core\.totalBonus/,'cache miss must delegate evolution calculation to Core');
assert.match(cached,/equippedItemsCached\(\)/,'cache owner must keep the existing equipped-item seam');
assert.match(cached,/Math\.max\(0,num\(R\.state\?\.xp,0\)\)/,'cache owner must preserve normalized hero XP');
assert.match(cached,/equipmentBonusCache\.get\(cacheKey\)/,'cache lookup must remain in the existing owner');
assert.match(cached,/CACHE_TTL_MS/,'cache TTL must remain in the existing owner');
assert.match(cached,/equipmentBonusCache\.set\(cacheKey,\{at:t,value:extra\}\)/,'cache write must remain in the existing owner');
assert.doesNotMatch(cached,/evolutionBonusForItem\(/,'active cache miss must no longer execute the historical local evolution calculator');

const patch=extractFunction(cleanup,'patchEquipmentBonus');
assert.match(patch,/\+cachedEvolutionBonus\(key\)/,'Equipment seam must still add evolution through the existing cached boundary');
assert.match(perf,/wrapValue\("dungeonEquipmentBonus",valueCaches\.equipment/,'performance cache must remain downstream');
assert.ok(statsNormalization.includes('GensStatsNormalizationV1'),'raccord VM fixture must retain the explicit Core Stats dependency order');
assert.match(stats,/equipmentValues\[id\]=num\(R\.dungeonEquipmentBonus\?\.\(id\),0\)/,'Core Stats must still consume the final Equipment seam');

// Execute the cache owner contract: Core computes misses, cache owns reuse/expiry.
let clock=100;
let coreCalls=0;
let historicalCalls=0;
const items=[{id:'blade'},{id:'shield'}];
const ctx={
  console,Math,Number,Map,
  CACHE_TTL_MS:120,
  equipmentBonusCache:new Map(),
  now:()=>clock,
  combatCacheContext:()=> 'hero-a|20',
  equippedItemsCached:()=>items,
  num:(v,f=0)=>Number.isFinite(Number(v))?Number(v):f,
  evolutionBonusForItem:()=>{historicalCalls++;throw new Error('historical evolution calculator executed')},
  R:{
    state:{xp:20},
    GensEquipmentEvolutionV1:{
      totalBonus:(received,key,xp)=>{
        coreCalls++;
        assert.equal(received,items);
        assert.equal(key,'force');
        assert.equal(xp,20);
        return 7;
      }
    }
  }
};
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(cached,ctx,{filename:'cleanup#cachedEvolutionBonus'});
assert.equal(ctx.cachedEvolutionBonus('force'),7);
assert.equal(coreCalls,1,'first cache miss must call Core once');
clock=150;
assert.equal(ctx.cachedEvolutionBonus('force'),7);
assert.equal(coreCalls,1,'cache hit inside TTL must not call Core again');
clock=250;
assert.equal(ctx.cachedEvolutionBonus('force'),7);
assert.equal(coreCalls,2,'expired cache entry must delegate to Core again');
assert.equal(historicalCalls,0,'historical local evolution calculator must never execute');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment evolution runtime Core raccord',
  coreLoadedByPages:true,
  coreLoadedByPreview:true,
  pwaPrecached:true,
  coreOwnsEvolutionCalculation:true,
  cacheOwnerPreserved:true,
  cacheTtlPreserved:true,
  historicalEvolutionCalls:historicalCalls,
  downstreamPerformanceCachePreserved:true,
  statsConsumerPreserved:true
},null,2));
