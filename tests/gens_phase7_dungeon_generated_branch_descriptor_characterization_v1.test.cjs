'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const authoredBranchContent=read('assets/dungeon/dungeon-secondary-branch-content-fix-167860.js');
const authoredBranchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169442,
  'Phase 7 generated branch descriptor characterization must track the current generated Boss policy runtime');
assert.equal(gitBlob,'a37acaabcb3202a8527c2d545f9e2ff4466ea1db',
  'Phase 7 generated branch descriptor characterization must track the exact generated Boss policy blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.match(line,/const i=nearestFree\(x\);if\(i<0\)return null/,
  'nearestFree must remain at the Core 2.00 callsite before descriptor construction');
assert.match(line,/pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'branch type selection must remain delegated before descriptor construction');
assert.match(
  line,
  /const el=addDungeonSceneElement\?\.\(GensDungeonV1\.exploration\.buildGeneratedBranchSceneElement\(x\.room,i,type\)\);m\.cells\[i\]='trapdoor';return el/,
  'generated branch descriptor/materialization sequence must preserve Core 2.00 materialization around the pure Dungeon descriptor'
);
assert.doesNotMatch(
  line,
  /name:type==='boss'\?'Trappe inquiétante':type==='secret'\?'Passage secret':'Cache souterraine'/,
  'Core 2.00 must no longer duplicate the generated branch descriptor labels'
);

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.shouldCreateGeneratedBranch,'function');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedBranchType,'function');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.buildGeneratedBranchSceneElement,'function',
  'post-raccord characterization requires the Dungeon-owned generated branch descriptor builder');

function run(typeRoll){
  const events=[];
  const x={room:6,last:{map:{size:5,cells:Array(25).fill('floor')}}};
  x.last.map.cells[7]='marker';
  const rolls=[0.99,typeRoll];
  const math=Object.create(Math);
  math.random=()=>{
    events.push('random');
    assert.ok(rolls.length,'unexpected random draw');
    return rolls.shift();
  };
  let sceneArg=null;
  const ctx={
    Math:math,
    cfg:()=>({specialBranchChance:100}),
    nearestFree:()=>{events.push('nearestFree');return 7},
    addDungeonSceneElement:(el)=>{
      events.push('addScene');
      sceneArg=JSON.parse(JSON.stringify(el));
      assert.equal(x.last.map.cells[7],'marker',
        'scene descriptor must be consumed before the map cell mutates');
      return {...el,id:'scene-1'};
    }
  };
  ctx.window=ctx;
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(line+'\nthis.__maybeSpecialBranch=maybeSpecialBranch;',ctx,{filename:'maybeSpecialBranch.js'});
  const result=ctx.__maybeSpecialBranch(x);
  return {
    sceneArg,
    result:JSON.parse(JSON.stringify(result)),
    mapCell:x.last.map.cells[7],
    events
  };
}

const treasure=run(0.10);
assert.deepEqual(treasure.sceneArg,{
  kind:'trapdoor',
  name:'Cache souterraine',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'treasure'
},'treasure descriptor must preserve the exact historical scene shape');
assert.equal(treasure.result.id,'scene-1','maybeSpecialBranch must return addDungeonSceneElement result');
assert.equal(treasure.mapCell,'trapdoor','map mutation must remain after scene creation');
assert.deepEqual(treasure.events,['random','nearestFree','random','addScene']);

const boss=run(0.50);
assert.deepEqual(boss.sceneArg,{
  kind:'trapdoor',
  name:'Trappe inquiétante',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'boss'
},'boss descriptor label/shape must remain exact');

const secret=run(0.90);
assert.deepEqual(secret.sceneArg,{
  kind:'trapdoor',
  name:'Passage secret',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'secret'
},'secret descriptor label/shape must remain exact');

for(const src of [authored,authoredBranchContent,authoredBranchNav]){
  assert.doesNotMatch(src,/buildGeneratedBranchSceneElement|specialBranchWeights|specialBranchChance/,
    'authored branch owners must remain outside generated branch descriptor extraction');
}

console.log(JSON.stringify({
  scenario:'Phase 7 generated branch scene descriptor characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'Core 2.00 maybeSpecialBranch',
  descriptor:{
    kind:'trapdoor',
    names:{treasure:'Cache souterraine',boss:'Trappe inquiétante',secret:'Passage secret'},
    fields:['kind','name','room','cellIndex','environment','branchType']
  },
  materialization:{
    addDungeonSceneElement:'Core 2.00',
    mapMutation:'Core 2.00 after scene creation'
  },
  authored:'separate and unchanged'
},null,2));
