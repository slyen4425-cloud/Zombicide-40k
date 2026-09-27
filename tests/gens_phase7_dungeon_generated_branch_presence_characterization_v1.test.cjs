'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const dungeonEntry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8170062,
  'Phase 7 generated branch presence characterization must track the micro-lot 4 GREEN runtime');
assert.equal(gitBlob,'74e223b2c9877e6a88b6ad6726290d230f1f616e',
  'Phase 7 generated branch presence characterization must track the exact micro-lot 4 GREEN blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.match(line,/Math\.random\(\)\*100>=Math\.max\(0,Number\(c\.specialBranchChance\)\|\|0\)/,
  'generated branch presence must preserve historical chance coercion and comparison');
assert.match(line,/Math\.random\(\)\*100>=Math\.max\(0,Number\(c\.specialBranchChance\)\|\|0\)[\s\S]*const i=nearestFree\(x\);if\(i<0\)return null;[\s\S]*pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'presence roll, nearest-free gate and type roll must remain in historical order');
assert.equal((line.match(/Math\.random\(\)/g)||[]).length,2,
  'accepted generated branch path must still expose exactly two RNG callsites');
assert.equal((line.match(/nearestFree\(x\)/g)||[]).length,1,
  'generated branch callsite must keep one nearest-free gate');
assert.equal((line.match(/pickWeightedGeneratedBranchType\(/g)||[]).length,1,
  'generated branch callsite must keep one type selector');

function runScenario({chance,map=true,free=-1,rolls=[]}){
  const events=[];
  const x={room:3,last:{map:map?{size:5,cells:Array(25).fill('floor')}:null}};
  if(map&&free>=0)x.last.map.cells[free]='marker';

  const math=Object.create(Math);
  let ri=0;
  math.random=()=>{
    events.push('random');
    assert.ok(ri<rolls.length,'unexpected random draw');
    return rolls[ri++];
  };

  const sandbox={
    Math:math,
    cfg:()=>{events.push('cfg');return {specialBranchChance:chance}},
    nearestFree:()=>{events.push('nearestFree');return free},
    addDungeonSceneElement:(el)=>{events.push('addScene');return {...el,id:'scene-1'}}
  };
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dungeonEntry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(line+'\nthis.__maybeSpecialBranch=maybeSpecialBranch;',sandbox,{filename:'maybeSpecialBranch.js'});
  const result=sandbox.__maybeSpecialBranch(x);
  return {result,x,events,draws:ri};
}

let s=runScenario({chance:100,map:false,rolls:[]});
assert.equal(s.result,null,'missing map must skip branch presence logic');
assert.deepEqual(s.events,['cfg'],'missing map keeps cfg read but consumes no RNG');
assert.equal(s.draws,0,'missing map must consume no RNG');

s=runScenario({chance:0,rolls:[0]});
assert.equal(s.result,null,'chance 0 must always reject');
assert.deepEqual(s.events,['cfg','random'],'chance 0 rejection must stop before nearestFree');
assert.equal(s.draws,1);

s=runScenario({chance:20,rolls:[0.20]});
assert.equal(s.result,null,'roll exactly at 20 percent boundary must reject');
assert.deepEqual(s.events,['cfg','random'],'boundary rejection must stop before nearestFree');
assert.equal(s.draws,1);

s=runScenario({chance:20,free:-1,rolls:[0.199999]});
assert.equal(s.result,null,'roll below configured boundary may pass presence but no-free still rejects');
assert.deepEqual(s.events,['cfg','random','nearestFree'],
  'accepted presence must reach nearestFree before any type RNG');
assert.equal(s.draws,1,'no-free path after accepted presence must still consume only one RNG');

s=runScenario({chance:'20',free:-1,rolls:[0.10]});
assert.deepEqual(s.events,['cfg','random','nearestFree'],
  'numeric-string chance must preserve Number coercion');

s=runScenario({chance:-5,rolls:[0]});
assert.equal(s.result,null,'negative chance must clamp to zero and reject');
assert.deepEqual(s.events,['cfg','random']);

s=runScenario({chance:'bad',rolls:[0]});
assert.equal(s.result,null,'invalid chance must normalize to zero and reject');
assert.deepEqual(s.events,['cfg','random']);

s=runScenario({chance:100,free:4,rolls:[0.999999,0.10]});
assert.ok(s.result,'chance 100 with free cell must accept presence and materialize through historical path');
assert.deepEqual(s.events,['cfg','random','nearestFree','random','addScene'],
  'accepted path must preserve presence RNG -> nearestFree -> type RNG -> materialization');
assert.equal(s.draws,2);

s=runScenario({chance:150,free:-1,rolls:[0.999999]});
assert.deepEqual(s.events,['cfg','random','nearestFree'],
  'historical chance has no upper clamp; values above 100 still pass presence');

assert.doesNotMatch(dungeonEntry,/shouldCreateGeneratedBranch/,
  'characterization stage must not preinstall the future candidate API');
assert.doesNotMatch(authored,/specialBranchChance|shouldCreateGeneratedBranch/,
  'authored runtime must remain outside generated branch presence planning');

console.log(JSON.stringify({
  scenario:'Phase 7 generated special branch presence characterization',
  runtime:{bytes:bytes.length,gitBlob},
  boundary:'roll*100 >= normalizedChance rejects',
  normalization:'Math.max(0, Number(value)||0), no upper clamp',
  order:['presence RNG','nearestFree','type RNG','materialization'],
  authored:'separate and unchanged',
  runtimeChanged:false
},null,2));
