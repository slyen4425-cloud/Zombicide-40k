const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const U=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'));
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));

assert.equal(U.APP_VERSION,'16.78.114.9');
assert.match(ui,/gtv271ActorCard/,'readable actor cards must be rendered below the grid');
assert.match(ui,/data-detail=/,'actor cards must open a detail view');
assert.match(ui,/statusRows/,'actor cards/detail must expose status and DoT slots');
assert.match(ui,/HERO_ART=\{/,'built-in hero art must be explicitly resolved');
assert.equal(U.actorArt({id:'dungeon_aldren',meta:{art:'assets/icons/dungeon.png'}}),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(U.actorDisplayName({id:'dungeon_aldren',name:'Dungeon'}),'Aldren');
assert.doesNotMatch(ui,/gtv2Pawn b/,'pawns must not contain text labels');
assert.doesNotMatch(ui,/<b>\$\{short\}/,'pawns must remain portrait-only');

assert.match(ui,/data-dice-continue/,'D100 result must require explicit confirmation');
assert.match(ui,/Tour d’initiative ennemi — ce n’est pas une riposte automatique/,'enemy action must be clearly identified');
assert.doesNotMatch(ui,/setTimeout\s*\(/,'tactical flow must not hide results through timeout timers');
assert.doesNotMatch(ui,/setInterval\s*\(/,'tactical flow must not use interval loops');
assert.match(ui,/getAnimations/,'D100 must await the single browser animation');
assert.match(ui,/animation\.finished/,'D100 must settle from the Web Animation completion promise');
assert.match(ui,/await showDiceResult\(cur,target,result,"Tour du héros"\);render\(\)/,'hero result must not render before the D100 animation');
assert.match(ui,/await showDiceResult\(ai,target,result,"Tour ennemi"\);render\(\)/,'enemy result must not render before the D100 animation');

// High-roll remains configurable without changing probability.
assert.equal(U.ruleTarget(75,true),26);
assert.equal(U.hitByRule(80,75,true),true);
assert.equal(U.hitByRule(20,75,true),false);
assert.equal(U.engineRoll(80,true),21,'80 high-roll must translate to 21 for the unchanged low-roll engine');
assert.equal(U.ruleTarget(75,false),75);
assert.equal(U.hitByRule(20,75,false),true);
assert.equal(U.hitByRule(80,75,false),false);
assert.match(ui,/rpgStatsList/,'D100 rule must be injected into the general RPG/Dungeon rules editor');
assert.match(ui,/rollHighToHit/,'D100 reading must persist as a Dungeon combat rule');

assert.match(ui,/dng_floor_stone_01\.png/,'battlefield must render a Dungeon floor texture');
assert.match(ui,/dng_wall_block\.jpg/,'walls must use the exact Dungeon Builder wall texture');
assert.doesNotMatch(ui,/dungeon_wall\.png/,'retired wall texture must not be used by tactical UI');
assert.match(ui,/patchDungeonMapHtml/,'random Dungeon map renderer must be patched before insertion');
assert.match(ui,/gtv2WallTile/,'wall IMG must be emitted directly by the base renderer');
assert.match(ui,/calculationSummary/,'real D100 chance and threshold must be understandable before rolling');
assert.match(ui,/gensTacticalWallPreload1147/,'wall texture must be preloaded before zoom/re-render');
assert.match(ui,/gtv2Cell\.blocked\.cover:after\{content:none!important;display:none!important\}/,'blocked wall cells must not show the useless cover icon');
assert.doesNotMatch(ui,/new\s+(?:R\.)?MutationObserver/,'base tactical UI must not repaint walls from a DOM observer');

const battle=E.createBattle({
  grid:{width:6,height:4,blocked:[]},
  actors:[
    {id:'hero',name:'Hero',side:'hero',x:1,y:1,hp:10,maxHp:10,movement:3,initiative:20,attacks:[{id:'blade',name:'Lame',minRange:0,maxRange:1,hit:80,power:4,lineOfSight:false}]},
    {id:'enemy:1',name:'Enemy',side:'enemy',x:2,y:1,hp:8,maxHp:8,movement:2,initiative:5,attacks:[{id:'claw',name:'Griffe',maxRange:1,hit:60,power:2,lineOfSight:false}]}
  ],
  rngSeed:123
});
const preview=E.attackPreview(battle,'hero','enemy:1','blade');
assert.equal(preview.ok,true);
const displayedRoll=90;
const hit=E.resolveAttack(battle,'hero','enemy:1','blade',U.engineRoll(displayedRoll,true));
assert.equal(hit.ok,true);assert.equal(hit.hit,true,'90 must hit in high-roll mode for an 80% chance');assert.equal(hit.damage,4);

assert.match(sw,/gensrpg-cache-16\.78\.114\.9-browser-profiled-combat/);
console.log('V16.78.114.9 tactical UI: direct wall IMG + audited event-driven D100 + no observer loop OK');
