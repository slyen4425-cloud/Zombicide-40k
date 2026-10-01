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

assert.equal(bytes.length,8169447,
  'generated room map-boundary characterization must track the exact lot 32 GREEN runtime size');
assert.equal(gitBlob,'106d2ec6e82f3b777e1d724cd3f74f30a22fdf39',
  'generated room map-boundary characterization must track the exact lot 32 GREEN runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const createMatch=core200.match(/function createRoom\(room,kind\)\{[\s\S]*?\}\nfunction placeSceneForRoom\(/);
assert.ok(createMatch,'Core 2.00 createRoom source must remain extractable');
const createSource=createMatch[0].replace(/\nfunction placeSceneForRoom\([\s\S]*$/,'');

assert.match(createSource,/const mapObj=cfg\(\)\.map===false\?null:generateDungeonMap\(kind,result\.enemyQty\|\|0\);return \{result,map:mapObj\}/,
  'map boundary must remain a strict false gate followed by one map-generation call and {result,map} return');

const sandbox={
  config:{map:true},
  enemyQty:2,
  events:[],
  activeEnemies:[]
};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

sandbox.dungeonEncounter=()=>({title:'Encounter',text:'',enemyQty:sandbox.enemyQty});
sandbox.dungeonBossRoom=()=>({title:'Boss',text:'',enemyQty:sandbox.enemyQty});
sandbox.dungeonPickTrapType=()=>({name:'Piège',id:'trap'});
sandbox.loadActiveEnemies=()=>{
  sandbox.events.push('load');
  return sandbox.activeEnemies;
};
sandbox.saveActiveEnemies=all=>{
  sandbox.events.push('save');
  sandbox.saved=all;
};
sandbox.cfg=()=>{
  sandbox.events.push('cfg');
  return sandbox.config;
};
sandbox.generateDungeonMap=(kind,qty)=>{
  sandbox.events.push('map:'+kind+':'+String(qty));
  return {kind,qty};
};

vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});

function run({mapSetting,enemyQty=2,kind='enemy'}){
  sandbox.events=[];
  sandbox.saved=null;
  sandbox.config={map:mapSetting};
  sandbox.enemyQty=enemyQty;
  const value=sandbox.createRoom(4,kind);
  return {value:JSON.parse(JSON.stringify(value)),events:[...sandbox.events]};
}

let s=run({mapSetting:false});
assert.equal(s.value.map,null,'strict false must disable generated map materialization');
assert.deepEqual(s.events,['load','save','cfg'],
  'strict false must stop after config evaluation with no generateDungeonMap call');

for(const mapSetting of [true,undefined,null,0,'']){
  s=run({mapSetting,enemyQty:3});
  assert.deepEqual(s.value.map,{kind:'enemy',qty:3},
    'only strict false may disable map generation');
  assert.deepEqual(s.events,['load','save','cfg','map:enemy:3'],
    'enabled path must preserve save -> cfg -> generateDungeonMap order');
}

for(const [enemyQty,expected] of [
  [undefined,0],
  [null,0],
  [0,0],
  ['',0],
  [NaN,0],
  [2,2],
  ['3','3'],
  [-1,-1]
]){
  s=run({mapSetting:true,enemyQty});
  assert.deepEqual(s.value.map,{kind:'enemy',qty:expected},
    'enemyQty must preserve historical ||0 semantics without numeric normalization');
}

s=run({mapSetting:true,enemyQty:0,kind:'chest'});
assert.deepEqual(s.value.result,{
  title:'🎁 Coffre',text:'Un coffre est présent dans la salle.',enemyQty:0
},'room result must remain unchanged by the map boundary');
assert.deepEqual(s.value.map,{kind:'chest',qty:0},
  'map generation must receive the room kind unchanged');

assert.equal((createSource.match(/generateDungeonMap\(/g)||[]).length,1,
  'createRoom must keep exactly one generateDungeonMap callsite');
assert.equal((createSource.match(/cfg\(\)\.map===false/g)||[]).length,1,
  'createRoom must keep exactly one strict map=false gate');
assert.doesNotMatch(entry,/generateDungeonMap|cfg\(\)\.map/,
  'Dungeon entry must not take map-generation or config authority during this audit');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room map boundary characterization',
  runtime:{bytes:bytes.length,gitBlob},
  disableRule:'cfg().map === false only',
  enemyQtyRule:'result.enemyQty || 0',
  order:['load','normalize','save','cfg','generateDungeonMap?'],
  generateCalls:1,
  returnShape:['result','map'],
  decision:'characterize before selecting any pure map-planning seam'
},null,2));
