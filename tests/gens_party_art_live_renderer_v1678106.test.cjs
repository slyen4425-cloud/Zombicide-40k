const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-ui-cleanup-1678100.js'),'utf8');
assert.match(index,/function renderHeroes\(x\)[\s\S]{0,900}const img=c\.image\|\|c\.avatar\|\|''/,'test must track the real late party renderer that bypasses window.CHARS hooks');
assert.match(src,/APP_VERSION="16\.78\.113"/);
assert.match(src,/getElementById\("dc01Heroes"\)/,'fix must target the exact live party host');
assert.match(src,/new MutationObserver/,'fix must survive internal late rerenders');
assert.match(src,/partyObserver\.observe\(host,/,'observer must be scoped to dc01Heroes');
assert.doesNotMatch(src,/observe\((?:D\.|document\.)?(?:documentElement|body)/,'must not restore a global DOM observer');
const hookAll=(src.match(/function hookAll\(\)\{[^\n]+/)||[''])[0];
assert.ok(!hookAll.includes('renderDungeonHeroStats')&&!hookAll.includes('renderDungeonAttributes'),'live art repair cannot hook combat-hot stat renderers');

let observerCallback=null,observedTarget=null,img=null;
const style=()=>({setProperty(k,v){this[k]=v},getPropertyValue(k){return this[k]||''}});
const fallback={tagName:'DIV',textContent:'🧙',hidden:false,style:style()};
const card={textContent:'Aldren\nGuerrier',children:[fallback],querySelector(sel){return sel==='img'?img:null},insertBefore(node){img=node;this.children.unshift(node);}};
const host={cards:[],querySelectorAll(sel){return sel==='.dc01Hero'?this.cards:[];}};
function makeImg(){return {tagName:'IMG',src:'',hidden:false,alt:'',className:'',style:style(),getAttribute(k){return k==='src'?this.src:null},setAttribute(k,v){if(k==='src')this.src=v;}}}
const document={readyState:'complete',getElementById(id){return id==='dc01Heroes'?host:null},createElement(tag){assert.equal(tag,'img');return makeImg()}};
class MutationObserver{constructor(cb){observerCallback=cb}observe(target){observedTarget=target}disconnect(){}}
const window={};
const context={window,document,MutationObserver,setTimeout:(fn)=>0,clearTimeout:()=>{},console,requestAnimationFrame:(fn)=>0};
vm.runInNewContext(src,context,{filename:'gens-dungeon-ui-cleanup-1678100.js'});
assert.equal(observedTarget,host,'observer must attach to exact party host');
host.cards=[card];
observerCallback([{type:'childList'}]);
assert.ok(img,'Aldren image must be injected when late renderer rebuilds the card');
assert.equal(img.src,'assets/dungeon/creatures/dng_aldren.png');
assert.equal(fallback.hidden,true,'legacy wizard fallback must be hidden after official art repair');
console.log('V16.78.113 live party renderer: Aldren repair preserved without combat-hot hooks');
