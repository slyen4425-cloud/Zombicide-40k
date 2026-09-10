const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dice-performance-1678108.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.108"/);
assert.match(src,/D6_MS=420/);assert.match(src,/D100_MS=380/);assert.match(src,/WATCHDOG_MS=900/);
assert.doesNotMatch(src,/setInterval\s*\(/,'mobile dice replacement must not churn DOM on an interval');
assert.match(src,/replaceChildren/,'dice DOM must be replaced in one batch');
assert.match(src,/nodeValue/,'rolling result text must update without repeated child-list reconstruction');
assert.match(bridge,/gens-dice-performance-1678108\.js\?v=1678108/);
assert.match(sw,/gensrpg-cache-16\.78\.108-detection-dice-stability/);
assert.match(sw,/gens-dice-performance-1678108\.js/);

function node(tag='div'){
 const n={tagName:tag.toUpperCase(),className:'',dataset:{},style:{},children:[],parent:null,textContent:'',appendChild(c){this.children.push(c);c.parent=this;return c},append(...xs){xs.forEach(x=>this.appendChild(x))},replaceChildren(c){this.children=[];if(c){if(c.isFragment)c.children.forEach(x=>this.appendChild(x));else this.appendChild(c)}},setAttribute(k,v){this[k]=String(v)}};
 return n;
}
const boxes={d6:node(),d100:node()};
const timers=[];
const document={readyState:'complete',getElementById(id){return boxes[id]||null},createElement:node,createTextNode(v){return {nodeValue:String(v)}},createDocumentFragment(){const f=node('fragment');f.isFragment=true;return f},addEventListener(){}};
let now=0;function setTimeoutFake(fn,ms=0){timers.push({fn,at:now+Number(ms||0)});return timers.length}function runTimers(limit=1000){for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.shift();if(!t)break;if(t.at>limit)break;now=t.at;t.fn()}}
const context={console,document,window:null,navigator:{vibrate(){}},setTimeout:setTimeoutFake,clearTimeout(){}};context.window=context;
vm.runInNewContext(src,context);
const api=context.GensDicePerformance1678108;assert.ok(api);
let d6done=0;api.animateDiceFast('d6',2,[6,1],4,()=>d6done++);runTimers(899);assert.equal(d6done,1,'D6 callback must finish well below 1 second');
assert.equal(boxes.d6.children.length,2);assert.match(boxes.d6.children[0].className,/success/);assert.match(boxes.d6.children[1].className,/fail/);
now=0;timers.length=0;let d100done=0;api.animateRpgDiceFast('d100',1,[72],60,100,()=>d100done++);runTimers(899);assert.equal(d100done,1,'D100 callback must finish well below 1 second');
assert.equal(boxes.d100.children.length,1);assert.match(boxes.d100.children[0].className,/success/);
console.log('V16.78.108 dice performance: bounded callbacks, no interval DOM churn, batched rendering OK');
