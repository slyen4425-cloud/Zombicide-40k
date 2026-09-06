const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const store={gensrpg_dungeon_runtime_v2:JSON.stringify({room:4,last:{authoredRuntime167839:true,worldDungeonId:'g1',worldNodeId:'A',authoredCacheCells167849:[2]}})};
let scenes=[
 {id:'legacy',kind:'chest',room:4,cellIndex:2,rarity:'common'},
 {id:'legendary',kind:'chest',room:4,cellIndex:5,rarity:'legendary',exactChest167824:true},
 {id:'manual',kind:'chest',room:4,cellIndex:7,rarity:'rare'}
];
const mkCell=()=>({children:[],appendChild(x){this.children.push(x)}});
const cells=Array.from({length:9},mkCell);
const grid={querySelectorAll(q){if(q==='.dac167852Cache')return [];if(q===':scope > .dc047Cell')return cells;return []}};
const document={readyState:'complete',head:{appendChild(){}},getElementById(){return null},createElement(tag){return {tagName:tag,className:'',textContent:'',setAttribute(){}}},querySelector(sel){return sel==='#dc047RoomBoard .dc047Grid'?grid:null},addEventListener(){}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null},setItem(k,v){store[k]=v}},loadDungeonSceneElements(){return scenes},saveDungeonSceneElements(v){scenes=v},setTimeout(fn){fn();return 1},DungeonCore01:{render(){},show(){}},DungeonZoneLinks167846:{paintTravelButtons(){}}};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-cache-visual-167852.js'});
const api=context.DungeonAuthoredCacheVisual167852;
assert.ok(api);assert.equal(api.APP_VERSION,'16.78.52');
assert.deepEqual([...api.cacheCells(JSON.parse(store.gensrpg_dungeon_runtime_v2))],[2]);
assert.equal(scenes.some(x=>x.id==='legacy'),false,'legacy chest on cache cell must be removed');
assert.equal(scenes.some(x=>x.id==='legendary'),true,'exact legendary chest must stay');
assert.equal(scenes.some(x=>x.id==='manual'),true,'unrelated manual chest must stay');
api.paint();
assert.equal(cells[2].children.some(x=>x.className==='dac167852Cache'),true,'cache cell must receive visible marker');
console.log('Dungeon authored cache visual V16.78.52: OK');
