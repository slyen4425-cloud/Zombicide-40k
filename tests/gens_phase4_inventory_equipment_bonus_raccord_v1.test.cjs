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
const coreSource=read('assets/gensrpg/core/equipment-bonus-sets-v1.js');

const core='assets/gensrpg/core/equipment-bonus-sets-v1.js';
const pageTag='<script src="assets/gensrpg/core/equipment-bonus-sets-v1.js?v=1"></script>';
const previewTag='<script src="assets/gensrpg/core/equipment-bonus-sets-v1.js?v=1"><\\/script>';

assert.ok(pages.includes(core),'Pages must publish the Core Equipment bonus + sets service');
assert.ok(pages.includes(pageTag),'Pages must inject the Core Equipment bonus + sets service');
assert.ok(preview.includes(previewTag),'preview must inject the Core Equipment bonus + sets service');
assert.ok(sw.includes('./assets/gensrpg/core/equipment-bonus-sets-v1.js'),'PWA must precache the Core Equipment bonus + sets service');

assert.match(
  graph,
  /phase4ConnectedServices=\[[\s\S]*assets\/gensrpg\/core\/equipment-bonus-sets-v1\.js/,
  'runtime graph must classify Core Equipment bonus + sets as connected'
);
assert.doesNotMatch(
  graph,
  /phase4InertServices=\[[^\]]*assets\/gensrpg\/core\/equipment-bonus-sets-v1\.js/,
  'Core Equipment bonus + sets must leave the inert set after raccord'
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
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

const patch=extractFunction(cleanup,'patchEquipmentBonus');
assert.match(patch,/GensEquipmentBonusSetsV1/,'existing Equipment cleanup owner must depend on Core Equipment bonus + sets');
assert.match(patch,/totalBonus/,'existing Equipment cleanup owner must delegate direct + sets to Core');
assert.match(patch,/equippedItemsCached\(\)/,'Core Equipment calculation must use the existing equipped-item seam');
assert.match(patch,/DUNGEON_EQUIPMENT_SETS/,'Core Equipment calculation must receive the live set registry explicitly');
assert.match(patch,/cachedEvolutionBonus\(key\)/,'existing evolution layer must remain in the same owner');
assert.doesNotMatch(patch,/old\.apply\(/,'historical direct + set chain must no longer execute inside the active Equipment owner');
assert.match(patch,/w\.__original=old/,'existing wrapper lineage must remain inspectable');
assert.match(patch,/w\.__canon102=true/,'existing wrapper identity must remain unchanged');

assert.match(perf,/wrapValue\("dungeonEquipmentBonus",valueCaches\.equipment/,'performance cache must remain downstream of the Equipment owner');
assert.ok(statsNormalization.includes('GensStatsNormalizationV1'),'raccord VM fixture must retain the explicit Core Stats dependency order');
assert.match(stats,/equipmentValues\[id\]=num\(R\.dungeonEquipmentBonus\?\.\(id\),0\)/,'Core Stats must continue consuming the final Equipment seam');

// Execute the active owner contract: historical direct+set seam must not be called.
const items=[
  {id:'helm',setId:'leather',setPieceId:'head',rpgBonuses:{armor:1}},
  {id:'torso',setId:'leather',setPieceId:'torso',rpgBonuses:{armor:2}}
];
const registry={
  leather:{id:'leather',thresholds:[{pieces:2,bonuses:{armor:3}}]}
};
let historicalCalls=0;
const ctx={
  console,Math,Number,Object,Array,Set,
  __items:items,
  __evolution:{armor:4},
  DUNGEON_EQUIPMENT_SETS:registry,
  dungeonEquipmentBonus:()=>{historicalCalls++;return 999}
};
ctx.globalThis=ctx;ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(coreSource,ctx,{filename:'equipment-bonus-sets-v1.js'});
vm.runInContext(`
  const R=globalThis;
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  function equippedItemsCached(){return __items}
  function cachedEvolutionBonus(key){return Number(__evolution[key])||0}
  ${patch}
`,ctx,{filename:'cleanup#patchEquipmentBonus'});
assert.equal(ctx.patchEquipmentBonus(),true,'existing Equipment owner must install against Core');
assert.equal(ctx.dungeonEquipmentBonus('armor'),10,'runtime owner must return direct 3 + set 3 + evolution 4 exactly once');
assert.equal(historicalCalls,0,'historical direct + set seam must not execute after Core raccord');
assert.equal(ctx.dungeonEquipmentBonus.__canon102,true,'existing owner identity marker must be preserved');
assert.equal(ctx.dungeonEquipmentBonus.__coreEquipmentBonusSetsV1,true,'Core Equipment authority marker missing');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment bonus runtime Core raccord',
  coreLoadedByPages:true,
  coreLoadedByPreview:true,
  pwaPrecached:true,
  existingOwnerDelegatesDirectAndSets:true,
  historicalDirectSetExecutionRemoved:true,
  evolutionPreserved:true,
  performanceCachePreserved:true,
  statsConsumerPreserved:true,
  executedRuntimeParity:true,
  historicalOwnerCalls:historicalCalls
},null,2));
