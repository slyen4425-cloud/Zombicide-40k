const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','gens-stat-service-167899.js');
const src=fs.readFileSync(file,'utf8');
assert.doesNotThrow(()=>new Function(src),'shared stat service must be valid JS');
assert.match(src,/APP_VERSION="16\.78\.99"/);
assert.match(src,/function runtimeContext\(\)/,'service must have a Dungeon runtime gate');
assert.match(src,/function editorContext\(\)/,'service must have a Dungeon editor gate');
assert.match(src,/if\(!runtimeContext\(\)\)return nativeRenderHeroStats\.apply/,'hero renderer must delegate outside Dungeon');
assert.match(src,/s\.definitions=defs/,'definitions must have one canonical registry');
assert.match(src,/agility:"agilite"/);assert.match(src,/spirit:"esprit"/);
assert.match(src,/dungeonEquipmentBonus/,'equipment must feed the shared service');
assert.match(src,/dungeonSkillEffectTotal/,'talents must feed the shared service');
assert.match(src,/rpgStatSpent=Math\.max\(0,Number\(st\.rpgStatSpent\)/,'Dungeon spent points must remain numeric');
assert.doesNotMatch(src,/startDungeonCombat|enemyCells\s*=|dungeonRoom\s*=|DungeonAuthoredRuntime.*=/,'stat service must not own combat, rooms, spawn or authored runtime');

const dungeonProfile={id:'demo',gameStyle:'dungeon',rpgUniverse:{stats:{
 active:['force','agility','spirit','chance'],
 customStats:[{id:'chance',name:'Chance',icon:'🍀',min:0,max:30,defaultValue:5,visible:true,editMode:'points',description:'Améliore les jets de fortune.',effects:[]}]
}}};
const captureProfile={id:'capture',gameStyle:'capture',captureUniverse:{enabled:true}};
let profiles=[dungeonProfile,captureProfile],activeIndex=0,dungeonMode=true;
const hero={statPoints:2,rpgStatSpent:0,rpgAttributes:{chance:5},customStats:{chance:5}};
let nativeHeroCalls=0,nativeAttributeCalls=0,nativeChangeCalls=0;
const sandbox={console,window:null,globalThis:null,document:null,current:'hero',state:hero,
 isDungeonMode:()=>dungeonMode,
 loadGameProfiles:()=>profiles,saveGameProfiles:x=>{profiles=x},getActiveGameProfile:()=>profiles[activeIndex],currentRpgProfile:()=>profiles[activeIndex],
 loadState:id=>id==='hero'?hero:null,save:()=>true,
 dungeonSyncProgressionForState:(id,s)=>{s.statPoints=Math.max(0,2-(Number(s.rpgStatSpent)||0))},
 dungeonActiveProgressionConfig:()=>({attributeEditMode:'points'}),
 dungeonEquipmentBonus:id=>id==='chance'?2:0,dungeonSkillEffectTotal:(kind,a,id)=>id==='chance'?1:0,dungeonChallengeDebuffTotal067:()=>-1,
 dungeonBaseAttributeFromDefinition:(id,stat)=>3,
 renderDungeonHeroStats:()=>{nativeHeroCalls++;return 'native-hero'},
 renderDungeonAttributes:()=>true,
 dungeonAttributeValue:()=>{nativeAttributeCalls++;return 1234},
 changeDungeonAttribute:()=>{nativeChangeCalls++;return 'native-change'},
 renderRpgUniverseEditor:()=>true,saveRpgUniverseStats:()=>true,
 alert:()=>{},localStorage:{setItem(){},getItem(){return null}},CHARS:{hero:{dungeonStats:{initiative:2}}}
};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext(src,sandbox);
const api=sandbox.GensStatService167899;
assert.ok(api,'shared service must export its API');
assert.equal(api.runtimeContext(),true,'Dungeon profile + Dungeon runtime must enable the stat service');
api.migrateAll();
const defs=api.definitions();
assert.equal(defs.filter(d=>d.id==='chance').length,1,'unknown authored stat must exist exactly once');
assert.equal(api.isActive('agility'),true);assert.equal(api.isActive('spirit'),true);
assert.equal(dungeonProfile.rpgUniverse.stats.active.includes('agilite'),true);assert.equal(dungeonProfile.rpgUniverse.stats.active.includes('esprit'),true);
assert.equal(dungeonProfile.rpgUniverse.stats.definitions.some(d=>d.id==='chance'),true);
assert.equal(api.effectiveValue('hero','chance'),7,'5 base +2 equipment +1 talent -1 temporary = 7');
assert.equal(api.bonusFields().some(f=>f.key==='chance'&&f.label==='Chance'),true,'equipment/set editors must receive newly created stat ids');
assert.equal(api.change('hero','chance',1),true,'unknown authored stat must accept Dungeon point spending');
assert.equal(hero.rpgAttributes.chance,6);assert.equal(hero.customStats.chance,6);
assert.equal(hero.rpgStatSpent,1);assert.equal(typeof hero.rpgStatSpent,'number');assert.equal(hero.statPoints,1);
assert.equal(api.change('hero','chance',-1),true,'authored stat point must be refundable');
assert.equal(hero.rpgAttributes.chance,5);assert.equal(hero.rpgStatSpent,0);assert.equal(hero.statPoints,2);

// Critical isolation regression: Capture/home must keep their original behavior.
dungeonMode=false;activeIndex=1;
assert.equal(api.runtimeContext(),false,'Capture must never be treated as Dungeon runtime');
assert.equal(api.contextAllowed(),false,'Capture must not activate the RPG stat service');
assert.deepEqual(Array.from(api.definitions()),[],'Capture must receive no Dungeon stat registry');
assert.equal(api.effectiveValue('hero','chance'),0,'Capture must not calculate Dungeon stat values');
assert.equal(api.change('hero','chance',1),false,'Capture must not mutate Dungeon hero stats');
const beforeHero=nativeHeroCalls;
assert.equal(sandbox.renderDungeonHeroStats(),'native-hero','wrapped hero renderer must delegate to native outside Dungeon');
assert.equal(nativeHeroCalls,beforeHero+1);
const beforeAttr=nativeAttributeCalls;
assert.equal(sandbox.dungeonAttributeValue('chance'),1234,'attribute lookup must delegate to native outside Dungeon');
assert.equal(nativeAttributeCalls,beforeAttr+1);
const beforeChange=nativeChangeCalls;
assert.equal(sandbox.changeDungeonAttribute('chance',1),'native-change','attribute mutation must delegate to native outside Dungeon');
assert.equal(nativeChangeCalls,beforeChange+1);
assert.equal(hero.rpgAttributes.chance,5,'Capture delegation must leave Dungeon stat state untouched');
console.log('GenSrpG shared stat service V16.78.99 + mode isolation: OK');