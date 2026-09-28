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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 generated Boss policy characterization must track the micro-lot 6 runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 generated Boss policy characterization must track the exact micro-lot 6 blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const chooseMatch=core200.match(/function chooseKind\(room\)\{[\s\S]*?\}\nfunction selectedChallenges\(/);
assert.ok(chooseMatch,'Core 2.00 chooseKind source must remain extractable');
const chooseSource=chooseMatch[0].replace(/\nfunction selectedChallenges\([\s\S]*$/,'');

assert.match(chooseSource,/if\(c\.boss!==['"]none['"]&&room===Number\(c\.rooms\)\)return['"]boss['"]/,
  'final-room Boss rule must remain first');
assert.match(chooseSource,/if\(c\.boss===['"]everyN['"]&&room%Math\.max\(1,Number\(c\.bossEvery\)\|\|5\)===0\)return['"]boss['"]/,
  'everyN Boss rule must remain after final-room policy');
assert.match(chooseSource,/if\(c\.boss===['"]specific['"]&&explicit\.includes\(room\)\)return['"]boss['"]/,
  'specific Boss rule must remain after everyN policy');
assert.match(chooseSource,/if\(c\.boss===['"]random['"]&&room>2&&Math\.random\(\)\*100<Math\.max\(0,Number\(c\.bossChance\)\|\|13\)\)return['"]boss['"]/,
  'random Boss rule must remain lazy and after deterministic Boss policies');
assert.match(chooseSource,/GensDungeonV1\.exploration\.pickWeightedGeneratedRoomKind\(c\.roomWeights,Math\.random\(\)\)/,
  'non-Boss fallback must remain delegated with its own explicit random roll');

const sandbox={CONFIG:null,rolls:[]};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.Math=Object.create(Math);
sandbox.Math.random=()=>{
  assert.ok(sandbox.rolls.length>0,'unexpected extra Math.random call in generated Boss characterization');
  return sandbox.rolls.shift();
};
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
sandbox.cfg=()=>sandbox.CONFIG;
vm.runInContext(chooseSource+';this.chooseKind=chooseKind;',sandbox,{filename:'dungeonCore200Rebuild.chooseKind.js'});

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedRoomKind,'function',
  'prior weighted generated room-kind owner must remain present');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.shouldCreateGeneratedBossRoom,'undefined',
  'Boss policy characterization must stay GREEN before any dedicated Boss-policy extraction');

const defaults={
  rooms:10,
  boss:'none',
  bossEvery:5,
  bossChance:13,
  bossRooms:'',
  roomWeights:{enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11}
};

function run(config,room,rolls=[]){
  sandbox.CONFIG={...defaults,...config};
  sandbox.rolls=[...rolls];
  const before=sandbox.rolls.length;
  const result=sandbox.chooseKind(room);
  return {result,draws:before-sandbox.rolls.length,remaining:[...sandbox.rolls]};
}

assert.deepEqual(run({boss:'final'},10,[]),{result:'boss',draws:0,remaining:[]},
  'final mode on final room must select Boss without RNG');
assert.deepEqual(run({boss:'final'},9,[0]),{result:'enemy',draws:1,remaining:[]},
  'final mode before final room must use only the weighted room-kind RNG');

assert.deepEqual(run({boss:'everyN',bossEvery:5},5,[]),{result:'boss',draws:0,remaining:[]},
  'everyN matching room must select Boss without RNG');
assert.deepEqual(run({boss:'everyN',bossEvery:0},5,[]),{result:'boss',draws:0,remaining:[]},
  'invalid/zero bossEvery must preserve historical fallback to 5');
assert.deepEqual(run({boss:'everyN',bossEvery:-2},1,[]),{result:'boss',draws:0,remaining:[]},
  'negative bossEvery must clamp through historical max(1, value) semantics');

assert.deepEqual(run({boss:'specific',bossRooms:'2, 4,7'},4,[]),{result:'boss',draws:0,remaining:[]},
  'specific mode must honor comma-separated explicit rooms without RNG');
assert.deepEqual(run({boss:'specific',bossRooms:'2, 4,7'},3,[0]),{result:'enemy',draws:1,remaining:[]},
  'specific non-match must fall through to exactly one weighted RNG');

assert.deepEqual(run({boss:'random',bossChance:13},2,[0]),{result:'enemy',draws:1,remaining:[]},
  'random mode at room <=2 must not consume a Boss RNG and must use only weighting');
assert.deepEqual(run({boss:'random',bossChance:13},3,[0.10]),{result:'boss',draws:1,remaining:[]},
  'successful random Boss must consume exactly one RNG total');
assert.deepEqual(run({boss:'random',bossChance:13},3,[0.50,0]),{result:'enemy',draws:2,remaining:[]},
  'failed random Boss must consume Boss RNG then weighted RNG');
assert.deepEqual(run({boss:'random',bossChance:0},3,[0.12]),{result:'boss',draws:1,remaining:[]},
  'zero bossChance must preserve historical ||13 fallback');
assert.deepEqual(run({boss:'random',bossChance:-5},3,[0,0]),{result:'enemy',draws:2,remaining:[]},
  'negative bossChance must clamp to zero then fall through to weighting');

assert.deepEqual(run({boss:'random',bossChance:100},10,[]),{result:'boss',draws:0,remaining:[]},
  'final-room policy must take priority over random Boss mode and consume no RNG');
assert.deepEqual(run({boss:'none'},10,[0]),{result:'enemy',draws:1,remaining:[]},
  'boss none must disable final-room Boss and use weighted fallback');

assert.doesNotMatch(authored,/chooseKind\(|shouldCreateGeneratedBossRoom|bossChance|bossEvery/,
  'Authored World Builder must remain outside generated Boss policy');

console.log(JSON.stringify({
  scenario:'Phase 7 generated Boss policy characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'Core 2.00 chooseKind',
  priority:['final-room when boss != none','everyN','specific','random','weighted non-Boss'],
  randomConsumption:{
    deterministicBoss:0,
    deterministicMiss:1,
    randomRoomAtMost2:1,
    randomBossSuccess:1,
    randomBossFail:2
  },
  weightedOwner:'GensDungeonV1.exploration.pickWeightedGeneratedRoomKind',
  authored:'separate and unchanged'
},null,2));
