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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8164674,
  'Phase 7 generated branch planning characterization must track the current Phase 9 participant raccord runtime');
assert.equal(gitBlob,'644fc5d0ce5fd195c5496d42cc0204bd1f9a9831',
  'Phase 7 generated branch planning characterization must track the exact current Phase 9 participant raccord blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
function ordered(source,parts,label){
  let at=-1;
  for(const part of parts){
    const i=source.indexOf(part,at+1);
    assert.ok(i>at,label+' missing/out-of-order: '+part);
    at=i;
  }
}

const core200=block('dungeonCore200Rebuild');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const authoredBranchContent=read('assets/dungeon/dungeon-secondary-branch-content-fix-167860.js');
const authoredBranchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');

const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.match(line,/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)/,
  'generated branch presence must delegate configured specialBranchChance and the explicit first random roll to the Dungeon gate');
assert.doesNotMatch(line,/Math\.random\(\)\*100>=Math\.max\(0,Number\(c\.specialBranchChance\)\|\|0\)/,
  'Core 2.00 must no longer duplicate the generated branch chance calculation');
assert.match(line,/const i=nearestFree\(x\);if\(i<0\)return null/,
  'generated branch planning must stop before type selection when there is no free cell');
assert.equal((line.match(/GensDungeonV1\.exploration\.pickWeightedGeneratedBranchType\(/g)||[]).length,1,
  'generated branch type selection must delegate exactly once to the Dungeon owner');
assert.match(line,/GensDungeonV1\.exploration\.pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'generated branch type selection must pass configured weights and the explicit second random roll');
assert.doesNotMatch(line,/const w=\{treasure:45,boss:25,secret:30/,
  'Core 2.00 must no longer duplicate the branch-type weighting calculation');
assert.match(line,/addDungeonSceneElement\?\.\(GensDungeonV1\.exploration\.buildGeneratedBranchSceneElement\(x\.room,i,type\)\)/,
  'branch materialization must still occur at the Core 2.00 callsite using the pure Dungeon descriptor');
assert.doesNotMatch(line,/name:type==='boss'\?'Trappe inquiétante':type==='secret'\?'Passage secret':'Cache souterraine'/,
  'Core 2.00 must no longer duplicate the generated branch descriptor labels');
assert.match(line,/m\.cells\[i\]='trapdoor'/,
  'branch materialization must still mutate the generated map at the Core 2.00 callsite');

const exploreMatch=core200.match(/function explore\(\)\{[\s\S]*?\}\s*function moveTo\(/);
assert.ok(exploreMatch,'Core 2.00 explore body must remain extractable');
const explore=exploreMatch[0].replace(/\}\s*function moveTo\([\s\S]*$/,'}');
const existingStart=explore.indexOf("if(advancePlan.status==='existing'&&existing?.last)");
const createStart=explore.indexOf('x.room=targetRoom;x.enemyCells={};x.branch=null');
assert.ok(existingStart>=0&&createStart>existingStart,'existing path must precede create path');
const existingBranch=explore.slice(existingStart,createStart);
const createBranch=explore.slice(createStart);

assert.doesNotMatch(existingBranch,/maybeSpecialBranch\(/,
  'returning to an existing generated room must not roll or duplicate a special branch');
assert.equal((createBranch.match(/maybeSpecialBranch\(x\)/g)||[]).length,1,
  'a newly created generated room must attempt special branch planning exactly once');
ordered(createBranch,[
  'saveRt(x);placeSceneForRoom(x,kind,made.result)',
  "if(kind==='rest')applyRest200(x)",
  'maybeSpecialBranch(x)',
  'assignEnemyCells(x)',
  'initLock(x)',
  'maybeDoorChallenge(x)',
  'saveRt(x);render();roomIntro(x,made.result)'
],'generated branch callsite order');

function runScenario({config,map=true,free=4,rolls=[]}){
  const events=[];
  const x={room:3,last:{map:map?{size:5,cells:Array(25).fill('floor')}:null}};
  if(map)x.last.map.cells[4]='marker';
  const math=Object.create(Math);
  let ri=0;
  math.random=()=>{
    events.push('random');
    assert.ok(ri<rolls.length,'unexpected random draw');
    return rolls[ri++];
  };
  const sandbox={
    Math:math,
    cfg:()=>{events.push('cfg');return config||{}},
    nearestFree:()=>{events.push('nearestFree');return free},
    addDungeonSceneElement:(el)=>{
      events.push('addScene');
      assert.equal(x.last.map.cells[free],'marker',
        'scene element must be created before Core 2.00 mutates the map cell');
      return {...el,id:'scene-1'};
    }
  };
  sandbox.window=sandbox;
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dungeonEntry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
  vm.runInContext(line+'\nthis.__maybeSpecialBranch=maybeSpecialBranch;',sandbox,{filename:'maybeSpecialBranch.js'});
  const result=sandbox.__maybeSpecialBranch(x);
  return {result:JSON.parse(JSON.stringify(result)),x,events,draws:ri};
}

let s=runScenario({config:{specialBranchChance:100},map:false,rolls:[]});
assert.equal(s.result,null,'missing map must skip branch planning');
assert.equal(s.draws,0,'missing map must not consume RNG');

s=runScenario({config:{specialBranchChance:20},rolls:[0.20]});
assert.equal(s.result,null,'roll exactly at configured percent boundary must reject branch');
assert.deepEqual(s.events,['cfg','random'],'chance rejection must stop before nearest-free search');
assert.equal(s.draws,1,'chance rejection must consume exactly one random draw');

s=runScenario({config:{specialBranchChance:100},free:-1,rolls:[0.42]});
assert.equal(s.result,null,'no free cell must reject branch materialization');
assert.deepEqual(s.events,['cfg','random','nearestFree'],'no-free-cell rejection must stop before type roll');
assert.equal(s.draws,1,'no free cell must not consume the type random draw');

s=runScenario({config:{specialBranchChance:100},rolls:[0.99,0.10]});
assert.equal(s.result.branchType,'treasure','default weights must select treasure in the first 45 percent');
assert.equal(s.result.name,'Cache souterraine','treasure branch label must remain unchanged');
assert.equal(s.x.last.map.cells[4],'trapdoor','accepted branch must materialize the trapdoor cell');
assert.deepEqual(s.events,['cfg','random','nearestFree','random','addScene'],
  'accepted branch must preserve random/free-cell/materialization order');
assert.equal(s.draws,2,'accepted branch must consume exactly two random draws');

s=runScenario({config:{specialBranchChance:100},rolls:[0.99,0.50]});
assert.equal(s.result.branchType,'boss','default weights must select boss after treasure');
assert.equal(s.result.name,'Trappe inquiétante','boss branch label must remain unchanged');

s=runScenario({config:{specialBranchChance:100},rolls:[0.99,0.90]});
assert.equal(s.result.branchType,'secret','default weights must select secret in the final range');
assert.equal(s.result.name,'Passage secret','secret branch label must remain unchanged');

s=runScenario({
  config:{specialBranchChance:100,specialBranchWeights:{treasure:0,boss:0,secret:7}},
  rolls:[0.99,0.25]
});
assert.equal(s.result.branchType,'secret','configured branch weights must override defaults');

assert.doesNotMatch(authored,/maybeSpecialBranch|specialBranchChance|specialBranchWeights/,
  'authored runtime must remain outside generated branch planning');
assert.doesNotMatch(authoredBranchContent,/maybeSpecialBranch|specialBranchChance|specialBranchWeights/,
  'authored secondary-branch content owner must remain outside generated planning');
assert.doesNotMatch(authoredBranchNav,/maybeSpecialBranch|specialBranchChance|specialBranchWeights/,
  'authored secondary-branch navigation owner must remain outside generated planning');

console.log(JSON.stringify({
  scenario:'Phase 7 generated special branch planning characterization',
  runtime:{bytes:bytes.length,gitBlob},
  callsite:'new generated rooms only',
  randomDraws:{rejected:1,noFreeCell:1,accepted:2},
  defaultWeights:{treasure:45,boss:25,secret:30},
  materialization:['addDungeonSceneElement','map cell -> trapdoor'],
  authored:'separate and unchanged'
},null,2));
