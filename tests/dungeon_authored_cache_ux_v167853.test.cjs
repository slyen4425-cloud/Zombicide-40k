const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-cache-ux-167853.js'),'utf8');
const store={gensrpg_dungeon_runtime_v2:JSON.stringify({last:{authoredRuntime167839:true,worldDungeonId:'g',worldNodeId:'branch_A_2_attic',map:{width:3,height:2,cells:Array(6).fill('floor')}}})};
const timers=[];let paintCalls=0,actionCalls=0;
function mkStyle(){return {props:{},set width(v){this.props.width=v},set height(v){this.props.height=v},set maxWidth(v){this.props.maxWidth=v},set margin(v){this.props.margin=v},set gridTemplateColumns(v){this.props.gridTemplateColumns=v},set gridAutoRows(v){this.props.gridAutoRows=v},set minHeight(v){this.props.minHeight=v},set aspectRatio(v){this.props.aspectRatio=v},set overflowX(v){this.props.overflowX=v},set display(v){this.props.display=v},set justifyContent(v){this.props.justifyContent=v},removeProperty(k){delete this.props[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]}}}
const cells=Array.from({length:6},()=>({style:mkStyle()}));
const style=mkStyle(),boardStyle=mkStyle(),classes=new Set();
const grid={style,classList:{add(v){classes.add(v)},remove(v){classes.delete(v)}},querySelectorAll(q){return q===':scope > .dc047Cell'?cells:[]}};
const board={style:boardStyle,clientWidth:360};const listeners={};
const document={readyState:'complete',addEventListener(t,fn){(listeners[t]||(listeners[t]=[])).push(fn)},querySelector(q){return q==='#dc047RoomBoard .dc047Grid'?grid:null},getElementById(id){return id==='dc047RoomBoard'?board:null}};
const context={console,JSON,Math,Date,document,innerWidth:390,innerHeight:844,addEventListener(){},localStorage:{getItem(k){return store[k]||null}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonZoneLinks167846:{paintTravelButtons(){paintCalls++}},DungeonAuthoredRuntime167839:{syncActionButton(){actionCalls++}},DungeonCore01:{render(){},show(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-cache-ux-167853.js'});
const api=context.DungeonAuthoredCacheUx167853;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.54');
assert.equal(api.secondaryBranch(JSON.parse(store.gensrpg_dungeon_runtime_v2)),true);
assert.equal(api.cellSizePx(3,2,360),68,'small branch room zoom must be capped');
assert.equal(api.cellSizePx(12,20,360),28,'large/tall branch room must shrink but keep a usable floor');
assert.equal(api.fitBranchRoom(),true);assert.equal(style.props.width,'204px');assert.equal(style.props.gridTemplateColumns,'repeat(3, 68px)');assert.equal(style.props.gridAutoRows,'68px');assert.equal(boardStyle.props.overflowX,'hidden');
for(const c of cells){assert.equal(c.style.props.width,'68px');assert.equal(c.style.props.height,'68px');assert.equal(c.style.props.aspectRatio,'1 / 1')}
const cell={closest(sel){return sel==='#dc047RoomBoard .dc047Grid .dc047Cell'?this:null}};for(const fn of listeners.click||[])fn({target:cell});
assert.ok(timers.some(t=>t.ms===0)&&timers.some(t=>t.ms===20)&&timers.some(t=>t.ms===80),'grid click must schedule immediate post-move refreshes');
while(timers.length)timers.shift().fn();assert.ok(paintCalls>0,'cache/return buttons must refresh after movement');assert.ok(actionCalls>0,'authored action button must refresh after movement');
store.gensrpg_dungeon_runtime_v2=JSON.stringify({last:{authoredRuntime167839:true,worldDungeonId:'g',worldNodeId:'A',map:{width:9,height:9,cells:Array(81).fill('floor')}}});assert.equal(api.fitBranchRoom(),false,'main authored rooms must not be auto-fitted by this cache UX layer');
console.log('Dungeon authored cache UX V16.78.54: OK');
