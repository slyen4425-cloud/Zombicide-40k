const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-custom-stat-runtime-profile-167889.js'),'utf8');
const patcher=fs.readFileSync(path.join(root,'tools','patch_generic_stat_grid_v167890.py'),'utf8');

let dungeon=true,profile={id:'dungeon',gameStyle:'dungeon',rpgUniverse:{stats:{customStats:[{id:'chance',name:'Chance',icon:'🍀',kind:'score',min:0,max:99,defaultValue:4,visible:true,editMode:'points',description:'Influence les événements chanceux.'}],active:['chance']}}};
let profiles=[profile],states={hero:{statPoints:3,rpgStatSpent:0,rpgAttributes:{force:10},temporaryChallengeDebuffs:[{stat:'chance',value:-1,remaining:2}]}};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>{store.set(k,String(v));const id=String(k).replace('state_','');states[id]=JSON.parse(v)},removeItem:k=>store.delete(k)};
const ctx={console,Math,Date,localStorage,current:'hero',CHARS:{hero:{dungeonStats:{initiative:7}}},
 isDungeonMode:()=>dungeon,activeGameProfileId:()=>dungeon?'dungeon':'base',getActiveGameProfile:()=>profile,currentRpgProfile:()=>profile,
 loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=a;profile=a.find(x=>x.id==='dungeon')||profile},loadState:id=>JSON.parse(JSON.stringify(states[id]||{})),key:id=>'state_'+id,
 dungeonEquipmentBonus:id=>id==='chance'?2:0,dungeonSkillEffectTotal:(kind,_x,id)=>kind==='attribute'&&id==='chance'?1:0,dungeonChallengeDebuffTotal067:(id)=>id==='chance'?-1:0,
 dungeonAttributeValue:id=>id==='force'?99:0,changeDungeonAttribute:()=>true,renderDungeonAttributes:()=>true,renderDungeonHeroStats:()=>true,renderRpgUniverseEditor:()=>true
};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-custom-stat-runtime-profile-167889.js'});
const api=ctx.GensRpgStatService167901;assert.ok(api,'single stat service missing');api.install();
assert.equal(api.APP_VERSION,'16.79.01');
assert.ok(api.definition('chance'),'unknown authored stat missing from registry');
assert.ok(api.definition('force'),'core stat not seeded into same registry');
assert.equal(api.value('hero','chance'),6,'Chance must be base 4 + equipment 2 + talent 1 - malus 1');
assert.equal(ctx.dungeonAttributeValue('chance'),6,'Dungeon attribute lookup must use the dynamic service');
assert.equal(api.change('chance',1),true);assert.equal(states.hero.rpgAttributes.chance,5);assert.equal(states.hero.statPoints,2);assert.equal(states.hero.rpgStatSpent,1);assert.equal(states.hero.rpgStatSpentById.chance,1);
assert.equal(api.change('chance',-1),true);assert.equal(states.hero.rpgAttributes.chance,4);assert.equal(states.hero.statPoints,3);assert.equal(states.hero.rpgStatSpent,0);assert.equal(states.hero.rpgStatSpentById.chance,0);
// Alias migration uses one identity.
states.hero.rpgAttributes.agility=13;delete states.hero.rpgAttributes.agilite;const migrated=api.migrateState('hero',states.hero);assert.equal(migrated.rpgAttributes.agilite,13);
// Outside Dungeon the service must not take over global Dungeon lookups.
dungeon=false;assert.equal(ctx.dungeonAttributeValue('chance'),0,'outside Dungeon the original function must be used');assert.equal(api.change('chance',1),false,'outside Dungeon points must not change');
// Build-time patcher must no longer inject a second stat renderer.
assert.doesNotMatch(patcher,/WRAPPER\s*=\s*r?[\"']/,'patcher must not define an injected stat WRAPPER');
assert.doesNotMatch(patcher,/RENAMES\s*=\s*\{/,'patcher must not rename native stat renderers');
assert.match(patcher,/gensStatBuildNoRendererV167901/);
assert.match(patcher,/MUST NOT create, rename or wrap any stat/);
console.log('GenSrpG RPG stat service V16.79.01: dynamic unknown stat + point/equipment/talent isolation OK');
