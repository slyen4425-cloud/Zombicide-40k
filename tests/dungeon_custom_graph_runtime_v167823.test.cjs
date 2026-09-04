const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=process.env.DC323_TEST_ROOT||path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-custom-runtime-167823.js'),'utf8');
const builtArg=process.argv[2];
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

function makeStorage(){
  const values=new Map();
  return {getItem(k){return values.has(k)?values.get(k):null},setItem(k,v){values.set(k,String(v))},removeItem(k){values.delete(k)}};
}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}

const rooms={
  room_a:{id:'room_a',name:'Entrée antique',roomType:'room',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:'trap'},{terrain:'floor',object:'cache'},
    {terrain:'floor',object:null},{terrain:'floor',object:'chest'},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]},
  room_b:{id:'room_b',name:'Salle des gardes',roomType:'room',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]},
  room_secret:{id:'room_secret',name:'Crypte secrète',roomType:'special',width:3,height:3,cells:[
    {terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:'enemy'},{terrain:'floor',object:null},
    {terrain:'floor',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]}
};
const graph={id:'dungeon_test',name:'Donjon de test',startNodeId:'node_a',nodes:[
  {id:'node_a',roomId:'room_a',label:'Entrée antique'},
  {id:'node_b',roomId:'room_b',label:'Salle des gardes'},
  {id:'node_secret',roomId:'room_secret',label:'Crypte secrète'}],
  edges:[{id:'edge_ab',kind:'door',fromNodeId:'node_a',fromExitIndex:8,toNodeId:'node_b',toEntryIndex:0}],
  cacheBindings:[{id:'cb1',sourceNodeId:'node_a',sourceIndex:2,targetNodeId:'node_secret',targetRoomId:'room_secret'}]};
const interactions={
  room_a:{roomId:'room_a',attachments:[
    {id:'cell_trap',kind:'trap',targetType:'cell',targetIndex:1,refId:'dart'},
    {id:'door_trap',kind:'trap',targetType:'door',targetIndex:8,refId:'dart'},
    {id:'chest_trap',kind:'trap',targetType:'chest',targetIndex:4,refId:'dart'},
    {id:'chest_puzzle',kind:'puzzle',targetType:'chest',targetIndex:4,refId:'puzzle_1'}],cacheLinks:[{id:'cl1',sourceIndex:2,targetRoomId:'room_secret'}]},
  room_b:{roomId:'room_b',attachments:[{id:'entry_puzzle',kind:'puzzle',targetType:'door',targetIndex:0,refId:'puzzle_1'}],cacheLinks:[]},
  room_secret:{roomId:'room_secret',attachments:[],cacheLinks:[]}
};

const localStorage=makeStorage();
let scenes=[],enemies=[],sceneSeq=0,enemySeq=0,trapCalls=[],puzzleCalls=[],lootCalls=0,encounterCalls=0;
function readRt(){try{return JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){return null}}
function saveRt(x){localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x))}
function activeId(x){return String(x?.participants?.[Number(x?.index)||0]||'')}
const spatial={
  ensure(x){if(!x)return x;x.positions=x.positions||{};x.remaining=x.remaining||{};x.heroRooms=x.heroRooms||{};x.roomStates=x.roomStates||{};x.heroBranchStates=x.heroBranchStates||{};const r=Number(x.room)||0;(x.participants||[]).forEach(id=>{if(!Number.isFinite(Number(x.heroRooms[id])))x.heroRooms[id]=r});return x},
  persist(x){this.ensure(x);const id=activeId(x),room=Number(x.room)||0;if(id)x.heroRooms[id]=room;if(x.branch?.active&&id)x.heroBranchStates[id]={room,last:clone(x.last),enemyCells:clone(x.enemyCells||{}),branch:clone(x.branch),cell:Number(x.positions?.[id])};else if(room>0&&x.last)x.roomStates[String(room)]={room,last:clone(x.last),enemyCells:clone(x.enemyCells||{})};return x},
  activate(x,id){this.ensure(x);id=String(id||'');const br=x.heroBranchStates[id];if(br?.branch?.active){x.room=Number(br.room)||0;x.last=clone(br.last);x.enemyCells=clone(br.enemyCells||{});x.branch=clone(br.branch);if(Number.isInteger(br.cell))x.positions[id]=br.cell;return x}const room=Number(x.heroRooms[id])||0;x.room=room;x.branch=null;const st=x.roomStates[String(room)];x.last=st?.last?clone(st.last):null;x.enemyCells=clone(st?.enemyCells||{});return x},
  setRoom(x,id,room){this.ensure(x);x.heroRooms[String(id)]=Number(room)||0;delete x.heroBranchStates[String(id)];return x},
  clearBranch(x,id){this.ensure(x);delete x.heroBranchStates[String(id)];return x}
};
const ctx={console,Math,Date,JSON,setTimeout(fn){fn();return 1},clearTimeout(){},localStorage,
  CHARS:{aldren:{name:'Aldren'},lyra:{name:'Lyra'},brom:{name:'Brom'}},findCustomHero(){return null},DungeonSpatial313:spatial,
  DungeonRoomCreator100:{findRoom(id){return clone(rooms[id]||null)}},DungeonRoomCreatorV2:{roomMeta(id){return clone(interactions[id]||{roomId:id,attachments:[],cacheLinks:[]})}},
  DungeonWorldBuilder167821:{findDungeon(id){return id===graph.id?clone(graph):null},validation(g){return {valid:!!g?.nodes?.length,errors:[],warnings:[]}},close(){return true}},
  loadChallengeLibrary069(){return [{id:'puzzle_1',type:'text',prompt:'Mot ?',solution:'porte'}]},dungeonTrapTypes(){return {dart:{id:'dart'}}},dungeonPickTrapType(){return {id:'dart'}},
  dungeonResolveTrapAgainstHero(id,hero,show){trapCalls.push({id,hero,show});return {ok:true,html:`${hero} évite ${id}`}},dc201OpenPuzzle(kind,id){puzzleCalls.push({kind,id});return true},
  loadDungeonConfig(){return {}},dungeonPickChestRarity(){return 'rare'},loadDungeonSceneElements(){return clone(scenes)},saveDungeonSceneElements(a){scenes=clone(a||[])},
  addDungeonSceneElement(data){const el={id:'scene_'+(++sceneSeq),...clone(data)};scenes.push(el);return clone(el)},removeDungeonSceneElement(id){scenes=scenes.filter(e=>String(e.id)!==String(id))},
  loadActiveEnemies(){return clone(enemies)},saveActiveEnemies(a){enemies=clone(a||[])},saveDungeonState(){},loadDungeonState(){const x=readRt();return {room:Number(x?.room)||0,last:clone(x?.last||null)}},
  dungeonEncounter(){encounterCalls++;const x=readRt();enemies.push({id:'enemy_'+(++enemySeq),enemyId:'skeleton',hp:2,dungeonRoom:Number(x?.room)||0,defeated:false});return {enemyQty:1,title:'Rencontre'}},
  dungeonBossRoom(){const x=readRt();enemies.push({id:'boss_'+(++enemySeq),enemyId:'boss',hp:5,dungeonRoom:Number(x?.room)||0,defeated:false});return {enemyQty:1,title:'Boss'}},
  getActiveGameProfile(){return {rpgUniverse:{movement:{mode:'tactical'},exploration:{restEnabled:true,restHeal:1,restMana:0}}}},gensGameplayModules(){return {movement:true}},isGameMasterDevice(){return false},dungeonSetHeroWounds(){},loadState(){return {}},key(id){return 'hero_'+id},
  DungeonCore01:{
    start(){const x={version:200,participants:['aldren','lyra','brom'],round:1,index:0,phase:'exploration',room:0,last:null,positions:{},remaining:{aldren:2,lyra:3,brom:3},enemyCells:{},branch:null,pendingEvent:null,heroRooms:{aldren:0,lyra:0,brom:0},roomStates:{},heroBranchStates:{}};saveRt(x);localStorage.setItem('gensrpg_dungeon_core01_device_hero_v1','aldren');return true},
    show(){return true},render(){return true},explore(){throw new Error('procedural explore must not run during custom graph')},
    endTurn(){const x=readRt();spatial.persist(x);x.index=(Number(x.index)+1)%x.participants.length;const next=activeId(x);spatial.activate(x,next);x.remaining[next]=3;saveRt(x);localStorage.setItem('gensrpg_dungeon_core01_device_hero_v1',next);return true},
    searchChest(id){const el=scenes.find(e=>String(e.id)===String(id));if(!el)return false;if(el.challenge&&!el.challengeDone){ctx.dc201OpenPuzzle('chest',id);return false}lootCalls++;scenes=scenes.filter(e=>String(e.id)!==String(id));return true},quit(){return true},modal(){return true}
  }
};
ctx.dc200EnterBranch=function(id){const x=readRt(),hero=activeId(x),el=scenes.find(e=>String(e.id)===String(id));if(!el)return false;spatial.persist(x);x.branch={active:true,heroId:hero,parentRoom:Number(x.room)||0,sourceId:String(id),sourceCell:Number(el.cellIndex)};x.last={kind:'chest',room:x.room,map:{size:5,cells:Array(25).fill('floor'),entryIdx:22,exitIdx:2}};x.positions[hero]=22;saveRt(x);return true};
ctx.dc200LeaveBranch=function(){const x=readRt();if(!x?.branch?.active)return false;const hero=activeId(x),source=String(x.branch.sourceId),cell=Number(x.branch.sourceCell),parent=Number(x.branch.parentRoom)||0;spatial.clearBranch(x,hero);x.branch=null;spatial.setRoom(x,hero,parent);spatial.activate(x,hero);x.positions[hero]=cell;scenes=scenes.filter(e=>String(e.id)!==source&&!e.branch200);saveRt(x);return true};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'dungeon-custom-runtime-167823.js'});

const api=ctx.DungeonCustomRuntime167823;
assert.ok(api,'custom graph runtime API missing');assert.equal(api.VERSION,'16.78.23');assert.equal(api.RT_KEY,'gensrpg_dungeon_runtime_v2');
const rect={room:{width:2,height:3,cells:[{terrain:'floor',object:'entry'},{terrain:'floor',object:null},{terrain:'floor',object:'chest'},{terrain:'wall',object:null},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]}};
const rectMap=api.mapForZone(rect,'rect');assert.equal(rectMap.size,3);assert.deepEqual(Array.from(rectMap.cells),['entry','floor','void','chest','wall','void','floor','exit','void']);assert.equal(rectMap.entryIdx,0);assert.equal(rectMap.exitIdx,7);

assert.equal(api.launch(graph.id),true);let x=readRt();assert.equal(x.dc323.graphId,graph.id);assert.deepEqual(x.heroRooms,{aldren:0,lyra:0,brom:0});assert.equal(x.room,0);
assert.equal(api.customExplore(),true);x=readRt();const roomA=x.dc323.nodeRooms.node_a,roomB=x.dc323.nodeRooms.node_b,roomSecret=x.dc323.nodeRooms.node_secret;assert.equal(x.heroRooms.aldren,roomA);assert.equal(x.heroRooms.lyra,0);assert.equal(x.heroRooms.brom,0);assert.equal(x.positions.aldren,0);assert.equal(x.remaining.aldren,2);

x.positions.aldren=8;saveRt(x);assert.equal(api.customExplore(),false);x=readRt();assert.equal(x.heroRooms.aldren,roomA);assert.equal(trapCalls.filter(t=>t.hero==='aldren').length,1);assert.equal(puzzleCalls.length,0);
assert.equal(api.customExplore(),false);x=readRt();assert.equal(puzzleCalls.at(-1).kind,'door');assert.equal(x.heroRooms.aldren,roomA);x.last.map.objective.status='done';saveRt(x);api.sync();assert.equal(api.customExplore(),true);x=readRt();assert.equal(x.heroRooms.aldren,roomB);assert.equal(x.positions.aldren,0);assert.equal(x.remaining.aldren,2);

ctx.DungeonCore01.endTurn();x=readRt();assert.equal(activeId(x),'lyra');assert.equal(x.room,0);assert.equal(api.customExplore(),true);x=readRt();assert.equal(x.heroRooms.lyra,roomA);assert.equal(x.heroRooms.aldren,roomB);
x.positions.lyra=4;saveRt(x);const chest=scenes.find(e=>e.dc323Custom&&e.kind==='chest'&&e.dc323NodeId==='node_a');assert.ok(chest);ctx.DungeonCore01.searchChest(chest.id);assert.equal(lootCalls,0);const chestTrapCount=trapCalls.length;ctx.DungeonCore01.searchChest(chest.id);assert.equal(lootCalls,0);assert.equal(trapCalls.length,chestTrapCount);assert.equal(puzzleCalls.at(-1).kind,'chest');let chestStored=scenes.find(e=>e.id===chest.id);chestStored.challengeDone=true;api.sync();ctx.DungeonCore01.searchChest(chest.id);assert.equal(lootCalls,1);assert.equal(scenes.some(e=>e.id===chest.id),false);

x=readRt();x.positions.lyra=2;saveRt(x);const cache=scenes.find(e=>e.dc323Cache&&e.dc323NodeId==='node_a');assert.ok(cache);const beforeEncounter=encounterCalls;assert.equal(ctx.dc200EnterBranch(cache.id),true);x=readRt();assert.equal(x.branch.dc323Custom,true);assert.equal(x.heroRooms.lyra,roomSecret);assert.equal(x.heroRooms.aldren,roomB);assert.equal(x.heroRooms.brom,0);assert.equal(encounterCalls,beforeEncounter+1);const secretEnemyCount=enemies.filter(e=>e.dc323NodeId==='node_secret').length;assert.ok(secretEnemyCount>=1);
assert.equal(ctx.dc200LeaveBranch(),true);x=readRt();assert.equal(x.heroRooms.lyra,roomA);assert.equal(x.positions.lyra,2);assert.ok(scenes.some(e=>e.id===cache.id));
ctx.DungeonCore01.endTurn();x=readRt();assert.equal(activeId(x),'brom');assert.equal(x.room,0);assert.equal(api.customExplore(),true);x=readRt();x.positions.brom=2;saveRt(x);const cache2=scenes.find(e=>e.dc323Cache&&e.dc323NodeId==='node_a');assert.equal(ctx.dc200EnterBranch(cache2.id),true);x=readRt();assert.equal(x.heroRooms.brom,roomSecret);assert.equal(encounterCalls,beforeEncounter+1);assert.equal(enemies.filter(e=>e.dc323NodeId==='node_secret').length,secretEnemyCount);

assert.doesNotMatch(src,/function\s+(?:moveTo|startCombat|finishVictory|endTurn|dungeonEncounter|dungeonBossRoom)\s*\(/);
assert.match(src,/native\?\.enterBranch/);assert.match(src,/native\?\.searchChest/);assert.match(src,/trap=pending\.find[\s\S]{0,180}puzzle=pending\.find/);
assert.match(workflow,/dungeon-room-runtime-167822\.js/,'V16.78.22 procedural-room bridge must remain wired');assert.match(workflow,/dungeon-custom-runtime-167823\.js/);assert.match(workflow,/dungeon_custom_graph_runtime_v167823\.test\.cjs/);assert.match(sw,/dungeon-room-runtime-167822\.js/);assert.match(sw,/dungeon-custom-runtime-167823\.js/);assert.match(sw,/gensrpg-cache-16\.78\.23-/);
if(builtArg){const html=fs.readFileSync(builtArg,'utf8');const simple=html.indexOf('assets/dungeon/dungeon-room-runtime-167822.js?v=167822');const builder=html.indexOf('assets/dungeon/dungeon-world-builder-167821.js?v=167821');const graphRt=html.indexOf('assets/dungeon/dungeon-custom-runtime-167823.js?v=167823');assert.ok(builder>=0&&simple>builder&&graphRt>simple,'final HTML must keep V16.78.22 then load V16.78.23 graph runtime')}
console.log('Dungeon custom graph runtime V16.78.23: OK');
