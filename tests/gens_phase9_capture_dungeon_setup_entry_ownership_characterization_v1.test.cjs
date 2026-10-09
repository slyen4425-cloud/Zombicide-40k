'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8165438,'characterize the verified Phase 9 runtime only');
assert.equal(blob,'1a61147d5a32889fa85e6a09e846049103b9f0bf');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const end=index.indexOf('</script>',start+marker.length);
  assert.ok(end>start,'unterminated '+id);
  return index.slice(start+marker.length,end);
}

function exactBetween(source,startMarker,endMarker){
  const start=source.indexOf(startMarker);
  assert.ok(start>=0,'missing '+startMarker);
  assert.equal(source.indexOf(startMarker,start+startMarker.length),-1,'ambiguous '+startMarker);
  const end=source.indexOf(endMarker,start+startMarker.length);
  assert.ok(end>start,'missing boundary '+endMarker);
  return source.slice(start,end);
}

const captureEntry=fs.readFileSync(path.join(root,'assets/gensrpg/capture/entry-v1.js'),'utf8');
const dungeonIdentity=exactBetween(index,'function isDungeonMode(){','\nfunction ');
const captureIdentity=exactBetween(index,'function gensCapturePregameMode(){','\nfunction gensCaptureStarterPool(');
const native=exactBetween(index,'function openSessionDungeonSetup(){','\nfunction closeSessionDungeonSetup(');
const c137=block('captureFix137');
const c151=block('gensStability151');
assert.match(native,/if\(!isDungeonMode\(\)\)return;/);
assert.match(native,/GensCaptureV1\?\.isProfile\?\.\(p\)/,
  'native owner must now exclude canonical Capture directly');
assert.match(native,/p\?\.gameStyle!=="dungeon"/,
  'native owner must retain the complete historical V151 Dungeon gate');
assert.doesNotMatch(c137,/openSessionDungeonSetup/);
assert.doesNotMatch(c151,/openD151|openSessionDungeonSetup/);
assert.doesNotMatch(index,/window\.openSessionDungeonSetup\s*=/,
  'both former module wrappers must stay retired');

const captureProfile=(legacy=false,modulesOnly=false)=>({
  id:'gp_mt7ker7t_m2iw9',
  ...(legacy?{gameStyle:'dungeon'}:{}),
  rpgUniverse:{gameplay:{
    ...(modulesOnly?{}:{profile:'creature'}),
    modules:{capture:true,controllableCreatures:true}
  }}
});
const cases=[
  {name:'new Capture seed',profile:captureProfile(),native:false,capture137:false,final:false},
  {name:'historical Capture with Dungeon style',profile:captureProfile(true),native:true,capture137:false,final:false},
  {name:'Capture identified through modules',profile:captureProfile(true,true),native:true,capture137:false,final:false},
  {name:'built-in Dungeon',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},native:true,capture137:true,final:true},
  {name:'built-in Dungeon id without style',profile:{id:'game_profile_dungeon_demo'},native:true,capture137:true,final:false},
  {name:'custom Dungeon',profile:{id:'custom_dungeon',gameStyle:'dungeon'},native:true,capture137:true,final:true},
  {name:'Survival id with Dungeon style',profile:{id:'game_profile_zombicide_base',gameStyle:'dungeon'},native:false,capture137:false,final:false},
  {name:'Survival',profile:{id:'game_profile_zombicide_base'},native:false,capture137:false,final:false},
  {name:'other profile',profile:{id:'custom_other'},native:false,capture137:false,final:false},
  {name:'no active profile',profile:null,native:false,capture137:false,final:false}
];

function execute(profile){
  const trace=[];
  const storage=new Map([
    ['gensrpg_game_profile_active_v1',profile?.id||''],
    ['gensrpg_game_profiles_v1',JSON.stringify(profile?[profile]:[])]
  ]);
  const before=JSON.stringify([...storage]);
  const effects={hide:0,render:0,scroll:0};
  const page={style:{display:'none'}};
  const context={
    localStorage:{getItem:key=>{trace.push('storage:'+key);return storage.get(key)??null}},
    getActiveGameProfile:()=>{trace.push('profile');return profile},
    document:{getElementById:id=>id==='sessionDungeonSetup'?page:null},
    hidePregameAndSessionPages:()=>{effects.hide++;trace.push('hide')},
    renderSessionDungeonLibrary:()=>{effects.render++;trace.push('render')},
    scrollTo:(x,y)=>{assert.equal(x,0);assert.equal(y,0);effects.scroll++;trace.push('scroll')}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(captureEntry,context,{filename:'capture/entry-v1.js'});
  vm.runInContext(dungeonIdentity+'\n'+captureIdentity+'\n'+native,context,{filename:'native-pregame-owners.js'});
  const result=context.openSessionDungeonSetup();
  const entered=page.style.display==='block';
  assert.equal(result,undefined,'historical entry return contract stays unchanged');
  assert.deepEqual(effects,entered?{hide:1,render:1,scroll:1}:{hide:0,render:0,scroll:0},
    'entry must either reach its native UI body exactly once or have zero UI effects');
  assert.equal(JSON.stringify([...storage]),before,'entry must not mutate stored profiles in the characterization');
  return {entered,effects,trace};
}

const evidence=[];
for(const item of cases){
  const result=execute(item.profile);
  assert.equal(result.entered,item.final,item.name+' / native production owner preserves the pre-audit final contract');
  if(item.name.includes('Capture')){
    assert.deepEqual(result.trace,['profile'],
      'native owner must reject canonical Capture before Dungeon identity or UI');
  }
  evidence.push({name:item.name,productionEntered:result.entered,productionTrace:result.trace});
}

assert.ok(fs.existsSync(path.join(root,'tests/gens_phase9_capture_dungeon_setup_entry_owner_transfer_v1.test.cjs')),
  'the immutable old-chain comparison and exact inverse-runtime proof must remain available');
console.log(JSON.stringify({
  scenario:'Phase 9 Dungeon setup entry production parity after ownership transfer',
  rule26:{bytes:bytes.length,blob},
  chain:['native openSessionDungeonSetup'],
  retiredWrappers:['captureFix137','gensStability151'],
  evidence,
  decision:'Native pregame owner preserves the complete historical production predicate; both former wrappers remain retired'
},null,2));
