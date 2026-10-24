'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const sourceRender=read('assets/dungeon/dungeon-source-render-stability-167877.js');

assert.match(
  sourceRender,
  /const active=String\(x\.participants\?\.\[Number\(x\.index\)\|\|0\]\|\|""\)/,
  'Source Render must still own the historical inline active-hero selection during divergence characterization'
);
assert.equal(
  (sourceRender.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Source Render must not consume the canonical helper in this characterization-only lot'
);

const store=new Map();
const RT='gensrpg_dungeon_runtime_v2';
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};

function element(tag='div'){
  return {
    tagName:String(tag).toUpperCase(),
    className:'',
    title:'',
    textContent:'',
    innerHTML:'',
    children:[],
    style:{setProperty(){},removeProperty(){}},
    appendChild(child){this.children.push(child);return child},
    querySelectorAll(){return []},
    remove(){},
    setAttribute(){}
  };
}

const cells=[element('div'),element('div'),element('div')];
for(const cell of cells){
  cell.querySelectorAll=()=>[];
}

const document={
  readyState:'loading',
  head:{appendChild(){}},
  addEventListener(){},
  getElementById(){return null},
  querySelectorAll(selector){
    return selector==='#dc047RoomBoard .dc047Grid > .dc047Cell'?cells:[];
  },
  createElement(tag){return element(tag)}
};

const ctx={
  console,JSON,Math,Date,document,localStorage,
  setTimeout(){return 1},
  DungeonSpatial313:{sameView(){return true}},
  loadActiveEnemies(){return []}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(sourceRender,ctx,{filename:'assets/dungeon/dungeon-source-render-stability-167877.js'});

const api=ctx.DungeonSourceRenderStability167877;
const canonical=ctx.GensDungeonV1.movement.resolveAuthoredActiveHero;
assert.equal(typeof api?.paintTokensNow,'function');
assert.equal(typeof canonical,'function');

function resetCells(){
  for(const cell of cells)cell.children.length=0;
}

function runtime(participants,index,positions){
  return {
    participants,index,positions,room:1,
    last:{
      authoredRuntime167839:true,
      worldDungeonId:'world-source-render',
      worldNodeId:'node-A'
    }
  };
}

function activeTokenTitle(){
  const tokens=cells.flatMap(c=>c.children).filter(t=>String(t.className).split(/\s+/).includes('dc310Hero'));
  const active=tokens.filter(t=>String(t.className).split(/\s+/).includes('active'));
  assert.ok(active.length<=1,'Source Render must mark at most one hero token active');
  return active.length?String(active[0].title):'';
}

function paint(participants,index,positions){
  resetCells();
  store.set(RT,JSON.stringify(runtime(participants,index,positions)));
  api.paintTokensNow();
  return activeTokenTitle();
}

const cases=[
  {
    name:'index zero',
    participants:['a','b'],index:0,positions:{a:0,b:1},
    source:'a',canonical:'a'
  },
  {
    name:'numeric string index',
    participants:['a','b'],index:'1',positions:{a:0,b:1},
    source:'b',canonical:'b'
  },
  {
    name:'negative index',
    participants:['a','b'],index:-4,positions:{a:0,b:1},
    source:'',canonical:'a'
  },
  {
    name:'index beyond upper bound',
    participants:['a','b'],index:99,positions:{a:0,b:1},
    source:'',canonical:'b'
  },
  {
    name:'fractional beyond upper bound',
    participants:['a','b'],index:1.5,positions:{a:0,b:1},
    source:'',canonical:'b'
  },
  {
    name:'fractional inside bounds',
    participants:['a','b','c'],index:1.5,positions:{a:0,b:1,c:2},
    source:'',canonical:''
  },
  {
    name:'truthy non-string participant',
    participants:[42],index:0,positions:{'42':0},
    source:'42',canonical:'42'
  },
  {
    name:'falsy participant',
    participants:[0,'b'],index:0,positions:{'0':0,b:1},
    source:'',canonical:''
  }
];

for(const test of cases){
  const actualSource=paint(test.participants,test.index,test.positions);
  const actualCanonical=canonical(test.participants,test.index);
  assert.equal(actualSource,test.source,test.name+' Source Render behavior changed');
  assert.equal(actualCanonical,test.canonical,test.name+' canonical behavior changed');
}

resetCells();
store.set(RT,JSON.stringify(runtime([],0,{})));
assert.equal(api.paintTokensNow(),0,'empty participants must render no hero token');
assert.equal(canonical([],0),'','canonical empty participants remains empty');

resetCells();
store.set(RT,JSON.stringify(runtime('ab',0,{a:0,b:1})));
assert.throws(
  ()=>api.paintTokensNow(),
  /forEach/,
  'real Source Render path historically assumes participants is iterable via Array.forEach'
);
assert.equal(canonical('ab',0),'',
  'canonical owner rejects non-array participants instead of entering Source Render legacy path');

console.log(JSON.stringify({
  scenario:'Phase 7 Source Render active hero divergence',
  source:'DungeonSourceRenderStability167877.paintTokensNow inline selector',
  canonical:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  parity:[
    'valid integer index',
    'numeric string index',
    'fractional index still inside bounds',
    'truthy non-string participant inside array',
    'falsy participant'
  ],
  divergence:[
    'negative index: Source Render none vs canonical first',
    'index beyond upper bound: Source Render none vs canonical last',
    'fractional index beyond upper bound: Source Render none vs canonical last',
    'non-array participants: real Source Render path throws during forEach while canonical returns empty'
  ],
  expected:'GREEN characterization only; no runtime migration'
},null,2));
