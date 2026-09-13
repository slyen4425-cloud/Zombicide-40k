const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));

assert.match(ui,/APP_VERSION="16\.78\.107"/,'tactical UI version must be V16.78.107');
assert.match(ui,/data-target=/,'enemy list must expose explicit touch targets');
assert.match(ui,/data-approach/,'out-of-range targets must expose an approach action');
assert.match(ui,/data-attack=/,'weapon actions must be rendered as real buttons');
assert.match(ui,/E\(\)\.resolveAttack\(battle,cur\.id,target\.id,id\)/,'attack button must resolve through the isolated tactical engine');
assert.match(ui,/gtv2DiceBackdrop/,'combat must show a D100 roll overlay');
assert.match(ui,/D100/,'D100 feedback must be visible');
assert.doesNotMatch(ui,/setInterval\s*\(/,'tactical dice feedback must not use interval loops');
assert.match(ui,/dng_floor_stone_01\.png/,'battlefield must render a Dungeon floor texture');
assert.match(ui,/dng_wall_block\.jpg/,'blocked cells must use the Dungeon wall texture');
assert.match(ui,/a\.meta\?\.art/,'actor art must be rendered when available');
assert.match(ui,/runAiUntilHero/,'enemy turns must remain integrated');
assert.match(sw,/gensrpg-cache-16\.78\.107-tactical-actions-dice-terrain/,'service worker must force the V107 UI cache');

// Pure-engine smoke test for the exact player action used by the V107 buttons.
const battle=E.createBattle({
  grid:{width:6,height:4,blocked:[]},
  actors:[
    {id:'hero',name:'Hero',side:'hero',x:1,y:1,hp:10,maxHp:10,movement:3,initiative:20,attacks:[{id:'blade',name:'Lame',minRange:0,maxRange:1,hit:80,power:4,lineOfSight:false}]},
    {id:'enemy:1',name:'Enemy',side:'enemy',x:2,y:1,hp:8,maxHp:8,movement:2,initiative:5,attacks:[{id:'claw',name:'Griffe',maxRange:1,hit:60,power:2,lineOfSight:false}]}
  ],
  rngSeed:123
});
assert.equal(E.currentActor(battle).id,'hero');
const preview=E.attackPreview(battle,'hero','enemy:1','blade');
assert.equal(preview.ok,true,'selected adjacent target must enable the attack');
const hit=E.resolveAttack(battle,'hero','enemy:1','blade',20);
assert.equal(hit.ok,true);assert.equal(hit.hit,true);assert.equal(hit.roll,20);assert.equal(hit.damage,4);assert.equal(E.actorById(battle,'enemy:1').hp,4);

console.log('V16.78.107 tactical UI actions + dice + terrain guard OK');
