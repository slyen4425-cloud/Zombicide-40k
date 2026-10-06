'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');

function exactFunction(name){
  const marker='function '+name+'(';
  const start=source.indexOf(marker);
  assert.ok(start>=0,'missing real owner '+name);
  const open=source.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,comment=false;
  for(let i=open;i<source.length;i++){
    const c=source[i],n=source[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
    if(quote){
      if(escaped){escaped=false;continue}
      if(c==='\\'){escaped=true;continue}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){comment=true;i++;continue}
    if(c==="'"||c==='"'||c==='`'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return source.slice(start,i+1);
  }
  assert.fail('unterminated real owner '+name);
}
function exactOneLineFunction(name){
  const start=source.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing real text helper '+name);
  return source.slice(start,source.indexOf('\n',start));
}

const baseId='game_profile_zombicide_base';
const dungeonId='game_profile_dungeon_demo';
const profileKey='gensrpg_game_profiles_v1';
const activeKey='gensrpg_game_profile_active_v1';
const gameplay=(profile,modules={})=>({rpgUniverse:{gameplay:{profile,modules}}});
const cases=[
  {id:baseId,gameStyle:'zombicide',expected:'survival'},
  {id:'survival-explicit',gameStyle:'survival',expected:'survival'},
  {id:'survival-neutral',expected:'survival'},
  {id:'survival-custom',gameStyle:'custom',...gameplay('custom'),expected:'survival'},
  {id:dungeonId,gameStyle:'dungeon',...gameplay('classic'),expected:'rpg'},
  {id:'dungeon-custom',gameStyle:'dungeon',...gameplay('custom'),expected:'rpg'},
  {id:'manga',gameStyle:'dungeon',...gameplay('manga'),expected:'manga'},
  {id:'capture-new',...gameplay('creature'),expected:'creature'},
  {id:'capture-historical',gameStyle:'dungeon',...gameplay('creature'),expected:'creature'},
  {id:'capture-modules',...gameplay('custom',{capture:true,controllableCreatures:true}),expected:'creature'},
  {id:'capture-contradictory',gameStyle:'survival',...gameplay('creature'),expected:'creature'},
  {id:'capture-disabled-modules-preset',...gameplay('creature',{capture:false,controllableCreatures:false}),expected:'creature'},
  {id:'partial-capture',...gameplay('custom',{capture:true,controllableCreatures:false}),expected:'survival'},
  {id:'partial-controllable',...gameplay('custom',{capture:false,controllableCreatures:true}),expected:'survival'},
  {id:'string-modules',...gameplay('custom',{capture:'true',controllableCreatures:'true'}),expected:'survival'},
  {id:'numeric-modules',...gameplay('custom',{capture:1,controllableCreatures:1}),expected:'survival'},
  {id:'dungeon-partial',gameStyle:'dungeon',...gameplay('custom',{capture:true,controllableCreatures:false}),expected:'rpg'}
];
const profiles=cases.map(({expected,...p})=>({...p,name:p.id,heroPool:[],objectPool:[],enemyConfig:{}}));
const store=new Map([
  [profileKey,JSON.stringify(profiles)],
  [activeKey,'capture-new'],
  ['gensrpg_dungeon_runtime_v2','preserved-dungeon-save'],
  ['gensrpg_capture_battle_current_v1','preserved-capture-save']
]);
const persisted=()=>JSON.stringify(Array.from(store.entries()).sort());
const before=persisted();
const writes=[];
const context={console,localStorage:{
  getItem:key=>store.get(String(key))??null,
  setItem:(key,value)=>{writes.push(String(key));store.set(String(key),String(value))},
  removeItem:key=>{writes.push(String(key));store.delete(String(key))}
}};
context.window=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'real-capture-entry-v1.js'});
const owners=[
  'loadGameProfilesRaw','saveGameProfiles','loadGameProfiles','activeGameProfileId',
  'gensReferenceSurvivalSettings','gensBlankSurvivalSettings','ensureSurvivalProfileData',
  'gensContentFamilyForProfile','survivalProfiles','gensFamilyForProfileId','renderGensSurvivalUniverseCards'
];
vm.runInContext(
  'const GAME_PROFILES_KEY='+JSON.stringify(profileKey)+';\n'+
  'const GAME_PROFILE_ACTIVE_KEY='+JSON.stringify(activeKey)+';\n'+
  'const GAME_PROFILE_BASE_ID='+JSON.stringify(baseId)+';\n'+
  'const GAME_PROFILE_DUNGEON_ID='+JSON.stringify(dungeonId)+';\n'+
  owners.map(exactFunction).join('\n')+'\n'+
  ['z40kEscHtml','z40kEscAttr'].map(exactOneLineFunction).join('\n'),
  context,{filename:'exact-Shell-library-owners.js'}
);

for(const item of cases){
  assert.equal(context.gensContentFamilyForProfile(item),item.expected,'real canonical family for '+item.id);
  assert.equal(context.GensCaptureV1.isProfile(item),item.expected==='creature','real Capture identity for '+item.id);
  assert.equal(context.gensFamilyForProfileId(item.id),item.expected==='survival'?'survival':'adventure',
    'existing Shell route must remain stable for '+item.id);
}

// Observe calls while retaining the real normalizer, never replace a classification result.
const normalization=[];
const realNormalizer=context.ensureSurvivalProfileData;
context.ensureSurvivalProfileData=function(profile){normalization.push(profile?.id);return realNormalizer(profile)};
const actual=Array.from(context.survivalProfiles(),p=>p.id);
const expected=cases.filter(p=>p.expected==='survival').map(p=>p.id);
console.log(JSON.stringify({scenario:'canonical Survival library membership',actual,expected}));
assert.deepEqual(actual,expected,'Survival library must exclude every canonical Capture representation');
assert.deepEqual(normalization,expected,'only genuine Survival profiles may enter the real Survival normalizer');

normalization.length=0;
const cards=context.renderGensSurvivalUniverseCards();
for(const item of cases){
  const action="openGensBuiltInGame('"+item.id+"','survival')";
  assert.equal(cards.includes(action),item.expected==='survival','real Survival card membership for '+item.id);
}
assert.ok(cards.includes('createNewSurvivalUniverse(true)'),'the real create-universe action must remain accessible');
assert.deepEqual([...new Set(normalization)],expected,'rendering must not normalize Capture as Survival');
assert.equal(context.activeGameProfileId(),'capture-new','reading the libraries must not change the active profile');
assert.equal(persisted(),before,'classification and rendering must not mutate persistent profiles or module saves');
assert.deepEqual(writes,[],'the real library read/render path must perform no storage writes');
console.log(JSON.stringify({scenario:'Phase 9 canonical Survival library',profiles:cases.length,
  survival:expected.length,capture:cases.filter(p=>p.expected==='creature').length,
  owner:'survivalProfiles -> gensContentFamilyForProfile -> GensCaptureV1.isProfile',persistentWrites:writes.length}));
