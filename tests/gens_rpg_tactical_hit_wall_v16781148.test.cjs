const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(V.APP_VERSION,'16.78.114.8');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');

const chance=36,threshold=65;
assert.equal(V.thresholdForChance(chance,true),threshold);
for(const roll of [65,66,80,92,95,100])assert.equal(V.displayHit(roll,chance,true),true,`${roll} must hit D100 >= ${threshold}`);
for(const roll of [1,20,50,64])assert.equal(V.displayHit(roll,chance,true),false,`${roll} must miss D100 >= ${threshold}`);

const rt={GensRpgTacticalCombatV2:E};
V.patchHitResolver(rt);
function make(){const s=E.createBattle({grid:{width:5,height:4},actors:[
  {id:'h',side:'hero',x:1,y:1,hp:20,initiative:20,attacks:[{id:'a',range:1,hit:36,power:3}]},
  {id:'e',side:'enemy',x:2,y:1,hp:20,initiative:1,defense:0,dodge:0,attacks:[{id:'x',range:1,hit:70,power:1}]}
]});s.config.rollHighToHit=true;return s}
for(const displayRoll of [65,80,92,95,100]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);
  assert.equal(r.hitTarget,65);
  assert.equal(r.hit,true,`visible ${displayRoll} must resolve as a hit`);
}
for(const displayRoll of [1,20,50,64]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);
  assert.equal(r.hit,false,`visible ${displayRoll} must resolve as a miss`);
}

assert.ok(V.stabilizeWalls,'stable wall IMG installer missing');
assert.ok(V.patchDungeonMapHtml,'pre-DOM Dungeon wall patch missing');
console.log('V16.78.114.8 visible touch rule + stable wall layer focused regression OK');