const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-cache-visual-167852.js'),'utf8');
const RT='gensrpg_dungeon_runtime_v2';
const runtime={room:1,participants:['hero'],positions:{hero:0},heroRooms:{hero:1},enemyCells:{},
  last:{authoredRuntime167839:true,worldDungeonId:'world-1',worldNodeId:'A',customRoomId:'room-a',
    authoredCacheCells167849:[2],map:{environment:'stone',cells:['entry','wall','cache','floor','exit']}}};
const store=new Map([[RT,JSON.stringify(runtime)]]);
function style(){const values={};return {values,setProperty(k,v){values[k]=v},removeProperty(k){delete values[k]}}}
function classes(){const s=new Set();return {add(...xs){xs.forEach(x=>s.add(x))},remove(...xs){xs.forEach(x=>s.delete(x))},contains(x){return s.has(x)}}}
const cells=Array.from({length:5},()=>({children:[],style:style(),classList:classes(),
  appendChild(el){el.parent=this;this.children.push(el)},
  querySelectorAll(){return []}
}));
const grid={dataset:{},querySelectorAll(sel){
  if(sel===':scope > .dc047Cell')return cells;
  if(sel==='.dac167852Cache')return cells.flatMap(c=>c.children.filter(x=>x.className==='dac167852Cache'));
  if(sel==='.dav167870EnemyToken')return [];
  return [];
}};
const board={querySelectorAll(){return []}};
let mutationObservers=0,resizeObservers=0,resizeListeners=0;
const document={readyState:'complete',head:{appendChild(){}},
  getElementById(){return null},
  querySelector(sel){if(sel==='#dc047RoomBoard .dc047Grid')return grid;if(sel==='#dc047RoomBoard')return board;return null},
  createElement(){return {className:'',textContent:'',parent:null,setAttribute(){},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}}},
  addEventListener(){}
};
const context={console,JSON,Math,Date,document,
  localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}},
  setTimeout(fn){fn();return 1},
  addEventListener(type){if(type==='resize')resizeListeners++},
  MutationObserver:class{constructor(){mutationObservers++}observe(){}disconnect(){}},
  ResizeObserver:class{constructor(){resizeObservers++}observe(){}disconnect(){}},
  DungeonSourceRenderStability167877:{VERSION:'1.0.0'},
  DungeonCore01:{render(){return true},show(){return true}},
  DungeonRoomCreator100:{findRoom(){return {id:'room-a',theme:'stone',cells:[{terrain:'floor',object:'entry'},{terrain:'wall',object:null},{terrain:'floor',object:'cache'},{terrain:'floor',object:null},{terrain:'floor',object:'exit'}]}}},
  DungeonZoneLinks167846:{paintTravelButtons(){}},
  loadDungeonSceneElements(){return []},saveDungeonSceneElements(){}
};
context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-cache-visual-167852.js'});
const api=context.DungeonAuthoredCacheVisual167852;

assert.equal(api.sourceRenderOwner(),true);
for(const c of cells)assert.deepEqual(c.style.values,{},'legacy CacheVisual must not repaint authored terrain when SourceRenderStability owns source rendering');
assert.equal(cells[2].children.filter(x=>x.className==='dac167852Cache').length,1,'CacheVisual keeps only its cache marker responsibility');
assert.equal(mutationObservers,0,'superseded token MutationObserver must not be reinstalled after SourceRenderStability loads');
assert.equal(resizeObservers,0,'superseded resize repaint observer must not be installed under source-render authority');
assert.equal(resizeListeners,0,'superseded window resize repaint listener must not be installed under source-render authority');
assert.match(src,/if\(!sourceRenderOwner\(\)\)paintBoardVisuals/,'live terrain painter must be fallback-only');
console.log('Dungeon authored visual ownership: SourceRenderStability owns terrain/tokens; CacheVisual keeps cache markers only: OK');
