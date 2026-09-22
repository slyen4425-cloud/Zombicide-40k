const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const perf=fs.readFileSync(path.join(root,"assets","gensrpg","gens-mobile-combat-performance-16781022.js"),"utf8");
const tacticalDice=fs.readFileSync(path.join(root,"assets","gensrpg","gens-rpg-tactical-visual-dice-16781142.js"),"utf8");
const tacticalWallDice=fs.readFileSync(path.join(root,"assets","gensrpg","gens-rpg-tactical-wall-dice-stats-16781145.js"),"utf8");

const coreDice=path.join(root,"assets","gensrpg","core","dice-v1.js");
assert.equal(fs.existsSync(coreDice),true,
  "post-preaudit invariant: pure Core Dice contract must now exist");
const coreDiceSrc=fs.readFileSync(coreDice,"utf8");
assert.match(coreDiceSrc,/GensDiceV1/,
  "pure Core Dice contract API must remain present");
assert.equal(index.includes("assets/gensrpg/core/dice-v1.js"),false,
  "Core Dice contract must remain inert until a dedicated raccord lot");

assert.match(index,/function d100ThresholdFromChance\(chance\)\{[\s\S]*?101-c/,
  "index must still own the shared D100 threshold helper");
assert.match(index,/function dungeonUniversalTest\(statValue,opt=\{\}\)\{[\s\S]*?Math\.random\(\)\*sides[\s\S]*?success:total>=difficulty/,
  "RPG universal test must remain a configurable-sided roll + stat/modifier vs difficulty");
assert.match(index,/function dungeonInitiativeScore\(statValue\)[\s\S]*?Math\.random\(\)\*d/,
  "RPG initiative die path must remain inline during pre-audit");
assert.match(index,/function showSpecialD6Roll\([\s\S]*?Math\.random\(\)\*6[\s\S]*?success=roll>=threshold/,
  "Survival/special D6 rule must remain success-on-threshold-or-higher");
assert.match(index,/window\.rollDungeonRpDice073=function\(\)[\s\S]*?d100ThresholdFromChance\(chance\)[\s\S]*?Math\.random\(\)\*100/,
  "free RPG weapon roll must still consume the D100 threshold helper");
assert.match(index,/window\.rollDungeonRpDice073=function\(\)[\s\S]*?dungeonUniversalTest\(val,\{difficulty\}\)/,
  "free RPG stat roll must still delegate to dungeonUniversalTest");
assert.match(index,/function d10048\(chance\)\{[\s\S]*?Math\.max\(5,Math\.min\(95[\s\S]*?roll>=threshold/,
  "legacy Dungeon D100 helper must remain characterized with its 5..95 clamp");
assert.match(index,/window\.dc051RollStatChallenge=function\([\s\S]*?Math\.max\(5,Math\.min\(95[\s\S]*?roll>=threshold/,
  "Dungeon stat challenge must remain characterized as its own D100 consumer");
assert.match(index,/window\.dc201PuzzleRoll=function\(\)[\s\S]*?roll<=chance/,
  "Puzzle D100 path must remain characterized as success-on-roll<=chance");
assert.match(index,/window\.dc211TrapTest=function\(\)[\s\S]*?roll<=chance/,
  "Trap detection D100 path must remain characterized as success-on-roll<=chance");

assert.match(perf,/const nativeAnimateDice=typeof R\.animateDice==="function"\?R\.animateDice:null/);
assert.match(perf,/const nativeAnimateRpgDice=typeof R\.animateRpgDice==="function"\?R\.animateRpgDice:null/);
assert.match(perf,/R\.animateDice=animateDiceDispatch;R\.animateRpgDice=animateRpgDiceDispatch/,
  "mobile performance module must remain an animation dispatcher, not a rule owner");
assert.doesNotMatch(perf,/d100ThresholdFromChance|dungeonUniversalTest|rollDungeonRpDice073/,
  "mobile performance module must not own dice rules");

assert.match(tacticalDice,/function thresholdForChance\(hitChance,high=true\)[\s\S]*?clamp\(Math\.round\(num\(hitChance,50\)\),1,99\)/,
  "Tactical V114.11 must remain a distinct D100 rules owner with its 1..99 display clamp");
assert.match(tacticalDice,/function nextRandom\(state\)\{if\(!state\?\.rngSeed\)return Math\.random\(\)/,
  "Tactical V114.11 must retain its seeded-RNG-aware random source");
assert.match(tacticalDice,/function patchHitResolver\([\s\S]*?E\.resolveAttack=resolve/,
  "Tactical visual dice module must remain characterized as a resolveAttack owner, not only UI");
assert.match(tacticalDice,/const ok=displayHit\(shown,calculation\.finalChance,high\)/,
  "Tactical attack resolution must still use its local D100 hit convention");
assert.match(tacticalDice,/critRoll=Math\.floor\(nextRandom\(state\)\*100\)\+1;if\(critRoll<=critChance\)/,
  "Tactical critical roll must remain a local D100 consumer during pre-audit");

assert.match(tacticalWallDice,/function diceFinalValue\(card\)/);
assert.match(tacticalWallDice,/die\.textContent=String\(1\+Math\.floor\(Math\.random\(\)\*100\)\)/,
  "wall/dice patch may randomize animation frames only");
assert.match(tacticalWallDice,/const finish=\(\)=>\{[\s\S]*?die\.textContent=String\(finalValue\)/,
  "wall/dice patch must settle on an externally supplied final result");
assert.doesNotMatch(tacticalWallDice,/E\.resolveAttack=|function thresholdForChance\(/,
  "wall/dice patch must not own Tactical hit rules");

const gameplayRandoms=(index.match(/Math\.random\(\)/g)||[]).length;
assert.ok(gameplayRandoms>50,
  "Math.random is broadly used for non-dice RNG too; Core Dice must not absorb all randomness");

console.log(JSON.stringify({
  scenario:"Phase 4 Dice preaudit",
  coreDiceExists:true,
  runtimeRaccord:false,
  gameplayRandoms,
  owners:{
    sharedThreshold:"index:d100ThresholdFromChance",
    universalTest:"index:dungeonUniversalTest",
    specialD6:"index:showSpecialD6Roll",
    freeRpgDice:"index:rollDungeonRpDice073",
    legacyDungeonD100:"index:d10048/dc051RollStatChallenge",
    puzzleTrapD100:"index:dc201PuzzleRoll/dc211TrapTest",
    legacyAnimationDecorator:"gens-mobile-combat-performance-16781022.js",
    tacticalRuleOwner:"gens-rpg-tactical-visual-dice-16781142.js",
    tacticalAnimationDecorator:"gens-rpg-tactical-wall-dice-stats-16781145.js"
  },
  finding:"dice rules are fragmented across inline gameplay and Tactical; animation decorators are separate; generic RNG must remain out of scope"
},null,2));
