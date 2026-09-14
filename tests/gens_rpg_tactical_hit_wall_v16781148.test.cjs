const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(V.APP_VERSION,'16.78.114.9');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.DICE_WATCHDOG_MS,0);
assert.equal(V.observeWalls(),false,'V114.9 must not create a global wall/body observer');
assert.equal(V.patchRenderHooks(),false,'V114.9 must not stack another tactical render wrapper');

const chance=36,threshold=65;
assert.equal(V.thresholdForChance(chance,true),threshold);
for(const roll of [65,66,80,92,95,100])assert.equal(V.displayHit(roll,chance,true),true,`${roll} must hit D100 >= ${threshold}`);
for(const roll of [1,20,50,64])assert.equal(V.displayHit(roll,chance,true),false,`${roll} must miss D100 >= ${threshold}`);

const calc=V.hitCalculation({hitChance:36,los:{cover:0},cellCover:20},{defense:20,dodge:16},{hit:92},true);
assert.deepEqual(calc,{baseHit:92,defensePenalty:20,dodgePenalty:16,lineCoverPenalty:0,cellCoverPenalty:20,rawChance:36,listedChance:36,otherModifier:0,finalChance:36,high:true,threshold:65,clampMin:5,clampMax:95});

const rt={GensRpgTacticalCombatV2:E};
V.patchHitResolver(rt);
function make(){const s=E.createBattle({grid:{width:5,height:4},actors:[
  {id:'h',side:'hero',x:1,y:1,hp:20,initiative:20,attacks:[{id:'a',range:1,hit:92,power:3}]},
  {id:'e',side:'enemy',x:2,y:1,hp:20,initiative:1,defense:20,dodge:16,attacks:[{id:'x',range:1,hit:70,power:1}]}
]});s.config.rollHighToHit=true;return s}
for(const displayRoll of [65,80,92,95,100]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);assert.equal(r.hitChance,56);assert.equal(r.hitTarget,45);assert.equal(r.hit,true);
  assert.equal(r.hitCalculation.baseHit,92);assert.equal(r.hitCalculation.defensePenalty,20);assert.equal(r.hitCalculation.dodgePenalty,16);
}
for(const displayRoll of [1,20,44]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);assert.equal(r.hit,false);
}

const visual=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
assert.doesNotMatch(visual,/new\s+rt\.MutationObserver|observer\.observe\s*\(/,'final authority must not observe document.body');
assert.doesNotMatch(visual,/U\.render\s*=|core\[name\]\s*=/,'final authority must not wrap renderers');
assert.match(ui,/gtv2WallTile/,'base UI must emit the stable wall bitmap directly');
assert.match(ui,/blocked\.has\(k\)\?wallTileHtml\(\)/,'tactical wall image must exist in initial render HTML');
assert.match(ui,/insertAdjacentHTML\("afterbegin",wallTileHtml\(\)\)/,'Dungeon wall image must exist before live DOM insertion');
assert.match(ui,/calculationSummary/,'calculation summary must be visible in tactical UI');
assert.match(ui,/Défense, Esquive et Couvert sont retirés une seule fois/,'calculation UI must explain single application');
assert.match(ui,/getAnimations/,'dice result must await the one CSS animation without another overlay timer');
console.log('V16.78.114.9 observer-free engagement + single-render walls + audited visible D100 OK');
