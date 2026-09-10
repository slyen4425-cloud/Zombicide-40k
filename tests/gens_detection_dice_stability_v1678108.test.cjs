const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dice-performance-1678108.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.109"/);
assert.match(src,/D6_MS=560/);assert.match(src,/D100_MS=520/);assert.match(src,/WATCHDOG_MS=950/);
assert.doesNotMatch(src,/setInterval\s*\(/,'dice animation must not churn DOM on an interval');
assert.doesNotMatch(src,/keepInstalled/,'dice renderer must not run an 8-second reinstall loop');
assert.match(src,/\.animate\(/,'dice must retain a visible compositor animation');
assert.match(src,/replaceChildren/,'dice DOM must be replaced in one batch');
assert.match(bridge,/gens-dice-performance-1678108\.js\?v=1678109/);
const hookAll=(bridge.match(/function hookAll\(\)\{[^\n]+/)||[''])[0];
assert.ok(hookAll,'hookAll must exist');
assert.ok(!hookAll.includes('renderDungeonHeroStats'),'visual repair must not hook combat-hot hero stat rendering');
assert.ok(!hookAll.includes('renderDungeonAttributes'),'visual repair must not hook combat-hot attribute rendering');
assert.doesNotMatch(bridge,/if\(tries\+\+<30\)setTimeout\(retry,100\)/,'visual bridge must not schedule repeated full UI repair scans');
assert.match(sw,/gensrpg-cache-16\.78\.109-combat-dice-performance/);
assert.match(sw,/gens-dice-performance-1678108\.js/);

let animationCalls=0;
function node(tag='div'){
 const n={tagName:tag.toUpperCase(),className:'',dataset:{},style:{},children:[],parent:null,textContent:'',appendChild(c){this.children.push(c);c.parent=this;return c},append(...xs){xs.forEach(x=>this.appendChild(x))},replaceChildren(c){this.children=[];if(c){if(c.isFragment)c.children.forEach(x=>this.appendChild(x));else this.appendChild(c)}},setAttribute(k,v){this[k]=String(v)},animate(frames,opts){animationCalls++;this._frames=frames;this._opts=opts;return {}}};
 return n;
}
const boxes={d6:node(),d100:node()};
const timers=[];
const document={readyState:'complete',getElementById(id){return boxes[id]||null},createElement:node,createDocumentFragment(){const f=node('fragment');f.isFragment=true;return f},addEventListener(){}};
let now=0,nextTimer=1;function setTimeoutFake(fn,ms=0){const id=nextTimer++;timers.push({id,fn,at:now+Number(ms||0),cleared:false});return id}function clearTimeoutFake(id){const t=timers.find(x=>x.id===id);if(t)t.cleared=true}function runTimers(limit=1000){for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.shift();if(!t)break;if(t.at>limit){timers.unshift(t);break}if(t.cleared)continue;now=t.at;t.fn()}}
const context={console,document,window:null,navigator:{vibrate(){}},setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake};context.window=context;
vm.runInNewContext(src,context);
const api=context.GensDicePerformance1678108;assert.ok(api);
let d6done=0;api.animateDiceFast('d6',2,[6,1],4,()=>d6done++);assert.equal(animationCalls,2,'each visible D6 must start a compositor animation');runTimers(900);assert.equal(d6done,1,'D6 callback must finish below one second');
assert.equal(boxes.d6.children.length,2);assert.match(boxes.d6.children[0].className,/success/);assert.match(boxes.d6.children[1].className,/fail/);
now=0;timers.length=0;let d100done=0;api.animateRpgDiceFast('d100',1,[72],60,100,()=>d100done++);assert.equal(animationCalls,3,'D100 must also visibly animate');runTimers(900);assert.equal(d100done,1,'D100 callback must finish below one second');
assert.equal(boxes.d100.children.length,1);assert.match(boxes.d100.children[0].className,/success/);
console.log('V16.78.109 dice performance: visible compositor animation + bounded callbacks + no combat-hot repair scans OK');
