const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const room={id:'room-a',theme:'forest',cells:Array.from({length:9},(_,i)=>({terrain:i===1?'wall':'floor',object:null}))};
const store={gensrpg_dungeon_runtime_v2:JSON.stringify({room:4,last:{authoredRuntime167839:true,worldDungeonId:'g1',worldNodeId:'A',customRoomId:'room-a',authoredCacheCells167849:[2],map:{environment:'forest',cells:Array(9).fill('floor')}}})};
let scenes=[
 {id:'legacy',kind:'chest',room:4,cellIndex:2,rarity:'common'},
 {id:'legendary',kind:'chest',room:4,cellIndex:5,rarity:'legendary',exactChest167824:true},
 {id:'manual',kind:'chest',room:4,cellIndex:7,rarity:'rare'}
];
function classList(){const s=new Set();return {add(v){s.add(v)},remove(v){s.delete(v)},contains(v){return s.has(v)}}}
function style(){const v={};return {setProperty(k,x){v[k]=x},removeProperty(k){delete v[k]},values:v}}
const mkCell=()=>({children:[],classList:classList(),style:style(),appendChild(x){this.children.push(x)},querySelectorAll(){return []}});
const cells=Array.from({length:9},mkCell);
const grid={dataset:{},querySelectorAll(q){if(q==='.dac167852Cache')return [];if(q==='.dav167867EnemyArt')return [];if(q===':scope > .dc047Cell')return cells;return []}};
const document={readyState:'complete',head:{appendChild(){}},getElementById(){return null},createElement(tag){return {tagName:tag,className:'',textContent:'',setAttribute(){}}},querySelector(sel){return sel==='#dc047RoomBoard .dc047Grid'?grid:null},addEventListener(){}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},loadDungeonSceneElements(){return scenes},saveDungeonSceneElements(v){scenes=v},setTimeout(fn){fn();return 1},DungeonCore01:{render(){},show(){}},DungeonRoomCreator100:{findRoom(id){return id==='room-a'?room:null}},DungeonZoneLinks167846:{paintTravelButtons(){}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-cache-visual-167852.js'});
const api=context.DungeonAuthoredCacheVisual167852;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.69');
assert.deepEqual([...api.cacheCells(JSON.parse(store.gensrpg_dungeon_runtime_v2))],[2]);
assert.equal(api.floorAsset('forest',0),'assets/dungeon/creatures/dng_floor_forest_01.png');
assert.equal(api.authoredRoom(JSON.parse(store.gensrpg_dungeon_runtime_v2)).id,'room-a');
assert.equal(scenes.some(x=>x.id==='legacy'),false,'legacy chest on cache cell must be removed');
assert.equal(scenes.some(x=>x.id==='legendary'),true,'exact legendary chest must stay');
assert.equal(scenes.some(x=>x.id==='manual'),true,'unrelated manual chest must stay');
api.paint();
assert.equal(cells[1].classList.contains('dav167869WallCell'),true,'authored wall cell must receive wall class');
assert.match(cells[1].style.values['background-image'],/dng_wall_block\.jpg/,'wall asset must paint live cell');
assert.match(cells[0].style.values['background-image'],/dng_floor_forest_01\.png/,'forest floor must paint live cell');
assert.equal(cells[2].children.some(x=>x.className==='dac167852Cache'),true,'cache cell must receive visible marker');
console.log('Dungeon authored cache/runtime terrain visual V16.78.69: OK');
