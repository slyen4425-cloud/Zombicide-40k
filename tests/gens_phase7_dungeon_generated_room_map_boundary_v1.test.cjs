'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes().toString('utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165438,
  'map-boundary guard must track the exact lot 33 runtime size');
assert.equal(gitBlob,'1a61147d5a32889fa85e6a09e846049103b9f0bf',
  'map-boundary guard must track the exact lot 33 runtime blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.planGeneratedRoomMapBoundary,
  'function',
  'Phase 7 lot 33 requires Dungeon-owned pure generated-room map-boundary planner'
);

const plan=sandbox.GensDungeonV1.exploration.planGeneratedRoomMapBoundary;

let reads=0;
const lazyResult={};
Object.defineProperty(lazyResult,'enemyQty',{
  get(){reads+=1;return 7;}
});

assert.deepEqual(
  JSON.parse(JSON.stringify(plan(false,'enemy',lazyResult))),
  {status:'disabled',kind:null,enemyQty:null},
  'strict false must disable map materialization with the exact disabled plan'
);
assert.equal(reads,0,
  'disabled map plan must preserve historical laziness and never read result.enemyQty');

for(const mapSetting of [true,undefined,null,0,'']){
  reads=0;
  const value=JSON.parse(JSON.stringify(plan(mapSetting,'enemy',lazyResult)));
  assert.deepEqual(value,{status:'generate',kind:'enemy',enemyQty:7},
    'every map setting except strict false must produce a generate plan');
  assert.equal(reads,1,
    'active map plan must preserve the observable direct read of result.enemyQty');
}

for(const [enemyQty,expected] of [
  [undefined,0],
  [null,0],
  [0,0],
  ['',0],
  [NaN,0],
  [2,2],
  ['3','3'],
  [-1,-1]
]){
  const value=plan(true,'chest',{enemyQty});
  assert.equal(value.status,'generate');
  assert.equal(value.kind,'chest');
  assert.ok(Object.is(value.enemyQty,expected),
    'enemyQty must preserve the exact historical result.enemyQty || 0 semantics');
}

assert.deepEqual(
  JSON.parse(JSON.stringify(plan(false,'enemy',null))),
  {status:'disabled',kind:null,enemyQty:null},
  'disabled plan must not dereference an invalid result value'
);
assert.throws(
  ()=>plan(true,'enemy',null),
  error=>error&&error.name==='TypeError',
  'active plan must preserve the historical direct-property-access failure semantics'
);

const fnMatch=entry.match(/function planGeneratedRoomMapBoundary\(mapSetting,kind,result\)\{[\s\S]*?\n  \}/);
assert.ok(fnMatch,'pure generated-room map-boundary planner source must remain extractable');
assert.doesNotMatch(fnMatch[0],
  /Math\.random|\bcfg\(|document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|generateDungeonMap|loadActiveEnemies|saveActiveEnemies|GensSpatial|RoomRuntime/i,
  'map-boundary planner must stay pure and free of config, RNG, DOM, storage, geometry and runtime authority');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const createMatch=core200.match(/function createRoom\(room,kind\)\{[\s\S]*?\}\nfunction placeSceneForRoom\(/);
assert.ok(createMatch,'Core 2.00 createRoom source must remain extractable');
const createSource=createMatch[0].replace(/\nfunction placeSceneForRoom\([\s\S]*$/,'');

assert.equal(
  (createSource.match(/GensDungeonV1\.exploration\.planGeneratedRoomMapBoundary\(/g)||[]).length,
  1,
  'Core 2.00 createRoom must consume the map-boundary planner exactly once'
);

const planCall=createSource.match(
  /const ([A-Za-z_$][\w$]*)=GensDungeonV1\.exploration\.planGeneratedRoomMapBoundary\(cfg\(\)\.map,kind,result\);/
);
assert.ok(planCall,
  'Core 2.00 must keep cfg().map at the callsite and pass mapSetting, kind and result to the planner');
const planVar=planCall[1].replace(/\$/g,'\\$');

assert.equal((createSource.match(/cfg\(\)\.map/g)||[]).length,1,
  'cfg().map must remain a single Core 2.00 read');
assert.equal((createSource.match(/generateDungeonMap\(/g)||[]).length,1,
  'generateDungeonMap must remain a single Core 2.00 callsite');

assert.match(
  createSource,
  new RegExp(planVar+'\\.status==="disabled"\\?null:generateDungeonMap\\('+planVar+'\\.kind,'+planVar+'\\.enemyQty\\)'),
  'Core 2.00 must keep materialization and generateDungeonMap while consuming only the pure plan'
);
assert.match(createSource,/return \{result,map:mapObj\}/,
  'Core 2.00 must keep the final {result,map} composition');

assert.doesNotMatch(createSource,/cfg\(\)\.map===false/,
  'Core 2.00 must retire the duplicated strict-false decision after delegation');
assert.doesNotMatch(createSource,/result\.enemyQty\|\|0/,
  'Core 2.00 must retire the duplicated enemyQty fallback after delegation');
assert.doesNotMatch(createSource,/generateDungeonMap\(kind,result\.enemyQty\|\|0\)/,
  'the historical inline map-boundary expression must no longer remain duplicated');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated room map-boundary pure planner',
  expected:'RED before planner + exact Core 2.00 delegation',
  pureOwner:'GensDungeonV1.exploration.planGeneratedRoomMapBoundary',
  retainedCoreResponsibilities:['cfg().map','generateDungeonMap','RNG/geometry','{result,map} composition']
},null,2));
