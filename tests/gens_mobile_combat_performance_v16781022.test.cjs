const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/gensrpg/gens-mobile-combat-performance-16781022.js"),"utf8");
const bootstrap=fs.readFileSync(path.join(root,"assets/gensrpg/core/runtime-bootstrap-v1.js"),"utf8");
const builtIndex=path.resolve(process.argv[2]||path.join(root,"index.html"));
const html=fs.readFileSync(builtIndex,"utf8");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const ui=fs.readFileSync(path.join(root,"assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js"),"utf8");

assert.match(source,/APP_VERSION="16\.78\.114\.11-architecture-performance-1"/);
assert.doesNotMatch(source,/setInterval\s*\(/,"optimized Dungeon dice must not use main-thread interval ticks");
assert.match(source,/nativeAnimateDice/,'Survival native dice renderer must be preserved');
assert.match(source,/assets\/gensrpg\/core\/runtime-bootstrap-v1\.js\?v=1/,'performance layer must delegate composition to RuntimeBootstrap');
for(const legacyOwned of [
  'gens-rpg-tactical-combat-v2.js','gens-rpg-tactical-combat-v2-adapter.js','gens-rpg-tactical-combat-v2-rules.js',
  'gens-rpg-tactical-combat-v2-integration.js','gens-rpg-tactical-combat-v2-ui.js','gens-rpg-tactical-combat-v2-bridge.js','gens-survival-mode-isolation-1678104.js'
]) assert.equal(source.includes(legacyOwned),false,`performance layer must no longer own ${legacyOwned}`);
assert.doesNotMatch(bootstrap,/gens-survival-mode-isolation-1678104\.js/,'Phase 6 RuntimeBootstrap must not load the retired Survival/Dungeon isolation guard');
assert.match(source,/translate3d/,"Dungeon dice motion must stay compositor-friendly");
assert.match(sw,/gensrpg-cache-16\.78\.106-real-tactical-runtime/);
assert.match(sw,/gens-mobile-combat-performance-16781022\.js/);
assert.doesNotMatch(sw,/gens-survival-mode-isolation-1678104\.js/,'service worker must not precache the retired Survival/Dungeon isolation guard');
assert.match(sw,/gens-rpg-runtime-repair-1678106\.js/);
assert.ok(html.lastIndexOf("gens-mobile-combat-performance-16781022.js")>html.lastIndexOf("dungeon-core-317.js"),"performance entry must load after the final Dungeon core");
if(process.argv[2]){const body=html.lastIndexOf("</body>"),lastScript=html.lastIndexOf("<script",body);assert.match(html.slice(lastScript,body),/gens-mobile-combat-performance-16781022\.js/,"built performance entry must remain the final static runtime script during bootstrap extraction")}
const hookAll=(ui.match(/function hookAll\(\)\{[^\n]+/)||[""])[0];
assert.ok(hookAll&&!hookAll.includes("renderDungeonHeroStats")&&!hookAll.includes("renderDungeonAttributes"),"combat stat renderers must not trigger full UI cleanup scans");
assert.doesNotMatch(ui,/tries\+\+<30|setTimeout\(retry,100\)/,"UI cleanup must not poll every 100ms during combat startup");

class Element{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.className="";this.dataset={};this.style={};this.children=[];this.textContent=""}
  appendChild(child){this.children.push(child);return child}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=[...children]}
  animate(){return {}}
}
const boxes={d6:new Element(),d100:new Element()};
const document={readyState:"complete",createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element("fragment"),getElementById:id=>boxes[id]||null,addEventListener(){},head:null,documentElement:null};
let clock=0,nextTimer=1,pending=[];
function setTimeoutFake(fn,delay=0){const id=nextTimer++;pending.push({id,at:clock+Math.max(0,Number(delay)||0),fn,cancelled:false});return id}
function clearTimeoutFake(id){const timer=pending.find(x=>x.id===id);if(timer)timer.cancelled=true}
function runUntil(predicate){for(let guard=0;guard<1000&&!predicate();guard++){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();assert.ok(timer,"expected a pending timer");if(timer.cancelled)continue;clock=timer.at;timer.fn()}return clock}

let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0,renders=0,saves=0,nativeD6=0,nativeD100=0;
let style='dungeon';
const sandbox={console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,current:"hero1",state:{xp:20,rpgAttributes:{force:12}},navigator:{vibrate(){}},currentGameStyle:()=>style,animateDice(){nativeD6++;return 'native-d6'},animateRpgDice(){nativeD100++;return 'native-d100'},dungeonEquipmentBonus(){equipmentCalls++;return 2},dungeonAttributeValue(id){attributeCalls++;return Number(this.state.rpgAttributes[id])+(this.dungeonEquipmentBonus(id)||0)},dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},GensCleanRpgStats167874:{value(hero,id){canonicalCalls++;return hero==="hero1"&&id==="force"?14:0}},renderDungeonCombatRound(){renders++},save(){saves++},saveActiveEnemies(){saves++}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);

for(let i=0;i<200;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);
for(let i=0;i<200;i++)assert.equal(sandbox.GensCleanRpgStats167874.value("hero1","force"),14);
const enemy={force:7};for(let i=0;i<200;i++)assert.equal(sandbox.dungeonEnemyRpgStats(enemy).force,7);
for(let i=0;i<50;i++)sandbox.renderDungeonCombatRound();
assert.equal(attributeCalls,1);assert.equal(equipmentCalls,1);assert.equal(canonicalCalls,1);assert.equal(enemyCalls,1);
sandbox.save();assert.equal(sandbox.dungeonAttributeValue("force"),14);assert.equal(attributeCalls,2);

pending=[];clock=0;let d6DoneAt=null;
sandbox.animateDice("d6",3,[2,5,6],4,()=>{d6DoneAt=clock});runUntil(()=>d6DoneAt!==null);assert.ok(d6DoneAt<=520,`D6 callback too slow: ${d6DoneAt}ms`);
pending=[];clock=0;let d100DoneAt=null;
sandbox.animateRpgDice("d100",1,[73],51,100,()=>{d100DoneAt=clock});runUntil(()=>d100DoneAt!==null);assert.ok(d100DoneAt<=500,`D100 callback too slow: ${d100DoneAt}ms`);
assert.equal(nativeD6,0);assert.equal(nativeD100,0);

style='survival';
assert.equal(sandbox.animateDice('d6',1,[6],4,()=>{}),'native-d6');
assert.equal(sandbox.animateRpgDice('d100',1,[75],51,100,()=>{}),'native-d100');
assert.equal(nativeD6,1,'Survival must keep original numbered/pipped dice renderer');
assert.equal(nativeD100,1,'Survival must keep original RPG-die function if invoked');

const legacyD6Ms=1250+(3-1)*65+4*105+260,legacyD100Ms=10*90+180;
assert.ok(d6DoneAt<legacyD6Ms/3);assert.ok(d100DoneAt<legacyD100Ms/2);
console.log("GenSrpG mobile combat performance-only profile OK",{d6DoneAt,d100DoneAt,nativeD6,nativeD100});
