const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const U=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'));
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));

assert.equal(U.APP_VERSION,'16.78.107.1');
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

// High-roll is the new default reading without changing probability.
assert.equal(U.ruleTarget(75,true),26);
assert.equal(U.hitByRule(80,75,true),true);
assert.equal(U.hitByRule(20,75,true),false);
assert.equal(U.engineRoll(80,true),21,'80 high-roll must translate to 21 for the unchanged low-roll engine');
// Low-roll remains configurable.
assert.equal(U.ruleTarget(75,false),75);
assert.equal(U.hitByRule(20,75,false),true);
assert.equal(U.hitByRule(80,75,false),false);
assert.match(ui,/rpgStatsList/,'D100 rule must be injected into the general RPG/Dungeon rules editor');
assert.match(ui,/rollHighToHit/,'D100 reading must persist as a Dungeon combat rule');

assert.match(ui,/dng_floor_stone_01\.png/,'battlefield must render a Dungeon floor texture');
assert.match(ui,/dungeon_wall\.png/,'walls must use the corrected wall texture');
assert.doesNotMatch(ui,/dng_wall_block\.jpg/,'white/legacy wall block asset must not be used by tactical UI');
assert.match(ui,/patchDungeonMapHtml/,'random Dungeon map renderer must be patched too');
assert.match(ui,/#dc047RoomBoard \.dc047Grid > \.dc047Cell/,'live random Dungeon board walls must be repainted');

// Pure engine remains isolated and the translated high-roll keeps identical hit probability semantics.
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

assert.match(sw,/gensrpg-cache-16\.78\.107-tactical-actions-dice-terrain|gensrpg-cache-16\.78\.107\.1-tactical-readability-roll-walls/);
console.log('V16.78.107.1 tactical readability + persistent dice + roll rule + walls OK');
