const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-ui-recovery-167843.js'),'utf8');

function style(){const m={};return {setProperty:(k,v)=>{m[k]=v},removeProperty:k=>delete m[k],get display(){return m.display||''},set display(v){m.display=v},_m:m}}
function el(id){return {id,style:style(),classList:{contains:()=>false,remove(){},add(){}},setAttribute(k,v){this[k]=String(v)},getAttribute(k){return this[k]??null},appendChild(){}}}
const nodes={gensDungeonCore01:el('gensDungeonCore01'),sheet:el('sheet'),gensRootHome:el('gensRootHome')};
nodes.gensDungeonCore01.style.display='block';nodes.sheet.style.display='none';nodes.gensRootHome.style.display='none';
const body=el('body');body.attrs={};body.setAttribute=(k,v)=>body.attrs[k]=String(v);body.getAttribute=k=>body.attrs[k]??null;body.appendChild=()=>{};
const head={appendChild(){}};
const document={readyState:'complete',body,head,documentElement:head,getElementById:id=>nodes[id]||null,createElement(tag){return tag==='style'?{id:'',textContent:'',style:style()}:el(tag)}};
let opened=0,rendered=0,shown=0,quit=0;
const root={document,console,getComputedStyle:e=>({display:e.style.display||'block'}),openChar(){opened++;nodes.sheet.style.display='block';nodes.gensDungeonCore01.style.display='none'},DungeonCore01:{render(){rendered++;return true},show(){shown++;nodes.gensDungeonCore01.style.display='block';return true},quit(){quit++;nodes.gensDungeonCore01.style.display='none';nodes.gensRootHome.style.display='block';return true}}};
root.window=root;root.globalThis=root;
const sandbox={...root,window:root,globalThis:root,document,setTimeout:(fn)=>{fn();return 1},queueMicrotask:fn=>fn()};
vm.runInNewContext(src,sandbox,{filename:'gens-ui-recovery-167843.js'});
const U=root.GenSrpGUiRecovery167843;
assert.ok(U);assert.equal(U.APP_VERSION,'16.78.114.14');
assert.equal(U.status().patchedOpenChar,true);assert.equal(U.status().patchedDungeonCore,true);

root.DungeonCore01.show();assert.equal(U.view(),'dungeon');
root.openChar('aldren');assert.equal(opened,1);assert.equal(U.view(),'sheet');assert.equal(nodes.gensDungeonCore01.style._m.display,'none');assert.equal(nodes.sheet.style._m.display,'block');
const before=rendered;const blocked=root.DungeonCore01.render();assert.equal(blocked,false,'rogue Dungeon render must be blocked while sheet owns the view');assert.equal(rendered,before);

U.setView('dungeon');root.DungeonCore01.quit();assert.equal(quit,1);assert.equal(U.view(),'home');assert.equal(nodes.gensDungeonCore01.style._m.display,'none');assert.equal(nodes.gensRootHome.style._m.display,'block');
const afterQuit=rendered;root.DungeonCore01.render();assert.equal(rendered,afterQuit,'rogue render after Save & Quit must not re-show Dungeon');

const styleText=(()=>{U.ensureStyle();return ''})();
assert.match(src,/body\[\$\{VIEW_ATTR\}="sheet"\] #gensDungeonCore01/);
assert.match(src,/body\[\$\{VIEW_ATTR\}="home"\] #gensDungeonCore01/);
assert.match(src,/dng_wall_block\.jpg/);
assert.match(src,/#dc047RoomBoard,#dc047RoomBoard \.dc047Grid\{background-color:#0f0e0c!important\}/,'exploration redraw fallback must never be white');
assert.doesNotMatch(src,/MutationObserver/,'V114.14 UI authority must not add another observer');
console.log('V16.78.114.14 view authority + dark native wall fallback OK');
