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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167048,
  'dc200Branch RED must start from the exact lot 31 GREEN runtime size');
assert.equal(gitBlob,'3438e75b607d0b9bb68eb1d3edc2d97b3bd662ed',
  'dc200Branch RED must start from the exact lot 31 GREEN runtime blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.shouldDefaultGeneratedRoomEnemyBranch,
  'function',
  'Phase 7 lot 32 requires Dungeon-owned pure dc200Branch default predicate'
);

const shouldDefault=sandbox.GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch;

assert.equal(shouldDefault({dungeonRoom:4},4),true,
  'matching numeric room with undefined marker must default');
assert.equal(shouldDefault({dungeonRoom:'4'},4),true,
  'numeric-string enemy room must preserve Number coercion');
assert.equal(shouldDefault({dungeonRoom:4},'4'),true,
  'numeric-string current room must preserve Number coercion');
assert.equal(shouldDefault({dungeonRoom:5},4),false,
  'different room must not default');
assert.equal(shouldDefault({},0),true,
  'missing dungeonRoom must preserve historical ||0 fallback');
assert.equal(shouldDefault({dungeonRoom:''},0),true,
  'empty dungeonRoom must preserve historical ||0 fallback');
assert.equal(shouldDefault({dungeonRoom:null},0),true,
  'null dungeonRoom must preserve historical ||0 fallback');

for(const marker of [false,true,null,0,'']){
  assert.equal(
    shouldDefault({dungeonRoom:4,dc200Branch:marker},4),
    false,
    'already-defined marker must remain untouched: '+String(marker)
  );
}

assert.throws(
  ()=>shouldDefault(null,4),
  error=>error&&error.name==='TypeError',
  'pure predicate must preserve direct-property-access failure semantics for invalid enemy values'
);

const fnMatch=entry.match(/function shouldDefaultGeneratedRoomEnemyBranch\(enemy,room\)\{[\s\S]*?\n  \}/);
assert.ok(fnMatch,'pure dc200Branch predicate source must remain extractable');
assert.match(fnMatch[0],
  /return Number\(enemy\.dungeonRoom\|\|0\)===Number\(room\)&&enemy\.dc200Branch===undefined/,
  'predicate must preserve the exact historical boolean rule');
assert.doesNotMatch(fnMatch[0],
  /Math\.random|\bcfg\(|document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|loadActiveEnemies|saveActiveEnemies/,
  'dc200Branch predicate must stay pure and infrastructure-free');

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
  (createSource.match(/GensDungeonV1\.exploration\.shouldDefaultGeneratedRoomEnemyBranch\(e,room\)/g)||[]).length,
  1,
  'Core 2.00 createRoom must consume the Dungeon predicate exactly once'
);

assert.match(createSource,
  /try\{const all=loadActiveEnemies\?\.\(\)\|\|\[\];all\.forEach\(e=>\{if\(GensDungeonV1\.exploration\.shouldDefaultGeneratedRoomEnemyBranch\(e,room\)\)e\.dc200Branch=false\}\);saveActiveEnemies\?\.\(all\)\}catch\(e\)\{\}/,
  'Core 2.00 must retain load, loop, mutation, save and try/catch while delegating only the boolean rule');

assert.doesNotMatch(createSource,
  /Number\(e\.dungeonRoom\|\|0\)===Number\(room\)&&e\.dc200Branch===undefined/,
  'Core 2.00 must retire only the duplicated boolean rule');

assert.match(createSource,/loadActiveEnemies\?\.\(\)\|\|\[\]/,
  'enemy loading must remain Core 2.00');
assert.match(createSource,/e\.dc200Branch=false/,
  'actual enemy mutation must remain Core 2.00');
assert.match(createSource,/saveActiveEnemies\?\.\(all\)/,
  'enemy persistence must remain Core 2.00');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated dc200Branch pure rule owner',
  expected:'RED before predicate + exact Core 2.00 delegation',
  pureOwner:'GensDungeonV1.exploration.shouldDefaultGeneratedRoomEnemyBranch',
  retainedCoreResponsibilities:['load','forEach','mutation','save','try/catch']
},null,2));
