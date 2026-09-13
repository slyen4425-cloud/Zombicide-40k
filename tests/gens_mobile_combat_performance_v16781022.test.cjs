const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/gensrpg/gens-mobile-combat-performance-16781022.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
assert.match(source,/APP_VERSION="16\.78\.102\.5"/);
assert.doesNotMatch(source,/setInterval\s*\(/);
assert.match(source,/resetLifecycle/);
assert.match(source,/dc200StartCombat/);
assert.match(source,/dc104FinishVictory/);
assert.match(html,/gens-mobile-combat-performance-16781022\.js/);
assert.match(sw,/gens-mobile-combat-performance-16781022\.js/);
class Element{constructor(){this.className="";this.dataset={};this.style={};this.children=[];this.textContent=""}appendChild(c){this.children.push(c);return c}append(...c){this.children.push(...c)}replaceChildren(...c){this.children=[...c]}animate(){return {}}}
const boxes={d6:new Element(),d100:new Element()};
const document={readyState:"complete",createElement:()=>new Element(),createDocumentFragment:()=>new Element(),getElementById:id=>boxes[id]||null,addEventListener(){}};
let clock=0,nextTimer=1,pending=[];function setTimeoutFake(fn,delay=0){const id=nextTimer++;pending.push({id,at:clock+(Number(delay)||0),fn,cancelled:false});return id}function clearTimeoutFake(id){const t=pending.find(x=>x.id===id);if(t)t.cancelled=true}function runUntil(p){for(let i=0;i<1000&&!p();i++){pending.sort((a,b)=>a.at-b.at);const t=pending.shift();assert.ok(t);if(t.cancelled)continue;clock=t.at;t.fn()}return clock}
let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0,detectResolve=0,detectPaint=0,starts=0,finishes=0,statChanges=0;
const runtime={room:1,participants:["hero1"],positions:{hero1:4},enemies:[{id:"e1",hp:4,cell:5}]};
const sandbox={console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,performance:{now:()=>clock},requestAnimationFrame:fn=>setTimeoutFake(fn,16),current:"hero1",state:{rpgAttributes:{force:12}},navigator:{vibrate(){}},dungeonCombatActive:false,dc023AiToken:7,dungeonTurn156:{active:true,order:[1],index:3,aiBusy:true,lastSig:"old"},dungeonAiLast023:{old:true},dc040VictoryOpen:true,dc036AllowCombatClose:true,
 dungeonEquipmentBonus(){equipmentCalls++;return 2},dungeonAttributeValue(id){attributeCalls++;return this.state.rpgAttributes[id]+this.dungeonEquipmentBonus(id)},dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},GensCleanRpgStats167874:{value(){canonicalCalls++;return 14}},GensEquipmentStatCleanup1678102:{invalidateEquipmentBonusCache(){}},changeDungeonAttribute(id,d){statChanges++;this.state.rpgAttributes[id]+=d;return true},
 dc200StartCombat(){starts++;this.dungeonCombatActive=true;this.dungeonTurn156.active=true;return true},dc104FinishVictory(){finishes++;this.dungeonCombatActive=false;return true},
 rt(){return runtime},cells211(){return []},dc305PositionalGameplay(){return true},paintEnemySense211(){detectPaint++;return [{e:{id:"e1"},z:new Set([4])}]},resolveEnemyDetection211(){detectResolve++},paintTraps211(){return 0},sensePanel211(){},puzzleAction211(){},distinguishScene211(){},decorate211(){detectPaint++;detectResolve++}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);
for(let i=0;i<100;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);assert.equal(attributeCalls,1);assert.equal(equipmentCalls,1);
sandbox.changeDungeonAttribute("force",1);assert.equal(sandbox.dungeonAttributeValue("force"),15);assert.equal(attributeCalls,2);
sandbox.decorate211();sandbox.decorate211();assert.equal(detectResolve,1);assert.equal(detectPaint,1);
sandbox.dungeonTurn156={active:true,order:[1],index:4,aiBusy:true,lastSig:"stale"};const tokenBefore=sandbox.dc023AiToken;sandbox.dc200StartCombat();assert.equal(starts,1);assert.ok(sandbox.dc023AiToken>tokenBefore);assert.equal(sandbox.dungeonTurn156.aiBusy,false);assert.equal(sandbox.dungeonTurn156.lastSig,"");
sandbox.dungeonTurn156={active:true,order:[1],index:2,aiBusy:true,lastSig:"again"};sandbox.dc104FinishVictory();assert.equal(finishes,1);assert.equal(sandbox.dungeonTurn156.active,false);assert.deepEqual(sandbox.dungeonTurn156.order,[]);assert.equal(sandbox.dungeonTurn156.aiBusy,false);
// Second encounter must start from a clean turn state as well.
sandbox.dungeonTurn156={active:true,order:[9],index:9,aiBusy:true,lastSig:"dirty"};sandbox.dc200StartCombat();assert.equal(starts,2);assert.equal(sandbox.dungeonTurn156.aiBusy,false);assert.equal(sandbox.dungeonTurn156.lastSig,"");
pending=[];clock=0;let done=null;sandbox.animateDice("d6",3,[2,5,6],4,()=>done=clock);runUntil(()=>done!==null);assert.ok(done<=520);
console.log("V16.78.102.5 lifecycle reset OK",sandbox.GensMobileCombatPerformance16781022.metrics());
