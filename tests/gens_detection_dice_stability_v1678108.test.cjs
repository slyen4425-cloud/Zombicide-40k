const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dice-performance-1678108.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotThrow(()=>new Function(src));
assert.match(src,/APP_VERSION="16\.78\.112"/);
assert.match(src,/D6_MS=440/);assert.match(src,/D100_MS=420/);assert.match(src,/WATCHDOG_MS=650/);assert.match(src,/REEL_STEPS=11/);
assert.doesNotMatch(src,/setInterval\s*\(/,'dice animation must not use an interval');
assert.doesNotMatch(src,/scheduleTicks|TICK_COUNT/,'low-frequency text tick animation must be removed');
assert.match(src,/gensDiceReelTrack/,'dice must use a reel track');
assert.match(src,/translate3d/,'reel must animate on compositor-friendly transform');
assert.match(src,/\.animate\(/,'reel must use Web Animations when available');
assert.match(bridge,/gens-dice-performance-1678108\.js\?v=1678112/);
assert.match(bridge,/gens-combat-flow-1678111\.js\?v=1678115/);
assert.match(bridge,/gens-combat-runtime-performance-1678110\.js\?v=1678116/);
assert.match(sw,/gensrpg-cache-16\.78\.116-home-bootstrap-isolation/);

let animationCalls=0;
function node(tag='div'){
 const n={tagName:tag.toUpperCase(),className:'',dataset:{},style:{},children:[],parent:null,textContent:'',appendChild(c){this.children.push(c);c.parent=this;return c},append(...xs){xs.forEach(x=>this.appendChild(x))},replaceChildren(...xs){this.children=[];for(const c of xs){if(!c)continue;if(c.isFragment)c.children.forEach(x=>this.appendChild(x));else this.appendChild(c)}},setAttribute(k,v){this[k]=String(v)},querySelector(sel){if(sel==='.rpgD100Label')return this.children.find(c=>c.className==='rpgD100Label')||null;return null},animate(frames,opts){animationCalls++;this._frames=frames;this._opts=opts;return {}}};
 return n;
}
const boxes={d6:node(),d100:node()};
const timers=[];
const document={readyState:'complete',getElementById(id){return boxes[id]||null},createElement:node,createDocumentFragment(){const f=node('fragment');f.isFragment=true;return f},addEventListener(){}};
let now=0,nextTimer=1;function setTimeoutFake(fn,ms=0){const id=nextTimer++;timers.push({id,fn,at:now+Number(ms||0),cleared:false});return id}function clearTimeoutFake(id){const t=timers.find(x=>x.id===id);if(t)t.cleared=true}function runTimers(limit=1000){for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.shift();if(!t)break;if(t.at>limit){timers.unshift(t);break}if(t.cleared)continue;now=t.at;t.fn()}}
const context={console,document,window:null,navigator:{vibrate(){}},setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,Math};context.window=context;
vm.runInNewContext(src,context);
const api=context.GensDicePerformance1678108;assert.ok(api);
let d6done=0;api.animateDiceFast('d6',2,[6,1],4,()=>d6done++);
assert.equal(animationCalls,4,'two D6 must use track + card compositor animations only');
assert.equal(timers.filter(t=>t.at>0&&t.at<440).length,0,'no repeated JS text updates may run during the D6 roll');
runTimers(430);assert.equal(d6done,0);runTimers(650);assert.equal(d6done,1,'D6 must complete in well under one second');
assert.equal(boxes.d6.children.length,2);assert.match(boxes.d6.children[0].className,/success/);assert.match(boxes.d6.children[1].className,/fail/);
now=0;timers.length=0;let d100done=0;api.animateRpgDiceFast('d100',1,[72],60,100,()=>d100done++);
assert.equal(animationCalls,6,'D100 must use track + card compositor animations');
assert.equal(timers.filter(t=>t.at>0&&t.at<420).length,0,'no repeated JS text updates may run during D100 roll');
runTimers(650);assert.equal(d100done,1);assert.equal(boxes.d100.children.length,1);assert.match(boxes.d100.children[0].className,/success/);
console.log('V16.78.112 dice preserved; V16.78.116 lazy combat loader/cache integration OK');
