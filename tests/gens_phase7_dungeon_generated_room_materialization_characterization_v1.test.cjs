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
  'Phase 7 materialization characterization must track the current Boss-policy runtime size');
assert.equal(gitBlob,'20381d1df0b10b664d5163f308f909cd7a6e45df',
  'Phase 7 materialization characterization must track the exact current Boss-policy runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const createMatch=core200.match(/function createRoom\(room,kind\)\{[\s\S]*?\}\nfunction placeSceneForRoom\(/);
assert.ok(createMatch,'Core 2.00 createRoom source must remain extractable');
const createSource=createMatch[0].replace(/\nfunction placeSceneForRoom\([\s\S]*$/,'');

assert.equal((core200.match(/function createRoom\(room,kind\)/g)||[]).length,1,
  'Core 2.00 must keep one generated room materialization owner during this audit');
assert.equal((createSource.match(/GensDungeonV1\.exploration\.buildGeneratedNonCombatRoomResult\(/g)||[]).length,1,
  'createRoom must delegate only non-combat result construction after the isolated raccord');

const sandbox={events:[],config:{map:true},activeEnemies:[]};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
sandbox.cfg=()=>{
  sandbox.events.push('cfg');
  return sandbox.config;
};
sandbox.dungeonEncounter=room=>{
  sandbox.events.push('encounter:'+room);
  return {title:'ENCOUNTER',text:'encounter',enemyQty:2,enemyName:'Goblin'};
};
sandbox.dungeonBossRoom=room=>{
  sandbox.events.push('boss:'+room);
  return {title:'BOSS',text:'boss',enemyQty:1,enemyName:'Boss'};
};
sandbox.dungeonPickTrapType=config=>{
  sandbox.events.push('trapPick:'+(config===sandbox.config));
  return {name:'Rune',id:'rune'};
};
sandbox.loadActiveEnemies=()=>{
  sandbox.events.push('loadActiveEnemies');
  return sandbox.activeEnemies;
};
sandbox.saveActiveEnemies=all=>{
  sandbox.events.push('saveActiveEnemies');
  sandbox.savedEnemies=all.map(v=>({...v}));
};
sandbox.generateDungeonMap=(kind,qty)=>{
  sandbox.events.push('generateDungeonMap:'+kind+':'+qty);
  return {generated:true,kind,qty};
};

vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(createSource+';this.createRoom=createRoom;',sandbox,{filename:'dungeonCore200Rebuild.createRoom.js'});

function plain(v){return JSON.parse(JSON.stringify(v));}
function run(kind,{room=4,map=true,enemies=[]}={}){
  sandbox.events=[];
  sandbox.savedEnemies=null;
  sandbox.config={map};
  sandbox.activeEnemies=enemies.map(v=>({...v}));
  return {
    value:plain(sandbox.createRoom(room,kind)),
    events:[...sandbox.events],
    saved:sandbox.savedEnemies
  };
}

let s=run('enemy',{
  enemies:[
    {id:'a',dungeonRoom:4},
    {id:'b',dungeonRoom:'4',dc200Branch:true},
    {id:'c',dungeonRoom:5}
  ]
});
assert.deepEqual(s.value,{
  result:{title:'ENCOUNTER',text:'encounter',enemyQty:2,enemyName:'Goblin'},
  map:{generated:true,kind:'enemy',qty:2}
},'enemy room must preserve encounter result and map enemy quantity');
assert.deepEqual(s.events,[
  'encounter:4','loadActiveEnemies','saveActiveEnemies','cfg','generateDungeonMap:enemy:2'
],'enemy materialization must preserve encounter -> enemy normalization -> map generation order');
assert.equal(s.saved[0].dc200Branch,false,
  'matching-room enemy without branch marker must receive dc200Branch=false');
assert.equal(s.saved[1].dc200Branch,true,
  'existing branch marker must not be overwritten');
assert.equal(Object.prototype.hasOwnProperty.call(s.saved[2],'dc200Branch'),false,
  'enemy from another room must remain untouched');

s=run('ambush');
assert.equal(s.value.result.title,'ENCOUNTER',
  'ambush must delegate to dungeonEncounter just like enemy');
assert.equal(s.events[0],'encounter:4');

s=run('boss');
assert.deepEqual(s.value,{
  result:{title:'BOSS',text:'boss',enemyQty:1,enemyName:'Boss'},
  map:{generated:true,kind:'boss',qty:1}
},'boss room must preserve boss result and map quantity');
assert.equal(s.events[0],'boss:4');

s=run('trap');
assert.deepEqual(s.value,{
  result:{title:'🪤 Rune',text:'Un piège est présent dans la salle.',enemyQty:0,trapId:'rune'},
  map:{generated:true,kind:'trap',qty:0}
},'trap descriptor must preserve historical shape');
assert.deepEqual(s.events.slice(0,2),['cfg','trapPick:true'],
  'trap selection must receive the current Dungeon config before enemy normalization');

s=run('chest');
assert.deepEqual(s.value.result,{
  title:'🎁 Coffre',text:'Un coffre est présent dans la salle.',enemyQty:0
});
s=run('merchant');
assert.deepEqual(s.value.result,{
  title:'🧙‍♂️ Marchand',text:'Un marchand attend le groupe.',enemyQty:0
});
s=run('rest');
assert.deepEqual(s.value.result,{
  title:'⛩️ Sanctuaire',text:'Un lieu de repos.',enemyQty:0
});
s=run('mystery');
assert.deepEqual(s.value.result,{
  title:'✨ Salle calme',text:'La salle semble calme.',enemyQty:0
});

s=run('chest',{map:false});
assert.equal(s.value.map,null,'map=false must keep generated room map disabled');
assert.equal(s.events.some(v=>v.startsWith('generateDungeonMap:')),false,
  'map=false must not call generateDungeonMap');

assert.match(createSource,/loadActiveEnemies\?\.\(\)\|\|\[\]/,
  'createRoom must keep active-enemy normalization at the current owner');
assert.equal(
  (createSource.match(/GensDungeonV1\.exploration\.shouldDefaultGeneratedRoomEnemyBranch\(e,room\)/g)||[]).length,
  1,
  'dc200Branch normalization must delegate the matching-room/undefined-marker rule exactly once'
);
assert.match(createSource,/saveActiveEnemies\?\.\(all\)/,
  'createRoom must keep enemy persistence after normalization');
assert.match(createSource,/const mapPlan=GensDungeonV1\.exploration\.planGeneratedRoomMapBoundary\(cfg\(\)\.map,kind,result\);const mapObj=mapPlan\.status==="disabled"\?null:generateDungeonMap\(mapPlan\.kind,mapPlan\.enemyQty\)/,
  'map policy planning must delegate to Dungeon while generateDungeonMap remains at the current Core owner');

assert.doesNotMatch(entry,/function\s+createRoom\s*\(/,
  'Dungeon entry must not silently duplicate the Core 2.00 materialization owner');
assert.doesNotMatch(authored,/createRoom\(room,kind\)|generateDungeonMap\(kind,result\.enemyQty/,
  'authored World Builder must remain outside generated createRoom materialization');

console.log(JSON.stringify({
  scenario:'Phase 7 generated room materialization characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'dungeonCore200Rebuild.createRoom',
  responsibilities:[
    'encounter/boss delegation',
    'static room result descriptors',
    'dc200Branch enemy normalization',
    'enemy persistence',
    'map enablement',
    'generateDungeonMap call',
    '{result,map} composition'
  ],
  decision:'non-combat result descriptors delegated; active materialization remains Core 2.00',
  authored:'separate and unchanged'
},null,2));
