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

assert.match(source,/APP_VERSION="16\.78\.102\.9"/);
assert.doesNotMatch(source,/setInterval\s*\(/,"mobile dice must not use main-thread interval ticks");
assert.doesNotMatch(source,/R\.setTimeout\s*=|window\.setTimeout\s*=/,"combat fast path must not globally rewrite timeline timers");
assert.match(source,/translate3d/,"dice motion must stay compositor-friendly");
assert.match(source,/renderHands.*renderAttackButtons.*renderDungeonAttributes/s,"post-roll sheet refreshes must be explicitly gated");
assert.match(source,/__dc214RenderCombat/,"handoff must defer only the heavy base renderer, not the timeline controller");
assert.match(sw,/gensrpg-cache-16\.78\.102\.9-post-dice-mainthread/);
assert.match(sw,/gens-mobile-combat-performance-16781022\.js/);
assert.ok(html.lastIndexOf("gens-mobile-combat-performance-16781022.js")>html.lastIndexOf("dungeon-core-317.js"),"performance bridge must load after the final Dungeon core");
if(process.argv[2]){const body=html.lastIndexOf("</body>"),lastScript=html.lastIndexOf("<script",body);assert.match(html.slice(lastScript,body),/gens-mobile-combat-performance-16781022\.js/,"built performance bridge must be the final runtime script")}
const hookAll=(ui.match(/function hookAll\(\)\{[^\n]+/)||[""])[0];
assert.ok(hookAll&&!hookAll.includes("renderDungeonHeroStats")&&!hookAll.includes("renderDungeonAttributes"),"combat stat renderers must not trigger full UI cleanup scans");
assert.doesNotMatch(ui,/tries\+\+<30|setTimeout\(retry,100\)/,"UI cleanup must not poll every 100ms during combat startup");

class Element{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.className="";this.dataset={};this.style={};this.children=[];this.textContent="";this.innerHTML="";this._classes=new Set()}
  appendChild(child){this.children.push(child);return child}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=[...children]}
  animate(){return {}}
  get classList(){return {contains:n=>this._classes.has(n),add:n=>this._classes.add(n),remove:n=>this._classes.delete(n)}}
}
const boxes={d6:new Element(),d100:new Element(),dungeonCombatModal:new Element(),dungeonCombatSetupView:new Element()};
boxes.dungeonCombatModal.style.display="block";
boxes.dungeonCombatSetupView.innerHTML="combat";
const document={readyState:"complete",createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element("fragment"),getElementById:id=>boxes[id]||null,addEventListener(){}};
let clock=0,nextTimer=1,pending=[];
function setTimeoutFake(fn,delay=0,...args){const id=nextTimer++;pending.push({id,at:clock+Math.max(0,Number(delay)||0),fn:()=>fn(...args),cancelled:false});return id}
function clearTimeoutFake(id){const timer=pending.find(x=>x.id===id);if(timer)timer.cancelled=true}
function runUntil(predicate){for(let guard=0;guard<3000&&!predicate();guard++){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();assert.ok(timer,"expected a pending timer");if(timer.cancelled)continue;clock=timer.at;timer.fn()}return clock}
function runAll(limit=3000){for(let guard=0;guard<limit&&pending.length;guard++){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();if(timer.cancelled)continue;clock=timer.at;timer.fn()}}

let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0;
let handCalls=0,buttonCalls=0,attributeRenderCalls=0,baseRenderCalls=0,activeEnemyRenders=0,combatControllerCalls=0,saves=0;
const sandbox={
  console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,
  performance:{now:()=>clock},current:"hero1",state:{xp:20,rpgAttributes:{force:12}},navigator:{vibrate(){}},
  dungeonEquipmentBonus(){equipmentCalls++;return 2},
  dungeonAttributeValue(id){attributeCalls++;return Number(this.state.rpgAttributes[id])+(this.dungeonEquipmentBonus(id)||0)},
  dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},
  GensCleanRpgStats167874:{value(hero,id){canonicalCalls++;return hero==="hero1"&&id==="force"?14:0}},
  renderHands(){handCalls++},renderAttackButtons(){buttonCalls++},renderDungeonAttributes(){attributeRenderCalls++},
  __dc214RenderCombat(){baseRenderCalls++},
  renderActiveEnemies(){activeEnemyRenders++},
  save(){saves++},saveActiveEnemies(){saves++},
  changeDungeonAttribute(){},dc214Equip(){},dc214Reload(){},saveDungeonHeroStats(){},saveGameProfiles(){},awardDungeonDefeatXp(){}
};
sandbox.renderDungeonCombatRound=function(){combatControllerCalls++;sandbox.__dc214RenderCombat()};
sandbox.applyDungeonAttackDamage=function(){sandbox.renderActiveEnemies();sandbox.renderDungeonCombatRound();return 7};
sandbox.applyBossAttackDamage=function(){sandbox.renderActiveEnemies();sandbox.renderDungeonCombatRound();return 5};
sandbox.dungeonConfirmPendingHeroDamage=function(){sandbox.renderDungeonCombatRound();return true};
sandbox.closeAttackRoll=function(){sandbox.renderDungeonCombatRound();return true};
sandbox.closeSpecialRoll=function(){sandbox.renderDungeonCombatRound();return true};
sandbox.closeEffectPopup=function(){sandbox.renderDungeonCombatRound();return true};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);

for(let i=0;i<200;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);
for(let i=0;i<200;i++)assert.equal(sandbox.GensCleanRpgStats167874.value("hero1","force"),14);
const enemy={force:7};for(let i=0;i<200;i++)assert.equal(sandbox.dungeonEnemyRpgStats(enemy).force,7);
assert.equal(attributeCalls,1,"repeated combat reads must resolve a hero attribute once");
assert.equal(equipmentCalls,1,"repeated combat reads must scan equipment once");
assert.equal(canonicalCalls,1,"repeated canonical stat reads must resolve once");
assert.equal(enemyCalls,1,"repeated enemy stat reads must resolve once");
sandbox.saveActiveEnemies();
assert.equal(sandbox.dungeonAttributeValue("force"),14);
assert.equal(attributeCalls,1,"saving enemy HP must not destroy stat caches");
sandbox.changeDungeonAttribute();
assert.equal(sandbox.dungeonAttributeValue("force"),14);
assert.equal(attributeCalls,2,"a real stat mutation must invalidate cached stats");

pending=[];clock=0;let d6DoneAt=null;
sandbox.animateDice("d6",3,[2,5,6],4,()=>{d6DoneAt=clock});
sandbox.renderHands();sandbox.renderAttackButtons();sandbox.renderDungeonAttributes();
assert.equal(handCalls,0,"hand redraw must not run while dice result callback is waiting");
assert.equal(buttonCalls,0,"attack button redraw must not run while dice result callback is waiting");
assert.equal(attributeRenderCalls,0,"attribute sheet redraw must not run while dice result callback is waiting");
runUntil(()=>d6DoneAt!==null);
assert.ok(d6DoneAt<=520,`D6 callback too slow: ${d6DoneAt}ms`);
runAll();
assert.equal(handCalls,1,"hand redraw must happen after result callback");
assert.equal(buttonCalls,1,"attack buttons must refresh after result callback");
assert.equal(attributeRenderCalls,1,"attributes must refresh after result callback");

pending=[];clock=0;let d100DoneAt=null;
sandbox.animateRpgDice("d100",1,[73],51,100,()=>{d100DoneAt=clock});
runUntil(()=>d100DoneAt!==null);
assert.ok(d100DoneAt<=500,`D100 callback too slow: ${d100DoneAt}ms`);
runAll();

pending=[];clock=0;activeEnemyRenders=0;baseRenderCalls=0;combatControllerCalls=0;
assert.equal(sandbox.applyDungeonAttackDamage(),7);
assert.equal(activeEnemyRenders,0,"enemy list render must be deferred out of damage calculation");
assert.equal(combatControllerCalls,0,"combat controller render must be deferred out of damage calculation");
runAll();
assert.ok(activeEnemyRenders>=1,"enemy list still refreshes after damage result");
assert.ok(combatControllerCalls>=1,"combat still refreshes after damage result");

pending=[];clock=0;baseRenderCalls=0;combatControllerCalls=0;
sandbox.closeAttackRoll();
assert.equal(combatControllerCalls,1,"timeline controller must still run synchronously on close");
assert.equal(baseRenderCalls,0,"heavy combat DOM render must not block player-to-AI handoff");
runAll();
assert.equal(baseRenderCalls,1,"heavy combat DOM render must still happen after handoff");

pending=[];clock=0;baseRenderCalls=0;combatControllerCalls=0;
sandbox.dungeonConfirmPendingHeroDamage();
assert.equal(combatControllerCalls,1,"AI damage confirmation must keep timeline controller alive");
assert.equal(baseRenderCalls,0,"heavy combat DOM render must not block AI-to-player handoff");
runAll();
assert.equal(baseRenderCalls,1,"combat view must refresh after AI handoff");

const legacyD6Ms=1250+(3-1)*65+4*105+260;
const legacyD100Ms=10*90+180;
assert.ok(d6DoneAt<legacyD6Ms/3,"D6 optimized path should be over 3x faster than the legacy 3-dice path");
assert.ok(d100DoneAt<legacyD100Ms/2,"D100 optimized path should be over 2x faster than the legacy path");
console.log("V16.78.102.9 post-dice profile OK",{legacyD6Ms,d6DoneAt,legacyD100Ms,d100DoneAt,equipmentCalls,attributeCalls,canonicalCalls,enemyCalls,metrics:sandbox.GensMobileCombatPerformance16781022.metrics()});
