const assert=require('node:assert/strict');
const path=require('node:path');

const root=path.join(__dirname,'..');
const Assets=require(path.join(root,'assets','gensrpg','core','asset-resolver.js'));
const Adapter=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-adapter.js'));

assert.equal(Adapter.VERSION,'0.5.0');
assert.equal(Assets.VERSION,'1.1.0');

function runtime({hero={},enemy={}}={}){
  const enemyDef={id:'dng_necromancer',name:'Nécromancien',rule:{hp:4,range:1,damage:1},...enemy};
  return {
    GensRpgCoreAssets:Assets,
    CHARS:{dungeon_aldren:{id:'dungeon_aldren',name:'Aldren',...hero}},
    loadState:()=>({wounds:0,inventory:[]}),
    dungeonParticipants:()=>['dungeon_aldren'],
    loadActiveEnemies:()=>[{id:'enemy_1',enemyId:'dng_necromancer',hp:4,maxHp:4}],
    activeEnemyDefinition:()=>enemyDef,
    dungeonCombatHeroSnapshot:()=>({hp:8,maxHp:8,force:10,movement:3,initiative:10,defense:0,armor:0,dodge:0}),
    dungeonEnemyDerivedForInstance:()=>({initiative:1,defense:0,armor:0,dodge:0,movement:1}),
    dungeonEnemyAttackSkills:()=>[null],
    dungeonEnemyAttackProfile:()=>({mode:'melee',range:1,chance:70,power:1}),
  };
}

let rt=runtime();
let input=Adapter.buildInput(rt,{rngSeed:1});
let hero=input.actors.find(x=>x.side==='hero');
let enemy=input.actors.find(x=>x.side==='enemy');
assert.equal(hero.meta.art,'assets/dungeon/creatures/dng_aldren.png','built-in Dungeon hero art must come from Core Assets');
assert.equal(enemy.meta.art,'assets/dungeon/creatures/dng_necromancer.png','Dungeon creature convention must come from Core Assets');

rt=runtime({hero:{image_data:'custom/heroes/aldren-custom.png'},enemy:{image_data:'custom/enemies/necro-custom.png'}});
input=Adapter.buildInput(rt,{rngSeed:2});
hero=input.actors.find(x=>x.side==='hero');
enemy=input.actors.find(x=>x.side==='enemy');
assert.equal(hero.meta.art,'custom/heroes/aldren-custom.png','explicit hero art must remain editable and transparent');
assert.equal(enemy.meta.art,'custom/enemies/necro-custom.png','explicit enemy art must remain editable and transparent');

rt=runtime({enemy:{art:'javascript:alert(1)'}});
input=Adapter.buildInput(rt,{rngSeed:3});
enemy=input.actors.find(x=>x.side==='enemy');
assert.equal(enemy.meta.art,'assets/dungeon/creatures/dng_necromancer.png','unsafe entity art must not bypass Core Assets validation');

const seen=[];
rt=runtime({hero:{image:'legacy-hero.png'},enemy:{art:'legacy-enemy.png'}});
rt.GensRpgCoreAssets={
  resolveEntityPath(request){
    seen.push(request);
    return request.kind==='hero'?'core-authority/hero.png':'core-authority/enemy.png';
  }
};
input=Adapter.buildInput(rt,{rngSeed:4});
hero=input.actors.find(x=>x.side==='hero');
enemy=input.actors.find(x=>x.side==='enemy');
assert.equal(hero.meta.art,'core-authority/hero.png','Core Assets must override the adapter legacy image chain when present');
assert.equal(enemy.meta.art,'core-authority/enemy.png','Core Assets must override the adapter legacy enemy art chain when present');
assert.equal(seen.length,2);
assert.deepEqual(seen.map(x=>[x.module,x.kind,x.id]),[
  ['dungeon','hero','dungeon_aldren'],
  ['dungeon','creature','dng_necromancer'],
]);

rt=runtime({hero:{image:'legacy-isolated.png'},enemy:{art:'legacy-enemy-isolated.png'}});
delete rt.GensRpgCoreAssets;
assert.equal(Adapter.resolveActorArt(rt,'hero','custom_hero',rt.CHARS.dungeon_aldren),'legacy-isolated.png','isolated unit loading keeps a narrow non-browser fallback');
assert.equal(Adapter.resolveActorArt(rt,'creature','custom_enemy',{art:'legacy-enemy-isolated.png'}),'legacy-enemy-isolated.png');

console.log('GenSrpG Core Assets -> Tactical actor runtime contract OK');
