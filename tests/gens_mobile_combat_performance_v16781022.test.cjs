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

assert.match(source,/APP_VERSION="16\.78\.102\.3"/);
assert.doesNotMatch(source,/setInterval\s*\(/,"mobile dice must not use main-thread interval ticks");
assert.match(source,/translate3d/,"dice motion must stay compositor-friendly");
assert.match(source,/wrapSaveActiveEnemies/,'enemy persistence UI side effects must be batchable');
assert.match(source,/wrapDamageHotPath/,'post-roll combat renders must be moved out of the synchronous damage path');
assert.match(sw,/gensrpg-cache-16\.78\.102\.3-post-roll-latency/);
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
function runUntil(predicate){for(let guard=0;guard<1000&&!predicate();guard++){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();assert.ok(timer,"expected a pending timer");if(timer.cancelled)continue;clock=timer.at;timer.fn()}return clock}

let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0,renders=0,saves=0,enemyButtonRenders=0,exploreUpdates=0,pushes=0,activeEnemyRenders=0;
const sandbox={console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,requestAnimationFrame:fn=>setTimeoutFake(fn,0),current:"hero1",state:{xp:20,rpgAttributes:{force:12}},navigator:{vibrate(){}},dungeonCombatActive:true,dungeonEquipmentBonus(){equipmentCalls++;return 2},dungeonAttributeValue(id){attributeCalls++;return Number(this.state.rpgAttributes[id])+(this.dungeonEquipmentBonus(id)||0)},dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},GensCleanRpgStats167874:{value(hero,id){canonicalCalls++;return hero==="hero1"&&id==="force"?14:0}},renderDungeonCombatRound(){renders++},renderActiveEnemies(){activeEnemyRenders++},renderActiveEnemyButtons(){enemyButtonRenders++},updateDungeonExploreButtons(){exploreUpdates++},z40kSchedulePush(){pushes++},save(){saves++},saveActiveEnemies(){saves++;this.renderActiveEnemyButtons();this.updateDungeonExploreButtons();this.z40kSchedulePush()},applyDungeonAttackDamage(){this.saveActiveEnemies([]);this.renderActiveEnemies();this.renderDungeonCombatRound()}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);

for(let i=0;i<200;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);
for(let i=0;i<200;i++)assert.equal(sandbox.GensCleanRpgStats167874.value("hero1","force"),14);
const enemy={force:7};for(let i=0;i<200;i++)assert.equal(sandbox.dungeonEnemyRpgStats(enemy).force,7);
for(let i=0;i<50;i++)sandbox.renderDungeonCombatRound();
assert.equal(attributeCalls,1,"repeated combat renders must resolve a hero attribute once");
assert.equal(equipmentCalls,1,"repeated combat renders must scan equipment once");
assert.equal(canonicalCalls,1,"repeated canonical stat reads must resolve once");
assert.equal(enemyCalls,1,"repeated enemy stat reads must resolve once");
sandbox.save();
assert.equal(sandbox.dungeonAttributeValue("force"),14);
assert.equal(attributeCalls,2,"a state mutation must invalidate cached stats");

renders=0;activeEnemyRenders=0;enemyButtonRenders=0;exploreUpdates=0;pushes=0;pending=[];clock=0;
sandbox.applyDungeonAttackDamage("enemy1",4,1,4);
assert.equal(renders,0,"timeline render must not block synchronous damage resolution");
assert.equal(activeEnemyRenders,0,"active enemy render must not block synchronous damage resolution");
assert.equal(enemyButtonRenders,0,"enemy button rebuild must be deferred from saveActiveEnemies");
assert.equal(exploreUpdates,0,"exploration rebuild must be deferred from saveActiveEnemies");
runUntil(()=>renders===1&&activeEnemyRenders===1&&enemyButtonRenders===1&&exploreUpdates===1);
assert.equal(pushes,1,"remote push scheduling should be coalesced with enemy UI refresh");

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
console.log("V16.78.102.3 mobile combat profile OK",{legacyD6Ms,d6DoneAt,legacyD100Ms,d100DoneAt,equipmentCalls,attributeCalls,canonicalCalls,enemyCalls,renders,metrics:sandbox.GensMobileCombatPerformance16781022.metrics()});
