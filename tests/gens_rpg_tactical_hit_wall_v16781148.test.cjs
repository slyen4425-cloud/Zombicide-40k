const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(V.APP_VERSION,'16.78.114.12');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.DICE_WATCHDOG_MS,0);
assert.equal(V.observeWalls(),false,'V114.12 must not create a global wall/body observer');

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
assert.doesNotMatch(visual,/new\s+rt\.MutationObserver|observer\.observe\s*\(/,'V114.12 must not observe document.body');
assert.match(visual,/background-image:none!important/,'wall owner must have no CSS bitmap competitor');
assert.match(visual,/contain:none!important/,'wall owner must not force a paint containment layer during pinch zoom');
assert.match(visual,/isolation:auto!important/,'wall owner must not force an isolated compositor layer');
assert.match(visual,/restoreDungeonMapHtml/,'V114.12 must restore the native Dungeon map HTML renderer');
assert.match(visual,/__gtv271WallPatch&&typeof cur\.__original===\"function\"/,'old template-reserializing wall wrapper must be explicitly removed');
assert.match(visual,/__gensRpg11412WallPostRender/,'wall bitmap must be attached after the native renderer in the same task');
assert.match(visual,/__gensRpgStableWallBitmap11412/,'decoded wall bitmap must keep a persistent runtime reference');
assert.match(ui,/gtv2WallTile/,'base UI must still emit the stable wall bitmap directly for tactical cells');
assert.match(ui,/blocked\.has\(k\)\?wallTileHtml\(\)/,'tactical wall image must exist in initial render HTML');
assert.match(ui,/calculationSummary/,'calculation summary must be visible in tactical UI');
assert.match(ui,/Conversion de l’arme une seule fois, puis Défense, Esquive et Couvert une seule fois chacun/,'calculation UI must explain single application');
assert.match(ui,/getAnimations/,'dice result must await the one CSS animation without another overlay timer');
console.log('V16.78.114.12 preserves canonical D100 and uses native-render + image-only stable walls');
