'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const core01=block('gensDungeonCore01Js');

assert.equal((core200.match(/function\s+chooseKind\s*\(/g)||[]).length,1,
  'Core 2.00 must keep one final generated room-kind owner');
assert.equal((core200.match(/chooseKind\(x\.room\)/g)||[]).length,1,
  'generated explore must consume chooseKind exactly once');
assert.match(core200,/if\(c\.boss!==['"]none['"]&&room===Number\(c\.rooms\)\)return['"]boss['"]/,
  'final-room Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]everyN['"]&&room%Math\.max\(1,Number\(c\.bossEvery\)\|\|5\)===0\)return['"]boss['"]/,
  'everyN Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]specific['"]&&explicit\.includes\(room\)\)return['"]boss['"]/,
  'specific Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]random['"]&&room>2&&Math\.random\(\)\*100<Math\.max\(0,Number\(c\.bossChance\)\|\|13\)\)return['"]boss['"]/,
  'random Boss policy and its first random call must remain in Core 2.00');
assert.doesNotMatch(core200,/const w=\{enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11,\.\.\.\(c\.roomWeights\|\|\{\}\)\}/,
  'Core 2.00 must retire the inline weighted room-kind calculation');
assert.match(core200,/GensDungeonV1\.exploration\.pickWeightedGeneratedRoomKind\(c\.roomWeights,Math\.random\(\)\)/,
  'Core 2.00 must delegate the weighted non-Boss selection with one explicit random roll');
assert.equal((core200.match(/Math\.random\(\)/g)||[]).length>=2,true,
  'Core 2.00 chooseKind path must currently contain Boss and weighted random sources');

const chooseMatch=core200.match(/function chooseKind\(room\)\{[\s\S]*?\}\nfunction selectedChallenges\(/);
assert.ok(chooseMatch,'chooseKind source must be extractable for deterministic characterization');
const chooseSource=chooseMatch[0].replace(/\nfunction selectedChallenges\([\s\S]*$/,'');

const sandbox={CONFIG:null,rolls:[]};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.Math=Object.create(Math);
sandbox.Math.random=()=>{
  assert.ok(sandbox.rolls.length>0,'unexpected extra Math.random call in chooseKind');
  return sandbox.rolls.shift();
};
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
sandbox.cfg=()=>sandbox.CONFIG;
vm.runInContext(chooseSource+';this.chooseKind=chooseKind;',sandbox,{filename:'dungeonCore200Rebuild.chooseKind.js'});

function run(config,room,rolls){
  sandbox.CONFIG=config;
  sandbox.rolls=[...rolls];
  const result=sandbox.chooseKind(room);
  return {result,remaining:[...sandbox.rolls]};
}

const base={
  rooms:10,
  boss:'none',
  bossEvery:5,
  bossChance:13,
  bossRooms:'',
  roomWeights:{enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11}
};

assert.deepEqual(run({...base,boss:'final'},10,[]),{result:'boss',remaining:[]},
  'final Boss must consume no weighted random draw');

assert.deepEqual(run(base,1,[0]),{result:'enemy',remaining:[]},
  'zero roll must select the first weighted room kind');
assert.deepEqual(run(base,1,[0.5]),{result:'trap',remaining:[]},
  'default weighted thresholds must remain unchanged');

const custom={
  ...base,
  roomWeights:{enemy:0,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0,portal:5}
};
assert.deepEqual(run(custom,1,[0.4]),{result:'portal',remaining:[]},
  'custom extra roomWeight keys must remain eligible in insertion order');

const zeroed={
  ...base,
  roomWeights:{enemy:-2,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0}
};
assert.deepEqual(run(zeroed,1,[0.7]),{result:'enemy',remaining:[]},
  'all non-positive weights must preserve the enemy fallback');

const randomBoss={...base,boss:'random',bossChance:13};
assert.deepEqual(run(randomBoss,3,[0.10]),{result:'boss',remaining:[]},
  'successful random Boss decision must consume exactly one random draw');
assert.deepEqual(run(randomBoss,3,[0.50,0]),{result:'enemy',remaining:[]},
  'failed random Boss decision must consume one Boss draw then one weighted draw');

assert.doesNotMatch(authored,/chooseKind\(|pickWeightedGeneratedRoomKind/,
  'Authored World Builder travel must remain outside generated room-kind weighting');
assert.match(entry,/planGeneratedAdvance/,
  'Phase 7 prior generated advance API must remain present');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room-kind weighting characterization',
  finalOwner:'dungeonCore200Rebuild.chooseKind -> GensDungeonV1.exploration.pickWeightedGeneratedRoomKind',
  consumer:'generated explore',
  weightedDefaults:['enemy','ambush','trap','chest','merchant','rest','mystery'],
  bossPolicy:'remains Core 2.00',
  authored:'unchanged',
  randomConsumption:{
    finalBoss:0,
    randomBossSuccess:1,
    randomBossFailThenWeight:2,
    normalWeighted:1
  }
},null,2));
