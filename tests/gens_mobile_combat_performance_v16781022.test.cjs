const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"assets/gensrpg/gens-mobile-combat-performance-16781022.js"),"utf8");
const builtIndex=path.resolve(process.argv[2]||path.join(root,"index.html"));
const html=fs.readFileSync(builtIndex,"utf8");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const ui=fs.readFileSync(path.join(root,"assets/gensrpg/gens-dungeon-ui-cleanup-1678100.js"),"utf8");

assert.match(source,/APP_VERSION="16\.78\.102\.7"/);
assert.doesNotMatch(source,/setInterval\s*\(/,"mobile dice must not use main-thread interval ticks");
assert.match(source,/translate3d/,"dice motion must stay compositor-friendly");
assert.match(sw,/gensrpg-cache-16\.78\.102\.(?:2|7)-/);
assert.match(sw,/gens-mobile-combat-performance-16781022\.js/);
assert.ok(html.lastIndexOf("gens-mobile-combat-performance-16781022.js")>html.lastIndexOf("dungeon-core-317.js"),"performance bridge must load after the final Dungeon core");
if(process.argv[2]){const body=html.lastIndexOf("</body>"),lastScript=html.lastIndexOf("<script",body);assert.match(html.slice(lastScript,body),/gens-mobile-combat-performance-16781022\.js/,"built performance bridge must be the final runtime script")}
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
const document={readyState:"complete",createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element("fragment"),getElementById:id=>boxes[id]||null,addEventListener(){}};
let clock=0,nextTimer=1,pending=[];
function setTimeoutFake(fn,delay=0){const id=nextTimer++;pending.push({id,at:clock+Math.max(0,Number(delay)||0),fn,cancelled:false});return id}
function clearTimeoutFake(id){const timer=pending.find(x=>x.id===id);if(timer)timer.cancelled=true}
function runNext(){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();assert.ok(timer,"expected a pending timer");if(timer.cancelled)return runNext();clock=timer.at;timer.fn();return clock}
function runUntil(predicate){for(let guard=0;guard<1000&&!predicate();guard++)runNext();return clock}

let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0,saves=0;
const events=[];
const sandbox={
  console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,current:"hero1",
  state:{xp:20,rpgAttributes:{force:12}},navigator:{vibrate(){}},
  dungeonEquipmentBonus(){equipmentCalls++;return 2},
  dungeonAttributeValue(id){attributeCalls++;return Number(this.state.rpgAttributes[id])+(this.dungeonEquipmentBonus(id)||0)},
  dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},
  GensCleanRpgStats167874:{value(hero,id){canonicalCalls++;return hero==="hero1"&&id==="force"?14:0}},
  save(){saves++},saveActiveEnemies(){saves++},
  changeDungeonAttribute(id,delta){this.state.rpgAttributes[id]+=delta;return this.state.rpgAttributes[id]},
  renderActiveEnemies(){events.push("active-render")},
  renderDungeonCombatRound(){events.push("combat-render")},
  __dc214RenderCombat(){events.push("base-combat-render")},
  render(){events.push("full-render")},
  applyDungeonAttackDamage(){this.renderActiveEnemies();this.renderDungeonCombatRound();events.push("damage-result-written")},
  dungeonConfirmPendingHeroDamage(){this.render();this.renderDungeonCombatRound();this.__dc214RenderCombat();events.push("turn-event-dispatched")}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);

for(let i=0;i<200;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);
for(let i=0;i<200;i++)assert.equal(sandbox.GensCleanRpgStats167874.value("hero1","force"),14);
const enemy={force:7};for(let i=0;i<200;i++)assert.equal(sandbox.dungeonEnemyRpgStats(enemy).force,7);
assert.equal(attributeCalls,1,"repeated attribute reads must stay cached");
assert.equal(equipmentCalls,1,"repeated equipment scans must stay cached");
assert.equal(canonicalCalls,1,"repeated canonical stat reads must stay cached");
assert.equal(enemyCalls,1,"repeated enemy stat reads must stay cached");

sandbox.save();
assert.equal(sandbox.dungeonAttributeValue("force"),14);
assert.equal(attributeCalls,1,"plain persistence must not invalidate combat stat caches");
sandbox.changeDungeonAttribute("force",1);
assert.equal(sandbox.dungeonAttributeValue("force"),15);
assert.equal(attributeCalls,2,"real stat mutation must invalidate cached attributes");

pending=[];clock=0;events.length=0;
sandbox.applyDungeonAttackDamage();
assert.deepEqual(events,["damage-result-written"],"damage result must be written before heavy enemy/combat renders");
runUntil(()=>events.includes("combat-render"));
assert.ok(events.indexOf("damage-result-written")<events.indexOf("active-render"));
assert.ok(events.indexOf("damage-result-written")<events.indexOf("combat-render"));
assert.ok(clock>=40,"heavy combat refresh must be deferred to a later task");

pending=[];clock=0;events.length=0;
sandbox.dungeonConfirmPendingHeroDamage();
assert.deepEqual(events,["turn-event-dispatched"],"AI/player turn event must dispatch before full hero/base combat renders");
runUntil(()=>events.includes("base-combat-render"));
assert.ok(events.indexOf("turn-event-dispatched")<events.indexOf("base-combat-render"));
assert.ok(!events.includes("full-render"),"full application render must be suppressed during combat damage confirmation");

pending=[];clock=0;let d6DoneAt=null;
sandbox.animateDice("d6",3,[2,5,6],4,()=>{d6DoneAt=clock});
runUntil(()=>d6DoneAt!==null);
assert.ok(d6DoneAt<=520,`D6 callback too slow: ${d6DoneAt}ms`);
pending=[];clock=0;let d100DoneAt=null;
sandbox.animateRpgDice("d100",1,[73],51,100,()=>{d100DoneAt=clock});
runUntil(()=>d100DoneAt!==null);
assert.ok(d100DoneAt<=500,`D100 callback too slow: ${d100DoneAt}ms`);

const legacyD6Ms=1250+(3-1)*65+4*105+260;
const legacyD100Ms=10*90+180;
assert.ok(d6DoneAt<legacyD6Ms/3,"D6 optimized path should be over 3x faster than the legacy 3-dice path");
assert.ok(d100DoneAt<legacyD100Ms/2,"D100 optimized path should be over 2x faster than the legacy path");
console.log("V16.78.102.7 combat resolution ordering OK",{legacyD6Ms,d6DoneAt,legacyD100Ms,d100DoneAt,equipmentCalls,attributeCalls,canonicalCalls,enemyCalls,metrics:sandbox.GensMobileCombatPerformance16781022.metrics()});
