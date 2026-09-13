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

assert.match(source,/APP_VERSION="16\.78\.102\.6"/);
assert.doesNotMatch(source,/setInterval\s*\(/,"mobile dice must not use main-thread interval ticks");
assert.match(source,/findCanon101/,"combat bridge must identify the V101 canonical render wrapper");
assert.match(source,/renderBypasses/,"combat bridge must expose canonical render bypass metrics");
assert.match(source,/translate3d/,"dice motion must stay compositor-friendly");
assert.match(sw,/gensrpg-cache-16\.78\.102\.6-combat-render-chain/);
assert.match(sw,/gens-mobile-combat-performance-16781022\.js/);
assert.ok(html.lastIndexOf("gens-mobile-combat-performance-16781022.js")>html.lastIndexOf("dungeon-core-317.js"),"performance bridge must load after the final Dungeon core");
const hookAll=(ui.match(/function hookAll\(\)\{[^\n]+/)||[""])[0];
assert.ok(hookAll&&!hookAll.includes("renderDungeonHeroStats")&&!hookAll.includes("renderDungeonAttributes"),"UI cleanup must not hook combat stat renderers");

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
function runUntil(predicate){for(let guard=0;guard<2000&&!predicate();guard++){pending.sort((a,b)=>a.at-b.at);const timer=pending.shift();assert.ok(timer,"expected a pending timer");if(timer.cancelled)continue;clock=timer.at;timer.fn()}return clock}

let equipmentCalls=0,attributeCalls=0,canonicalCalls=0,enemyCalls=0,saves=0,statChanges=0,baseAttrRenders=0,canonAttrRenders=0,baseHeroRenders=0,canonHeroRenders=0,detectPaint=0,detectResolve=0,trapPaint=0;
function baseAttributes(){baseAttrRenders++;return "base-attributes"}
function canonAttributes(){canonAttrRenders++;return baseAttributes()}
canonAttributes.__canon101=true;canonAttributes.__original=baseAttributes;
function baseHeroStats(){baseHeroRenders++;return "base-hero"}
function canonHeroStats(){canonHeroRenders++;return baseHeroStats()}
canonHeroStats.__canon101=true;canonHeroStats.__original=baseHeroStats;
const runtime={room:1,participants:["hero1"],positions:{hero1:4},enemies:[{id:"e1",hp:4,cell:5}]};
const sandbox={console,document,setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,performance:{now:()=>clock},requestAnimationFrame:fn=>setTimeoutFake(fn,16),current:"hero1",state:{xp:20,rpgAttributes:{force:12}},navigator:{vibrate(){}},dungeonCombatActive:true,
  dungeonEquipmentBonus(){equipmentCalls++;return 2},
  dungeonAttributeValue(id){attributeCalls++;return Number(this.state.rpgAttributes[id])+(this.dungeonEquipmentBonus(id)||0)},
  dungeonEnemyRpgStats(def){enemyCalls++;return {force:def.force}},
  GensCleanRpgStats167874:{value(hero,id){canonicalCalls++;return hero==="hero1"&&id==="force"?14:0}},
  renderDungeonAttributes:canonAttributes,renderDungeonHeroStats:canonHeroStats,
  save(){saves++},saveActiveEnemies(){saves++},applyDungeonAttackDamage(){saves++},
  changeDungeonAttribute(id,d){statChanges++;this.state.rpgAttributes[id]+=d;return true},
  rt(){return runtime},cells211(){return []},dc305PositionalGameplay(){return true},
  paintEnemySense211(){detectPaint++;return [{e:{id:"e1"},z:new Set([4])}]},
  resolveEnemyDetection211(){detectResolve++},paintTraps211(){trapPaint++;return 0},sensePanel211(){},puzzleAction211(){},distinguishScene211(){},decorate211(){detectPaint++;detectResolve++}
};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox);

for(let i=0;i<200;i++)assert.equal(sandbox.dungeonAttributeValue("force"),14);
for(let i=0;i<200;i++)assert.equal(sandbox.GensCleanRpgStats167874.value("hero1","force"),14);
const enemy={force:7};for(let i=0;i<200;i++)assert.equal(sandbox.dungeonEnemyRpgStats(enemy).force,7);
assert.equal(attributeCalls,1);
assert.equal(equipmentCalls,1);
assert.equal(canonicalCalls,1);
assert.equal(enemyCalls,1);

sandbox.renderDungeonAttributes();sandbox.renderDungeonHeroStats();
assert.equal(canonAttrRenders,0,"active combat must bypass the V101 full canonical attribute DOM completion");
assert.equal(canonHeroRenders,0,"active combat must bypass the V101 full canonical hero-stat DOM completion");
assert.equal(baseAttrRenders,1);assert.equal(baseHeroRenders,1);
sandbox.dungeonCombatActive=false;
sandbox.renderDungeonAttributes();sandbox.renderDungeonHeroStats();
assert.equal(canonAttrRenders,1,"outside combat the canonical renderer must remain intact");
assert.equal(canonHeroRenders,1,"outside combat the canonical hero renderer must remain intact");
sandbox.dungeonCombatActive=true;

sandbox.save();sandbox.saveActiveEnemies();sandbox.applyDungeonAttackDamage();
assert.equal(sandbox.dungeonAttributeValue("force"),14);
assert.equal(attributeCalls,1,"routine HP/enemy persistence must not destroy the derived-stat cache");
sandbox.changeDungeonAttribute("force",1);
assert.equal(sandbox.dungeonAttributeValue("force"),15);
assert.equal(attributeCalls,2,"a real stat mutation must invalidate cached stats");

sandbox.decorate211();sandbox.decorate211();
assert.equal(detectResolve,1,"same-frame dungeon detection must run once");
assert.equal(detectPaint,1,"same-frame enemy zone paint must run once");
runUntil(()=>trapPaint===1);
clock+=50;sandbox.decorate211();
assert.equal(detectResolve,2,"detection must run again after the duplicate window");

pending=[];clock=0;let d6DoneAt=null;
sandbox.animateDice("d6",3,[2,5,6],4,()=>{d6DoneAt=clock});
runUntil(()=>d6DoneAt!==null);
assert.ok(d6DoneAt<=520,`D6 callback too slow: ${d6DoneAt}ms`);
pending=[];clock=0;let d100DoneAt=null;
sandbox.animateRpgDice("d100",1,[73],51,100,()=>{d100DoneAt=clock});
runUntil(()=>d100DoneAt!==null);
assert.ok(d100DoneAt<=500,`D100 callback too slow: ${d100DoneAt}ms`);
console.log("V16.78.102.6 combat render-chain regression OK",{d6DoneAt,d100DoneAt,equipmentCalls,attributeCalls,canonicalCalls,enemyCalls,baseAttrRenders,canonAttrRenders,baseHeroRenders,canonHeroRenders,detectPaint,detectResolve,metrics:sandbox.GensMobileCombatPerformance16781022.metrics()});
