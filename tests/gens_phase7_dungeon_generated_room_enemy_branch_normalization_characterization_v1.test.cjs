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

assert.equal(bytes.length,8169430,
  'dc200Branch characterization must track the exact lot 31 GREEN runtime size');
assert.equal(gitBlob,'f523410e175ee4946059da8e8ee8519295fb63c5',
  'dc200Branch characterization must track the exact lot 31 GREEN runtime blob');

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
  /try\{const all=loadActiveEnemies\?\.\(\)\|\|\[\];all\.forEach\(e=>\{if\(GensDungeonV1\.exploration\.shouldDefaultGeneratedRoomEnemyBranch\(e,room\)\)e\.dc200Branch=false\}\);saveActiveEnemies\?\.\(all\)\}catch\(e\)\{\}/,
  'dc200Branch normalization must delegate only the boolean rule while preserving forEach and swallowed storage errors');

const sandbox={events:[],loaded:null,saved:null,config:{map:false}};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

sandbox.dungeonEncounter=room=>({title:'Encounter',text:'',enemyQty:0,room});
sandbox.dungeonBossRoom=room=>({title:'Boss',text:'',enemyQty:0,room});
sandbox.dungeonPickTrapType=()=>({name:'Piège',id:'trap'});
sandbox.cfg=()=>{
  sandbox.events.push('cfg');
  return sandbox.config;
};
sandbox.generateDungeonMap=(kind,qty)=>{
  sandbox.events.push('generateDungeonMap');
  return {kind,qty};
};
sandbox.loadActiveEnemies=()=>{
  sandbox.events.push('load');
  return sandbox.loaded;
};
sandbox.saveActiveEnemies=all=>{
  sandbox.events.push('save');
  sandbox.saved=all;
};

vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});

function run(room,enemies){
  sandbox.events=[];
  sandbox.saved=null;
  sandbox.loaded=enemies;
  sandbox.config={map:false};
  sandbox.createRoom(room,'chest');
  return {events:[...sandbox.events],saved:sandbox.saved};
}

const enemies=[
  {id:'n-match',dungeonRoom:4},
  {id:'s-match',dungeonRoom:'4'},
  {id:'other',dungeonRoom:5},
  {id:'already-false',dungeonRoom:4,dc200Branch:false},
  {id:'already-true',dungeonRoom:4,dc200Branch:true},
  {id:'already-null',dungeonRoom:4,dc200Branch:null},
  {id:'already-zero',dungeonRoom:4,dc200Branch:0},
  {id:'already-empty',dungeonRoom:4,dc200Branch:''}
];
const arrayRef=enemies;
const objectRefs=[...enemies];
let s=run('4',enemies);

assert.equal(s.saved,arrayRef,'saveActiveEnemies must receive the exact array returned by loadActiveEnemies');
for(let i=0;i<objectRefs.length;i++){
  assert.equal(s.saved[i],objectRefs[i],'normalization must preserve enemy object identity');
}
assert.equal(enemies[0].dc200Branch,false,'numeric matching room + undefined marker must default to false');
assert.equal(enemies[1].dc200Branch,false,'numeric-string matching room + undefined marker must default to false');
assert.equal(Object.prototype.hasOwnProperty.call(enemies[2],'dc200Branch'),false,
  'enemy from another room must remain untouched');
assert.equal(enemies[3].dc200Branch,false,'existing false marker must remain false');
assert.equal(enemies[4].dc200Branch,true,'existing true marker must remain true');
assert.equal(enemies[5].dc200Branch,null,'existing null marker must remain null');
assert.equal(enemies[6].dc200Branch,0,'existing numeric marker must remain unchanged');
assert.equal(enemies[7].dc200Branch,'','existing empty-string marker must remain unchanged');

assert.deepEqual(s.events,['load','save','cfg'],
  'normalization must keep load -> in-place mutation -> save before map config evaluation');
assert.equal(s.events.filter(v=>v==='save').length,1,'saveActiveEnemies must be called exactly once');

const zeroRoom=[
  {id:'missing'},
  {id:'empty',dungeonRoom:''},
  {id:'null',dungeonRoom:null},
  {id:'zero',dungeonRoom:0}
];
s=run(0,zeroRoom);
for(const e of zeroRoom){
  assert.equal(e.dc200Branch,false,
    'historical dungeonRoom||0 fallback must treat missing/falsy dungeonRoom as room 0');
}

const noListEvents=[];
sandbox.events=noListEvents;
sandbox.saved='not-called';
sandbox.loaded=undefined;
sandbox.createRoom(4,'chest');
assert.ok(Array.isArray(sandbox.saved)&&sandbox.saved.length===0,
  'undefined loadActiveEnemies result must fallback to a fresh empty array and still be saved');
assert.deepEqual(sandbox.events,['load','save','cfg'],
  'empty fallback list must preserve the same save/config order');

assert.match(entry,/function shouldDefaultGeneratedRoomEnemyBranch\(enemy,room\)/,
  'Dungeon entry must own only the pure dc200Branch default predicate after raccord');
assert.doesNotMatch(entry,/loadActiveEnemies|saveActiveEnemies|\.dc200Branch=false/,
  'Dungeon entry must not take storage or mutation authority');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room dc200Branch normalization characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'dungeonCore200Rebuild.createRoom',
  rule:'matching Number(room), only undefined marker defaults false',
  mutation:'in-place, array and object identity preserved',
  storage:'load/save remain Core 2.00',
  order:['load','normalize','save','cfg/map']
},null,2));
