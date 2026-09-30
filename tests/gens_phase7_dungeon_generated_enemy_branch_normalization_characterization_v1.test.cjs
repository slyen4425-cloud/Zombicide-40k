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

assert.equal(bytes.length,8169442,
  'enemy branch normalization characterization must track the exact lot 31 runtime size');
assert.equal(gitBlob,'a37acaabcb3202a8527c2d545f9e2ff4466ea1db',
  'enemy branch normalization characterization must track the exact lot 31 runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const createMatch=core200.match(/function createRoom\(room,kind\)\{[\s\S]*?\}\nfunction placeSceneForRoom\(/);
assert.ok(createMatch,'Core 2.00 createRoom source must remain extractable');
const createSource=createMatch[0].replace(/\nfunction placeSceneForRoom\([\s\S]*$/,'');

assert.match(createSource,
  /Number\(e\.dungeonRoom\|\|0\)===Number\(room\)&&e\.dc200Branch===undefined/,
  'current normalization predicate must remain directly characterizable');
assert.match(createSource,/loadActiveEnemies\?\.\(\)\|\|\[\]/,
  'enemy loading must remain Core 2.00');
assert.match(createSource,/saveActiveEnemies\?\.\(all\)/,
  'enemy persistence must remain Core 2.00');

const sandbox={activeEnemies:[],saved:null};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.cfg=()=>({map:false});
sandbox.dungeonEncounter=()=>({title:'ENCOUNTER',text:'encounter',enemyQty:0});
sandbox.dungeonBossRoom=()=>({title:'BOSS',text:'boss',enemyQty:0});
sandbox.dungeonPickTrapType=()=>({name:'Rune',id:'rune'});
sandbox.loadActiveEnemies=()=>sandbox.activeEnemies;
sandbox.saveActiveEnemies=all=>{sandbox.saved=all;};
sandbox.generateDungeonMap=()=>{throw new Error('map=false must not generate a map');};

vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});

function clone(v){return JSON.parse(JSON.stringify(v));}
function run(room,enemies){
  sandbox.activeEnemies=enemies.map(v=>({...v}));
  sandbox.saved=null;
  sandbox.createRoom(room,'chest');
  return clone(sandbox.saved);
}

let saved=run(4,[
  {id:'same-number',dungeonRoom:4},
  {id:'same-string',dungeonRoom:'4'},
  {id:'other',dungeonRoom:5},
  {id:'false-existing',dungeonRoom:4,dc200Branch:false},
  {id:'true-existing',dungeonRoom:4,dc200Branch:true},
  {id:'null-existing',dungeonRoom:4,dc200Branch:null}
]);
assert.equal(saved[0].dc200Branch,false,'same numeric room + undefined marker must initialize false');
assert.equal(saved[1].dc200Branch,false,'numeric-string room + undefined marker must initialize false');
assert.equal(Object.prototype.hasOwnProperty.call(saved[2],'dc200Branch'),false,
  'different room must remain untouched');
assert.equal(saved[3].dc200Branch,false,'existing false marker must be preserved');
assert.equal(saved[4].dc200Branch,true,'existing true marker must be preserved');
assert.equal(saved[5].dc200Branch,null,'existing null marker must be preserved');

saved=run('4',[
  {id:'numeric',dungeonRoom:4},
  {id:'numeric-string',dungeonRoom:'04'},
  {id:'decimal-string',dungeonRoom:'4.0'}
]);
for(const e of saved){
  assert.equal(e.dc200Branch,false,
    'room comparison must preserve historical Number(...) coercion for '+e.id);
}

saved=run(0,[
  {id:'missing'},
  {id:'undefined',dungeonRoom:undefined},
  {id:'empty',dungeonRoom:''},
  {id:'falsey',dungeonRoom:false},
  {id:'null-room',dungeonRoom:null}
]);
for(const e of saved){
  assert.equal(e.dc200Branch,false,
    'falsy dungeonRoom values must preserve historical ||0 fallback for '+e.id);
}

saved=run('bad',[
  {id:'same-bad',dungeonRoom:'bad'},
  {id:'other-bad',dungeonRoom:'NaN'}
]);
for(const e of saved){
  assert.equal(Object.prototype.hasOwnProperty.call(e,'dc200Branch'),false,
    'NaN comparisons must remain false under strict equality');
}

assert.doesNotMatch(entry,/shouldInitializeGeneratedEnemyBranch/,
  'audit characterization must precede any extracted helper');
assert.doesNotMatch(authored,/dc200Branch/,
  'authored runtime must remain outside generated dc200Branch normalization');

console.log(JSON.stringify({
  scenario:'Phase 7 generated enemy branch normalization characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'dungeonCore200Rebuild.createRoom',
  predicate:'Number(enemy.dungeonRoom||0)===Number(room) && enemy.dc200Branch===undefined',
  coercion:'historical Number(...) with dungeonRoom || 0 fallback',
  mutation:'Core 2.00 only',
  persistence:'Core 2.00 only',
  authored:'separate and unchanged'
},null,2));
