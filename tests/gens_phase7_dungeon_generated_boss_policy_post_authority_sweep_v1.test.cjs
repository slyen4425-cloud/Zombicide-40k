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

assert.equal(bytes.length,8165823,
  'Boss-policy RED must start from the exact post-authority-sweep runtime size');
assert.equal(gitBlob,'26421e0347305437fe2b1dc149b3e4fb8b3761bd',
  'Boss-policy RED must start from the exact post-authority-sweep runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.planGeneratedBossPolicy,
  'function',
  'Phase 7 lot 30 requires Dungeon-owned pure generated Boss policy planning'
);

const plan=sandbox.GensDungeonV1.exploration.planGeneratedBossPolicy;
const norm=v=>JSON.parse(JSON.stringify(v));

assert.deepEqual(norm(plan(10,10,'final',5,'',13)),{status:'boss',chance:null});
assert.deepEqual(norm(plan(10,10,'random',5,'',100)),{status:'boss',chance:null});
assert.deepEqual(norm(plan(10,10,'none',5,'',13)),{status:'none',chance:null});

assert.deepEqual(norm(plan(5,10,'everyN',5,'',13)),{status:'boss',chance:null});
assert.deepEqual(norm(plan(5,10,'everyN',0,'',13)),{status:'boss',chance:null});
assert.deepEqual(norm(plan(1,10,'everyN',-2,'',13)),{status:'boss',chance:null});

assert.deepEqual(norm(plan(4,10,'specific',5,'2, 4,7',13)),{status:'boss',chance:null});
assert.deepEqual(norm(plan(3,10,'specific',5,'2, 4,7',13)),{status:'none',chance:null});

assert.deepEqual(norm(plan(2,10,'random',5,'',13)),{status:'none',chance:null});
assert.deepEqual(norm(plan(3,10,'random',5,'',13)),{status:'random',chance:13});
assert.deepEqual(norm(plan(3,10,'random',5,'',0)),{status:'random',chance:13});
assert.deepEqual(norm(plan(3,10,'random',5,'',-5)),{status:'random',chance:0});
assert.deepEqual(norm(plan(3,10,'random',5,'','bad')),{status:'random',chance:13});
assert.deepEqual(norm(plan('10',10,'final',5,'',13)),{status:'none',chance:null});
assert.deepEqual(norm(plan('4',10,'specific',5,'2,4,7',13)),{status:'none',chance:null});

const a=plan(3,10,'random',5,'',13);
const b=plan(3,10,'random',5,'',13);
assert.notEqual(a,b,'Boss policy planner must return a fresh plain object');

assert.doesNotMatch(entry,/Math\.random\(|\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener/,
  'Dungeon Boss planner must stay pure and infrastructure-free');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon Boss planner must not consume another module runtime');

const core200=block('dungeonCore200Rebuild');
const chooseMatch=core200.match(/function chooseKind\(room\)\{[\s\S]*?\}\nfunction selectedChallenges\(/);
assert.ok(chooseMatch,'Core 2.00 chooseKind source must remain extractable');
const choose=chooseMatch[0].replace(/\nfunction selectedChallenges\([\s\S]*$/,'');

assert.equal((choose.match(/GensDungeonV1\.exploration\.planGeneratedBossPolicy\(/g)||[]).length,1,
  'Core 2.00 chooseKind must consume the Dungeon Boss plan exactly once');
assert.match(
  choose,
  /const bossPlan=GensDungeonV1\.exploration\.planGeneratedBossPolicy\(room,c\.rooms,c\.boss,c\.bossEvery,c\.bossRooms,c\.bossChance\);if\(bossPlan\.status==='boss'\)return'boss';if\(bossPlan\.status==='random'&&Math\.random\(\)\*100<bossPlan\.chance\)return'boss'/,
  'Core 2.00 must preserve lazy Boss RNG after the pure plan'
);
assert.doesNotMatch(choose,/c\.boss!==['"]none['"]&&room===Number\(c\.rooms\)/);
assert.doesNotMatch(choose,/c\.boss===['"]everyN['"]/);
assert.doesNotMatch(choose,/c\.boss===['"]specific['"]/);
assert.doesNotMatch(choose,/Math\.max\(0,Number\(c\.bossChance\)\|\|13\)/);
assert.match(choose,/GensDungeonV1\.exploration\.pickWeightedGeneratedRoomKind\(c\.roomWeights,Math\.random\(\)\)/);
assert.equal((choose.match(/Math\.random\(\)/g)||[]).length,2,
  'Core 2.00 must retain exactly random-Boss RNG and weighted-room RNG');

assert.doesNotMatch(authored,/planGeneratedBossPolicy/,
  'Authored World Builder must remain outside generated Boss planning');

console.log(JSON.stringify({
  scenario:'Phase 7 generated Boss policy post-authority-sweep guard',
  expected:'RED before pure planner + Core 2.00 raccord; GREEN after the isolated micro-diff',
  pureOwner:'GensDungeonV1.exploration.planGeneratedBossPolicy',
  rngOwner:'Core 2.00 chooseKind',
  weightedOwner:'GensDungeonV1.exploration.pickWeightedGeneratedRoomKind'
},null,2));
