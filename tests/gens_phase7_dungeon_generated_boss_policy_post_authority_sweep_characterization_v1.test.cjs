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

assert.equal(bytes.length,8166499,
  'post-authority Boss characterization must track the current exact runtime size');
assert.equal(gitBlob,'20381d1df0b10b664d5163f308f909cd7a6e45df',
  'post-authority Boss characterization must track the current exact runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const chooseMatch=core200.match(/function chooseKind\(room\)\{[\s\S]*?\}\nfunction selectedChallenges\(/);
assert.ok(chooseMatch,'Core 2.00 chooseKind source must remain extractable');
const chooseSource=chooseMatch[0].replace(/\nfunction selectedChallenges\([\s\S]*$/,'');

assert.equal((chooseSource.match(/GensDungeonV1\.exploration\.planGeneratedBossPolicy\(/g)||[]).length,1,
  'Core 2.00 must delegate generated Boss policy exactly once');
assert.match(chooseSource,
  /const bossPlan=GensDungeonV1\.exploration\.planGeneratedBossPolicy\(room,c\.rooms,c\.boss,c\.bossEvery,c\.bossRooms,c\.bossChance\);if\(bossPlan\.status==='boss'\)return'boss';if\(bossPlan\.status==='random'&&Math\.random\(\)\*100<bossPlan\.chance\)return'boss'/,
  'Core 2.00 must preserve lazy Boss RNG around the pure planner');
assert.doesNotMatch(chooseSource,/c\.boss!==['"]none['"]&&room===Number\(c\.rooms\)|c\.boss===['"]everyN['"]|c\.boss===['"]specific['"]|Math\.max\(0,Number\(c\.bossChance\)\|\|13\)/,
  'Boss policy decisions must no longer be duplicated inline');
assert.match(chooseSource,/GensDungeonV1\.exploration\.pickWeightedGeneratedRoomKind\(c\.roomWeights,Math\.random\(\)\)/,
  'non-Boss fallback must remain delegated with its own explicit RNG');

const sandbox={CONFIG:null,rolls:[]};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.Math=Object.create(Math);
sandbox.Math.random=()=>{
  assert.ok(sandbox.rolls.length>0,'unexpected extra Math.random call');
  return sandbox.rolls.shift();
};
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
sandbox.cfg=()=>sandbox.CONFIG;
vm.runInContext(chooseSource+';this.chooseKind=chooseKind;',sandbox,{filename:'dungeonCore200Rebuild.chooseKind.js'});

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedRoomKind,'function',
  'weighted generated room-kind owner must remain present');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.planGeneratedBossPolicy,'function',
  'Boss planner must own pure generated Boss policy after the isolated raccord');

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

assert.deepEqual(run({boss:'final'},10,[]),{result:'boss',draws:0,remaining:[]});
assert.deepEqual(run({boss:'final'},9,[0]),{result:'enemy',draws:1,remaining:[]});

assert.deepEqual(run({boss:'everyN',bossEvery:5},5,[]),{result:'boss',draws:0,remaining:[]});
assert.deepEqual(run({boss:'everyN',bossEvery:0},5,[]),{result:'boss',draws:0,remaining:[]});
assert.deepEqual(run({boss:'everyN',bossEvery:-2},1,[]),{result:'boss',draws:0,remaining:[]});

assert.deepEqual(run({boss:'specific',bossRooms:'2, 4,7'},4,[]),{result:'boss',draws:0,remaining:[]});
assert.deepEqual(run({boss:'specific',bossRooms:'2, 4,7'},3,[0]),{result:'enemy',draws:1,remaining:[]});

assert.deepEqual(run({boss:'random',bossChance:13},2,[0]),{result:'enemy',draws:1,remaining:[]});
assert.deepEqual(run({boss:'random',bossChance:13},3,[0.10]),{result:'boss',draws:1,remaining:[]});
assert.deepEqual(run({boss:'random',bossChance:13},3,[0.50,0]),{result:'enemy',draws:2,remaining:[]});
assert.deepEqual(run({boss:'random',bossChance:0},3,[0.12]),{result:'boss',draws:1,remaining:[]});
assert.deepEqual(run({boss:'random',bossChance:-5},3,[0,0]),{result:'enemy',draws:2,remaining:[]});

assert.deepEqual(run({boss:'random',bossChance:100},10,[]),{result:'boss',draws:0,remaining:[]});
assert.deepEqual(run({boss:'none'},10,[0]),{result:'enemy',draws:1,remaining:[]});

assert.doesNotMatch(authored,/chooseKind\(|planGeneratedBossPolicy|bossChance|bossEvery/,
  'Authored World Builder must remain outside generated Boss policy');

console.log(JSON.stringify({
  scenario:'Phase 7 generated Boss policy post-authority-sweep characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'Core 2.00 chooseKind',
  expectedPlanner:'GensDungeonV1.exploration.planGeneratedBossPolicy',
  rngOwner:'Core 2.00 chooseKind',
  authored:'separate and unchanged'
},null,2));
