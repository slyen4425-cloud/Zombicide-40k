'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const identity=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const profileKey='gensrpg_game_profiles_v1',activeKey='gensrpg_game_profile_active_v1';
const baseId='game_profile_zombicide_base',dungeonId='game_profile_dungeon_demo';
function exactFunction(name){
 const marker='function '+name+'(',start=source.indexOf(marker);
 assert.ok(start>=0,'real owner '+name);const open=source.indexOf('{',start);
 let depth=0,quote=null,escaped=false,line=false,comment=false;
 for(let i=open;i<source.length;i++){
  const c=source[i],n=source[i+1]||'';
  if(line){if(c==='\n')line=false;continue}
  if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
  if(quote){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c===quote)quote=null;continue}
  if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){comment=true;i++;continue}
  if(c==="'"||c==='"'||c==='\x60'){quote=c;continue}
  if(c==='{')depth++;if(c==='}'&&--depth===0)return source.slice(start,i+1);
 }assert.fail('unterminated '+name);
}
const owners=['loadGameProfilesRaw','saveGameProfiles','loadGameProfiles','activeGameProfileId','setActiveGameProfileId','getActiveGameProfile',
 'gensReferenceSurvivalSettings','gensBlankSurvivalSettings','ensureSurvivalProfileData','gensContentFamilyForProfile','survivalProfiles',
 'gensFamilyForProfile','gensFamilyForProfileId','activeSurvivalModId','activeSurvivalMod','setActiveSurvivalMod','openSurvivalModEditor',
 'currentSmodProfile','currentSmod','selectSurvivalModProfile','checkedSmodPool','readSmodLevels','saveSurvivalModPools',
 'addSurvivalThreatLevel','removeSurvivalThreatLevel','saveSurvivalModIdentity','saveSurvivalModProgression','saveSurvivalModRules',
 'saveSurvivalModWaveRules','duplicateSurvivalModProfile','deleteSurvivalModProfile'];
const gameplay=(profile,modules={})=>({rpgUniverse:{gameplay:{profile,modules}}});
const cases=[
 {id:baseId,gameStyle:'zombicide',builtIn:true,expected:'survival'},
 {id:'survival-custom',gameStyle:'zombicide',expected:'survival'},
 {id:'survival-neutral',expected:'survival'},
 {id:dungeonId,gameStyle:'dungeon',...gameplay('classic'),expected:'rpg'},
 {id:'manga',gameStyle:'dungeon',...gameplay('manga'),expected:'manga'},
 {id:'capture-new',...gameplay('creature'),expected:'creature'},
 {id:'capture-historical',gameStyle:'dungeon',...gameplay('creature'),expected:'creature'},
 {id:'capture-modules',...gameplay('custom',{capture:true,controllableCreatures:true}),expected:'creature'},
 {id:'capture-survival-style',gameStyle:'survival',...gameplay('creature'),expected:'creature'},
 {id:'capture-disabled-modules',...gameplay('creature',{capture:false,controllableCreatures:false}),expected:'creature'},
 {id:'partial-capture',...gameplay('custom',{capture:true,controllableCreatures:false}),expected:'survival'},
 {id:'string-modules',...gameplay('custom',{capture:'true',controllableCreatures:'true'}),expected:'survival'},
 {id:'numeric-modules',...gameplay('custom',{capture:1,controllableCreatures:1}),expected:'survival'},
 {id:'partial-controllable',...gameplay('custom',{capture:false,controllableCreatures:true}),expected:'survival'},
 {id:'capture-clean',...gameplay('creature'),withoutSurvival:true,expected:'creature'},
 {id:'capture-historical-clean',gameStyle:'dungeon',...gameplay('creature'),withoutSurvival:true,expected:'creature'},
 {id:'dungeon-custom',gameStyle:'dungeon',...gameplay('custom'),expected:'rpg'}
];
const seed=cases.map(({expected,withoutSurvival,...p})=>{
 const data={...p,name:p.id,desc:'retained',heroPool:['retained-hero'],objectPool:['retained-object'],enemyConfig:{retainedEnemy:2},enemyReserve:{retainedEnemy:4},
  survival:{icon:'S',themeColor:'#111111',xpCap:100,baseActions:3,levels:[
   {id:'one',name:'one',xp:0,waveMultiplier:1.2,doubleWaveChance:5},
   {id:'two',name:'two',xp:10,waveMultiplier:1.4,doubleWaveChance:10}],rules:{baseHp:3}}};
 if(withoutSurvival)delete data.survival;
 return data;
});
const fieldValues={smodName:'Survival Custom Saved',smodDesc:'Personalized rules',smodIcon:'X',smodThemeColor:'#224466',
 smodXpCap:'245',smodBaseActions:'6',smodSearchCost:'4',smodReloadCost:'3',smodEquipCost:'2',smodSearchLimit:'8',
 smodBaseHp:'7',smodFriendlyFire:'true',smodKeepGear:'false',smodKeepXp:'false',smodXpMultiplier:'2.4',
 smodLootMultiplier:'3.5',smodLootDraws:'5',smodWavePreset:'chosen-waves'};
const levelRows=[{'.smodLevelName':'Start','.smodLevelColor':'#112233','.smodLevelXp':'0','.smodLevelSkills':'2'},
 {'.smodLevelName':'Hard','.smodLevelColor':'#445566','.smodLevelXp':'70','.smodLevelSkills':'3'}]
 .map(values=>({querySelector:s=>({value:values[s]})}));
const waveRows=[{'.smodWaveMult':'1.8','.smodWaveDouble':'25'},{'.smodWaveMult':'2.7','.smodWaveDouble':'45'}]
 .map(values=>({querySelector:s=>({value:values[s]})}));
function domRows(selector){
 if(selector==='#smodLevels .smodLevelRow')return levelRows;
 if(selector==='#smodWaveRules .smodLevelRow')return waveRows;
 const pools={'#smodHeroPool input[type=checkbox]:checked':'chosen-hero',
  '#smodItemPool input[type=checkbox]:checked':'chosen-object','#smodEnemyPool input[type=checkbox]:checked':'chosen-enemy'};
 return pools[selector]?[{value:pools[selector]}]:[];
}
function setup(id){
 const values=new Map([[profileKey,JSON.stringify(seed)],[activeKey,id],['gensrpg_dungeon_runtime_v2','retained-dungeon-save'],['gensrpg_capture_battle_current_v1','retained-capture-save']]);
 const writes=[],effects=[],elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{value:fieldValues[id]??'4',style:{},querySelector:()=>null});return elements.get(id)};
 const context={console,document:{body:{style:{}},getElementById:el,querySelectorAll:domRows},
  localStorage:{getItem:k=>values.get(String(k))??null,setItem:(k,v)=>{values.set(String(k),String(v));writes.push(String(k))},removeItem:k=>{values.delete(String(k));writes.push(String(k))}},
  applyGameProfile:p=>{effects.push({port:'applyGameProfile',id:typeof p==='string'?p:p.id});return true},
  renderSurvivalModEditor:()=>effects.push({port:'renderSurvivalModEditor'}),renderGensFamilyGamesIfVisible:()=>effects.push({port:'renderGensFamilyGamesIfVisible'}),
  showSurvivalModTab:tab=>effects.push({port:'showSurvivalModTab',tab}),
  enemiesForMode:()=>[{id:'chosen-enemy',defaultCount:7}],gameProfileId:()=> 'new-copy',alert:x=>effects.push({port:'alert',message:x}),confirm:()=>true};
 context.window=context;vm.createContext(context);vm.runInContext(identity,context,{filename:'real-capture-entry.js'});
 vm.runInContext('const GAME_PROFILES_KEY='+JSON.stringify(profileKey)+';const GAME_PROFILE_ACTIVE_KEY='+JSON.stringify(activeKey)+';'+
  'const GAME_PROFILE_BASE_ID='+JSON.stringify(baseId)+';const GAME_PROFILE_DUNGEON_ID='+JSON.stringify(dungeonId)+';const ZOMBICIDE_BASE_PRESET_ID="baseline-waves";let smodEditingId=null;'+
  owners.map(exactFunction).join('\n'),context,{filename:'exact-native-survival-editor-owners.js'});
 return {context,values,writes,effects,snapshot:()=>JSON.stringify([...values.entries()]),get profiles(){return JSON.parse(values.get(profileKey))}};
}

const redProbe=setup('capture-new');
assert.equal(redProbe.context.activeSurvivalModId(),baseId,'Capture must not be selected by the Survival editor');

const writers=['saveSurvivalModPools','addSurvivalThreatLevel','removeSurvivalThreatLevel','saveSurvivalModIdentity',
 'saveSurvivalModProgression','saveSurvivalModRules','saveSurvivalModWaveRules','duplicateSurvivalModProfile','deleteSurvivalModProfile'];
let readCases=0,blockedWrites=0,positiveWrites=0;
for(const item of cases){
 const s=setup(item.id),c=s.context,before=s.snapshot();
 assert.equal(c.gensContentFamilyForProfile(item),item.expected,'canonical identity '+item.id);
 assert.equal(c.GensCaptureV1.isProfile(item),item.expected==='creature','public Capture identity '+item.id);
 const expectedId=item.expected==='survival'?item.id:baseId;
 assert.equal(c.activeSurvivalModId(),expectedId,'active editor id '+item.id);
 c.openSurvivalModEditor();
 assert.equal(c.currentSmodProfile()?.id,expectedId,'classified read '+item.id);
 assert.equal(c.currentSmod()?.id,expectedId,'classified normalized read '+item.id);
 assert.equal(s.snapshot(),before,'opening and reading must not persist '+item.id);
 assert.deepEqual(s.writes,[],'opening and reading writes '+item.id);
 const selection=setup(baseId);
 vm.runInContext('smodEditingId="survival-custom"',selection.context);
 const state=vm.runInContext('smodEditingId',selection.context);
 selection.context.setActiveSurvivalMod(item.id);
 assert.equal(selection.effects.some(e=>e.port==='applyGameProfile'),item.expected==='survival','setActive boundary '+item.id);
 selection.effects.length=0;
 selection.context.selectSurvivalModProfile(item.id);
 assert.equal(vm.runInContext('smodEditingId',selection.context),item.expected==='survival'?item.id:state,'selection must reject foreign id before state '+item.id);
 assert.equal(selection.effects.some(e=>e.port==='applyGameProfile'),item.expected==='survival','selected application boundary '+item.id);
 assert.equal(selection.writes.length,0,'selection port must not mutate profiles '+item.id);
 readCases++;
}

for(const item of cases.filter(x=>x.expected!=='survival')){
 for(const name of writers){
  const s=setup(item.id),before=s.snapshot();
  vm.runInContext('smodEditingId='+JSON.stringify(item.id),s.context);
  s.context[name](0);
  assert.equal(s.snapshot(),before,'foreign stale selection must not persist: '+item.id+' / '+name);
  assert.equal(s.writes.length,0,'foreign native writer storage calls: '+item.id+' / '+name);
  assert.equal(s.effects.some(e=>e.port==='applyGameProfile'),false,'foreign native writer must not apply fallback: '+item.id+' / '+name);
  blockedWrites++;
 }
}

for(const id of ['survival-custom','survival-neutral','partial-capture','partial-controllable','string-modules','numeric-modules']){
 for(const name of writers){
  const s=setup(id),before=s.profiles;
  vm.runInContext('smodEditingId='+JSON.stringify(id),s.context);
  s.context[name](0);
  assert.ok(s.writes.includes(profileKey),'valid Survival write must remain available: '+id+' / '+name);
  const after=s.profiles,p=after.find(x=>x.id===id);
  for(const foreign of before.filter(x=>s.context.gensContentFamilyForProfile(x)!=='survival'))
   assert.deepEqual(after.find(x=>x.id===foreign.id),foreign,'positive Survival edit must preserve foreign profile '+foreign.id);
  if(name==='saveSurvivalModIdentity'){
   assert.equal(p.name,fieldValues.smodName);assert.equal(p.desc,fieldValues.smodDesc);
   assert.equal(p.survival.icon,fieldValues.smodIcon);assert.equal(p.survival.themeColor,fieldValues.smodThemeColor);
  }
  if(name==='saveSurvivalModProgression'){
   assert.equal(p.survival.xpCap,245);assert.equal(p.survival.baseActions,6);
   assert.deepEqual(p.survival.levels.map(x=>x.xp),[0,70]);assert.deepEqual(p.survival.levels.map(x=>x.skillSlots),[2,3]);
   assert.deepEqual(p.survival.levels.map(x=>x.waveMultiplier),[1.2,1.4]);
  }
  if(name==='saveSurvivalModRules'){
   assert.deepEqual(p.survival.rules,{searchCost:4,reloadCost:3,equipCost:2,searchLimit:8,baseHp:7,friendlyFire:true,
    keepGear:false,keepXp:false,xpMultiplier:2.4,lootMultiplier:3.5,lootDraws:5});
  }
  if(name==='saveSurvivalModWaveRules'){
   assert.deepEqual(p.survival.levels.map(x=>x.waveMultiplier),[1.8,2.7]);
   assert.deepEqual(p.survival.levels.map(x=>x.doubleWaveChance),[25,45]);
  }
  if(name==='saveSurvivalModPools'){
   assert.deepEqual(p.heroPool,['chosen-hero']);assert.deepEqual(p.objectPool,['chosen-object']);
   assert.deepEqual(p.enemyConfig,{'chosen-enemy':7});assert.deepEqual(p.enemyReserve,{'chosen-enemy':7});
   assert.equal(p.wavePresetId,'chosen-waves');
  }
  if(name==='addSurvivalThreatLevel')assert.equal(p.survival.levels.length,3);
  if(name==='removeSurvivalThreatLevel')assert.deepEqual(p.survival.levels.map(x=>x.id),['two']);
  if(name==='duplicateSurvivalModProfile'){
   const copy=after.find(x=>x.id==='new-copy');
   assert.ok(copy);assert.equal(s.context.gensContentFamilyForProfile(copy),'survival');assert.equal(copy.builtIn,false);
   assert.deepEqual(copy.survival,p.survival);assert.equal(copy.name,p.name+' — copie');
  }
  if(name==='deleteSurvivalModProfile')assert.equal(p,undefined);
  assert.equal(s.values.get('gensrpg_dungeon_runtime_v2'),'retained-dungeon-save');
  assert.equal(s.values.get('gensrpg_capture_battle_current_v1'),'retained-capture-save');
  if(p){const loaded=s.context.loadGameProfiles().find(x=>x.id===id);assert.deepEqual(JSON.parse(JSON.stringify(loaded)),p,'real saved profile roundtrip '+name);}
  positiveWrites++;
 }
}

const unknown=setup(baseId);vm.runInContext('smodEditingId="missing-profile"',unknown.context);
for(const name of writers){
 const before=unknown.snapshot();unknown.context[name](0);
 assert.equal(unknown.snapshot(),before,'unknown selection must not persist '+name);
}
const malformed=setup('capture-new'),malformedProfiles=malformed.profiles;
const malformedBase=malformedProfiles.find(x=>x.id===baseId);
malformedBase.rpgUniverse={gameplay:{profile:'creature'}};
malformed.values.set(profileKey,JSON.stringify(malformedProfiles));
vm.runInContext('smodEditingId="capture-new"',malformed.context);
assert.equal(malformed.context.currentSmodProfile(),undefined,'foreign reference id must not bypass the fallback family guard');
for(const name of writers){const before=malformed.snapshot();malformed.context[name](0);assert.equal(malformed.snapshot(),before,'malformed fallback must not persist '+name);}

const defaults=setup(baseId),defaultProfiles=defaults.profiles;
delete defaultProfiles.find(x=>x.id===baseId).survival;
defaults.values.set(profileKey,JSON.stringify(defaultProfiles));
vm.runInContext('smodEditingId='+JSON.stringify(baseId),defaults.context);
const baseline=defaults.context.currentSmod();
assert.equal(baseline.xpCap,43);assert.equal(baseline.baseActions,3);assert.equal(baseline.rules.baseHp,3);
assert.equal(baseline.levels.length,4);assert.equal(defaults.writes.length,0,'default normalization is read-only');

console.log(JSON.stringify({scenario:'Phase 9 canonical Survival editor boundary',profiles:cases.length,realOwners:owners.length,
 readCases,blockedWrites,positiveWrites,identity:'gensContentFamilyForProfile -> GensCaptureV1.isProfile',
 ports:'DOM, render, alerts and profile application only; real loading/normalization/persistence',foreignProfileWrites:0}));
