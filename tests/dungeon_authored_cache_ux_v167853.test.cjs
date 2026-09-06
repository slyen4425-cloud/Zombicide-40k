const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-authored-cache-ux-167853.js'),'utf8');
const store={gensrpg_dungeon_runtime_v2:JSON.stringify({last:{authoredRuntime167839:true,worldDungeonId:'g',worldNodeId:'branch_A_2_attic',map:{width:3,height:2,cells:Array(6).fill('floor')}}})};
const timers=[];let paintCalls=0,actionCalls=0;
function mkStyle(){return {props:{width:'204px',height:'68px',maxWidth:'100%',margin:'0 auto',gridTemplateColumns:'repeat(3, 68px)',gridAutoRows:'68px',minHeight:'0',aspectRatio:'1 / 1',overflowX:'hidden',display:'block'},removeProperty(k){delete this.props[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]}}}
const cells=Array.from({length:6},()=>({style:mkStyle()}));
const style=mkStyle(),boardStyle=mkStyle(),classes=new Set(['dacu167853Fitted']);
const grid={style,classList:{add(v){classes.add(v)},remove(v){classes.delete(v)}},querySelectorAll(q){return q===':scope > .dc047Cell'?cells:[]}};
const board={style:boardStyle};const listeners={};
const document={readyState:'complete',addEventListener(t,fn){(listeners[t]||(listeners[t]=[])).push(fn)},querySelector(q){return q==='#dc047RoomBoard .dc047Grid'?grid:null},getElementById(id){return id==='dc047RoomBoard'?board:null}};
const context={console,JSON,Math,Date,document,localStorage:{getItem(k){return store[k]||null}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},DungeonZoneLinks167846:{paintTravelButtons(){paintCalls++}},DungeonAuthoredRuntime167839:{syncActionButton(){actionCalls++}},DungeonCore01:{render(){},show(){}}};context.window=context;context.globalThis=context;
vm.createContext(context);vm.runInContext(src,context,{filename:'dungeon-authored-cache-ux-167853.js'});
const api=context.DungeonAuthoredCacheUx167853;assert.ok(api);assert.equal(api.APP_VERSION,'16.78.55');
assert.equal(api.secondaryBranch(JSON.parse(store.gensrpg_dungeon_runtime_v2)),true);
assert.equal(api.restoreGrid(),true);assert.equal(classes.has('dacu167853Fitted'),false,'legacy auto-fit class must be removed');
for(const p of ['width','height','maxWidth','margin','gridTemplateColumns','gridAutoRows'])assert.equal(style.props[p],undefined,'grid auto-fit style '+p+' must be cleared');
for(const c of cells){for(const p of ['width','height','minHeight','aspectRatio'])assert.equal(c.style.props[p],undefined,'cell auto-fit style '+p+' must be cleared')}
const cell={closest(sel){return sel==='#dc047RoomBoard .dc047Grid .dc047Cell'?this:null}};for(const fn of listeners.click||[])fn({target:cell});
assert.ok(timers.some(t=>t.ms===0)&&timers.some(t=>t.ms===20)&&timers.some(t=>t.ms===80),'grid click must schedule immediate post-move action refreshes');
while(timers.length)timers.shift().fn();assert.ok(paintCalls>0,'cache/return buttons must refresh after movement');assert.ok(actionCalls>0,'authored action button must refresh after movement');
assert.equal(api.fitBranchRoom(),false,'auto-fit must remain disabled');
console.log('Dungeon authored cache UX V16.78.55 rollback: OK');
