'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const core=block('dungeonCore200Rebuild');
const start=core.indexOf('function chooseKind(room){');
const end=core.indexOf('\nfunction selectedChallenges()',start);
assert.ok(start>=0&&end>start,'Core 2.00 chooseKind owner must remain locatable');
const chooseSrc=core.slice(start,end);

assert.match(chooseSrc,/if\(c\.boss!=='none'&&room===Number\(c\.rooms\)\)return'boss'/,
  'final-room Boss rule must remain in Core 2.00');
assert.match(chooseSrc,/if\(c\.boss==='everyN'/,
  'everyN Boss rule must remain in Core 2.00');
assert.match(chooseSrc,/if\(c\.boss==='specific'/,
  'specific Boss rule must remain in Core 2.00');
assert.match(chooseSrc,/if\(c\.boss==='random'/,
  'random Boss rule must remain in Core 2.00');

let activeCfg={};
let rolls=[];
let randomCalls=0;

const math=Object.create(Math);
math.random=()=>{
  randomCalls++;
  assert.ok(rolls.length,'unexpected Math.random call');
  return rolls.shift();
};

const sandbox={
  cfg:()=>activeCfg,
  Math:math,
  GensDungeonV1:{
    exploration:{
      // Compatibility stub for the future seam: unused on the current base,
      // used only by chooseKind after the weighted selection delegates.
      pickGeneratedRoomKind(weights,roll){
        const entries=Object.entries(weights).map(([k,v])=>[k,Math.max(0,Number(v)||0)]);
        const total=entries.reduce((n,x)=>n+x[1],0)||1;
        let r=roll*total;
        for(const [k,v] of entries){
          r-=v;
          if(r<=0)return k;
        }
        return 'enemy';
      }
    }
  }
};

vm.createContext(sandbox);
const chooseKind=vm.runInContext(chooseSrc+'\nchooseKind;',sandbox,{filename:'dungeonCore200Rebuild.chooseKind.js'});
assert.equal(typeof chooseKind,'function');

function run(cfg,room,randomValues){
  activeCfg=cfg;
  rolls=[...randomValues];
  randomCalls=0;
  const value=chooseKind(room);
  return {value,calls:randomCalls,remaining:[...rolls]};
}

const baseWeights={
  enemy:0,
  ambush:0,
  trap:0,
  chest:0,
  merchant:0,
  rest:0,
  mystery:0
};

assert.deepEqual(
  run({rooms:10,boss:'everyN',bossEvery:5,bossRooms:'',roomWeights:baseWeights},10,[]),
  {value:'boss',calls:0,remaining:[]},
  'final configured room must remain a deterministic Boss without weighted RNG'
);

assert.deepEqual(
  run({rooms:10,boss:'everyN',bossEvery:5,bossRooms:'',roomWeights:baseWeights},5,[]),
  {value:'boss',calls:0,remaining:[]},
  'everyN Boss must remain deterministic'
);

assert.deepEqual(
  run({rooms:10,boss:'specific',bossRooms:'3',roomWeights:baseWeights},3,[]),
  {value:'boss',calls:0,remaining:[]},
  'specific Boss room must remain deterministic'
);

assert.deepEqual(
  run({rooms:10,boss:'random',bossChance:13,bossRooms:'',roomWeights:baseWeights},3,[0.12]),
  {value:'boss',calls:1,remaining:[]},
  'successful random Boss must consume exactly one RNG call'
);

assert.deepEqual(
  run({
    rooms:10,boss:'random',bossChance:13,bossRooms:'',
    roomWeights:{...baseWeights,chest:1}
  },3,[0.50,0.25]),
  {value:'chest',calls:2,remaining:[]},
  'failed random Boss check must preserve a second RNG call for weighted room selection'
);

assert.deepEqual(
  run({
    rooms:10,boss:'none',bossRooms:'',
    roomWeights:{...baseWeights,enemy:1,chest:1}
  },2,[0.50]),
  {value:'enemy',calls:1,remaining:[]},
  'weighted boundary r==enemy weight must keep the historical <= 0 selection'
);

assert.deepEqual(
  run({
    rooms:10,boss:'none',bossRooms:'',
    roomWeights:{...baseWeights,enemy:-9,chest:1,mystery:'bad'}
  },2,[0.40]),
  {value:'chest',calls:1,remaining:[]},
  'negative/invalid weighted values must still normalize to zero'
);

assert.deepEqual(
  run({
    rooms:10,boss:'none',bossRooms:'',
    roomWeights:{...baseWeights}
  },2,[0.80]),
  {value:'enemy',calls:1,remaining:[]},
  'all-zero weights must preserve the historical enemy fallback'
);

console.log(JSON.stringify({
  scenario:'Phase 7 generated room-kind weighted selection characterization',
  owner:'dungeonCore200Rebuild.chooseKind',
  bossRules:'Core 2.00',
  weightedSemantics:'characterized',
  randomCallContract:{
    deterministicBoss:0,
    randomBossSuccess:1,
    randomBossMissThenWeighted:2,
    ordinaryWeighted:1
  },
  targetSeam:'GensDungeonV1.exploration.pickGeneratedRoomKind(weights, roll)'
},null,2));
