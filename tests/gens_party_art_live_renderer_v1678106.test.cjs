const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ui-cleanup-1678100.js'),'utf8');
assert.match(index,/function renderHeroes\(x\)[\s\S]{0,900}const img=c\.image\|\|c\.avatar\|\|''/,'test must track the real late party renderer that bypasses window.CHARS hooks');
assert.match(src,/APP_VERSION="16\.78\.128"/);
assert.match(src,/getElementById\("dc01Heroes"\)/,'fix must target the exact live party host');
assert.doesNotMatch(src,/new MutationObserver/,'party art repair must not keep a background MutationObserver alive');
assert.doesNotMatch(src,/\.observe\(/,'UI cleanup must not observe DOM mutations in background');
assert.match(src,/for\(const n of \["render","show"\]\)wrap\(core,n\)/,'party repair must stay attached to explicit Dungeon renders');

let img=null;
const fallback={tagName:'DIV',textContent:'🧙',hidden:false,style:{setProperty(k,v){this[k]=v}}};
const card={textContent:'Aldren\nGuerrier',children:[fallback],querySelector(sel){return sel==='img'?img:null},insertBefore(node){img=node;this.children.unshift(node);}};
const host={cards:[card],querySelectorAll(sel){return sel==='.dc01Hero'?this.cards:[];}};
function makeImg(){return {tagName:'IMG',src:'',hidden:false,alt:'',className:'',style:{setProperty(k,v){this[k]=v}},getAttribute(k){return k==='src'?this.src:null},setAttribute(k,v){if(k==='src')this.src=v;}}}
const document={readyState:'complete',getElementById(id){return id==='dc01Heroes'?host:null},createElement(tag){assert.equal(tag,'img');return makeImg()}};
const timers=[];
const window={DungeonCore01:{render(){},show(){}}};
const context={window,document,setTimeout:(fn)=>{timers.push(fn);return timers.length},clearTimeout:()=>{},console};
vm.runInNewContext(src,context,{filename:'gens-dungeon-ui-cleanup-1678100.js'});
while(timers.length){const fn=timers.shift();fn();if(timers.length>40)break;}
assert.ok(img,'Aldren image must be restored by explicit render/scheduled repair');
assert.equal(img.src,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(fallback.hidden,true,'legacy wizard fallback must be hidden after official art repair');
console.log('V16.78.128 live party renderer: official art restored without background DOM observer');
