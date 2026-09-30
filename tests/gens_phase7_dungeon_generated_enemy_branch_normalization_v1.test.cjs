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

assert.equal(bytes.length,8169446,
  'enemy branch normalization RED must start from the exact lot 31 runtime size');
assert.equal(gitBlob,'8a70856f20102270dc7f3553dcef74fe1dc45ad8',
  'enemy branch normalization RED must start from the exact lot 31 runtime blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.shouldInitializeGeneratedEnemyBranch,
  'function',
  'Phase 7 lot 32 requires Dungeon-owned pure generated enemy branch initialization predicate'
);

const shouldInit=sandbox.GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch;

assert.equal(shouldInit({dungeonRoom:4},4),true);
assert.equal(shouldInit({dungeonRoom:'4'},4),true);
assert.equal(shouldInit({dungeonRoom:'04'},'4'),true);
assert.equal(shouldInit({dungeonRoom:5},4),false);
assert.equal(shouldInit({dungeonRoom:4,dc200Branch:false},4),false);
assert.equal(shouldInit({dungeonRoom:4,dc200Branch:true},4),false);
assert.equal(shouldInit({dungeonRoom:4,dc200Branch:null},4),false);
assert.equal(shouldInit({},0),true);
assert.equal(shouldInit({dungeonRoom:''},'0'),true);
assert.equal(shouldInit({dungeonRoom:'bad'},'bad'),false);

const fnMatch=entry.match(/function shouldInitializeGeneratedEnemyBranch\(enemy,room\)\{[\s\S]*?\n  \}/);
assert.ok(fnMatch,'pure generated enemy branch predicate source must remain extractable');
assert.doesNotMatch(fnMatch[0],
  /=false|=true|loadActiveEnemies|saveActiveEnemies|localStorage|sessionStorage|indexedDB|\bcfg\(|Math\.random|document|MutationObserver|setTimeout|setInterval|addEventListener/,
  'generated enemy branch predicate must remain pure and mutation-free');

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
  (createSource.match(/GensDungeonV1\.exploration\.shouldInitializeGeneratedEnemyBranch\(e,room\)/g)||[]).length,
  1,
  'Core 2.00 must delegate the dc200Branch initialization decision exactly once'
);
assert.match(createSource,
  /if\(GensDungeonV1\.exploration\.shouldInitializeGeneratedEnemyBranch\(e,room\)\)e\.dc200Branch=false/,
  'Core 2.00 must retain the dc200Branch=false mutation around the pure predicate');
assert.doesNotMatch(createSource,
  /Number\(e\.dungeonRoom\|\|0\)===Number\(room\)&&e\.dc200Branch===undefined/,
  'Core 2.00 must retire the duplicated inline predicate');
assert.match(createSource,/loadActiveEnemies\?\.\(\)\|\|\[\]/,
  'enemy loading must remain Core 2.00');
assert.match(createSource,/saveActiveEnemies\?\.\(all\)/,
  'enemy persistence must remain Core 2.00');
assert.match(createSource,/cfg\(\)\.map===false\?null:generateDungeonMap\(kind,result\.enemyQty\|\|0\)/,
  'map generation boundary must remain Core 2.00');

assert.doesNotMatch(authored,/shouldInitializeGeneratedEnemyBranch/,
  'authored runtime must remain outside generated enemy branch normalization');

console.log(JSON.stringify({
  scenario:'Phase 7 generated enemy branch initialization predicate owner',
  expected:'RED before pure predicate + Core 2.00 raccord; GREEN after isolated micro-diff',
  pureOwner:'GensDungeonV1.exploration.shouldInitializeGeneratedEnemyBranch',
  retainedCoreResponsibilities:[
    'loadActiveEnemies',
    'enemy mutation',
    'saveActiveEnemies',
    'materialization order',
    'map generation'
  ]
},null,2));
