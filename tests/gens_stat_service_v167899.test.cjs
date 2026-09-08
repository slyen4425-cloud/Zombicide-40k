const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-stat-service-167899.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'shared stat service must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.99"/);
assert.match(src,/s\.definitions=defs/,'definitions must have one canonical registry');
assert.match(src,/agility:"agilite"/);assert.match(src,/spirit:"esprit"/);
assert.match(src,/dungeonEquipmentBonus/,'equipment must feed the shared service');
assert.match(src,/dungeonSkillEffectTotal/,'talents must feed the shared service');
assert.match(src,/rpgStatSpent=Math\.max\(0,Number\(st\.rpgStatSpent\)/,'Dungeon spent points must remain numeric');
assert.doesNotMatch(src,/startDungeonCombat|enemyCells\s*=|dungeonRoom\s*=|DungeonAuthoredRuntime.*=/,'stat service must not own combat, rooms, spawn or authored runtime');

const profile={id:'demo',gameStyle:'dungeon',rpgUniverse:{stats:{
 active:['force','agility','spirit','chance'],
 customStats:[{id:'chance',name:'Chance',icon:'🍀',min:0,max:30,defaultValue:5,visible:true,editMode:'points',description:'Améliore les jets de fortune.',effects:[]}]
}}};
let profiles=[profile];
const hero={statPoints:2,rpgStatSpent:0,rpgAttributes:{chance:5},customStats:{chance:5}};
const sandbox={console,window:null,globalThis:null,document:null,current:'hero',state:hero,
 loadGameProfiles:()=>profiles,saveGameProfiles:x=>{profiles=x},getActiveGameProfile:()=>profiles[0],currentRpgProfile:()=>profiles[0],
 loadState:id=>id==='hero'?hero:null,save:()=>true,
 dungeonSyncProgressionForState:(id,s)=>{s.statPoints=Math.max(0,2-(Number(s.rpgStatSpent)||0))},
 dungeonActiveProgressionConfig:()=>({attributeEditMode:'points'}),
 dungeonEquipmentBonus:id=>id==='chance'?2:0,dungeonSkillEffectTotal:(kind,a,id)=>id==='chance'?1:0,dungeonChallengeDebuffTotal067:()=>-1,
 dungeonBaseAttributeFromDefinition:(id,stat)=>3,
 renderDungeonHeroStats:()=>true,renderDungeonAttributes:()=>true,dungeonAttributeValue:()=>0,changeDungeonAttribute:()=>false,
 renderRpgUniverseEditor:()=>true,saveRpgUniverseStats:()=>true,
 alert:()=>{},localStorage:{setItem(){},getItem(){return null}},CHARS:{hero:{dungeonStats:{initiative:2}}}
};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(src,sandbox);
const api=sandbox.GensStatService167899;
assert.ok(api,'shared service must export its API');
api.migrateAll();
const defs=api.definitions();
assert.equal(defs.filter(d=>d.id==='chance').length,1,'unknown authored stat must exist exactly once');
assert.equal(api.isActive('agility'),true);assert.equal(api.isActive('spirit'),true);
assert.equal(profile.rpgUniverse.stats.active.includes('agilite'),true);assert.equal(profile.rpgUniverse.stats.active.includes('esprit'),true);
assert.equal(profile.rpgUniverse.stats.definitions.some(d=>d.id==='chance'),true);
assert.equal(api.effectiveValue('hero','chance'),7,'5 base +2 equipment +1 talent -1 temporary = 7');
assert.equal(api.bonusFields().some(f=>f.key==='chance'&&f.label==='Chance'),true,'equipment/set editors must receive newly created stat ids');
assert.equal(api.change('hero','chance',1),true,'unknown authored stat must accept Dungeon point spending');
assert.equal(hero.rpgAttributes.chance,6);assert.equal(hero.customStats.chance,6);
assert.equal(hero.rpgStatSpent,1);assert.equal(typeof hero.rpgStatSpent,'number');assert.equal(hero.statPoints,1);
assert.equal(api.change('hero','chance',-1),true,'authored stat point must be refundable');
assert.equal(hero.rpgAttributes.chance,5);assert.equal(hero.rpgStatSpent,0);assert.equal(hero.statPoints,2);
console.log('GenSrpG shared stat service V16.78.99: OK');
