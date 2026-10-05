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
assert.equal(bytes.length,8166377,'characterize the verified Phase 9 runtime only');
assert.equal(blob,'37056722bb0a27f96e26b3ef3b05e9543dc5a223');

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
const guard137=exactBetween(c137,'window.openSessionDungeonSetup=(function(old){','\n\n/* ---------- multiplicateurs XP / or');
const mode151=exactBetween(c151,'window.gensMode151=function(){','\n\nwindow.dungeonMjRules151');
const guard151=exactBetween(c151,'const openD151=window.openSessionDungeonSetup;','\n\n/* Premier affichage. */');

assert.match(native,/if\(!isDungeonMode\(\)\)return;/);
assert.doesNotMatch(native,/GensCaptureV1|gensCapturePregameMode|gensMode151/,
  'pre-audit must expose the native owner lacking its own canonical Capture exclusion');
assert.match(guard137,/gensCapturePregameMode\(\)/);
assert.match(mode151,/GensCaptureV1\?\.isProfile\?\.\(p\)/);
assert.match(guard151,/gensMode151\(\)!=="dungeon"/);
assert.ok(index.indexOf('function openSessionDungeonSetup(){')<index.indexOf('<script id="captureFix137">'));
assert.ok(index.indexOf('<script id="captureFix137">')<index.indexOf('<script id="gensStability151">'));

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

function execute(profile,layers){
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
  vm.runInContext(dungeonIdentity+'\n'+captureIdentity+'\n'+native+'\n'+mode151,context,{filename:'native-pregame-owners.js'});
  if(layers.includes('137'))vm.runInContext(guard137,context,{filename:'captureFix137.setup-guard.js'});
  if(layers.includes('151'))vm.runInContext(guard151,context,{filename:'gensStability151.setup-guard.js'});
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
  const nativeResult=execute(item.profile,[]);
  const capture137=execute(item.profile,['137']);
  const full=execute(item.profile,['137','151']);
  const without137=execute(item.profile,['151']);
  assert.equal(nativeResult.entered,item.native,item.name+' / native owner');
  assert.equal(capture137.entered,item.capture137,item.name+' / Capture137 guard');
  assert.equal(full.entered,item.final,item.name+' / full production chain');
  assert.equal(without137.entered,full.entered,item.name+' / Capture137 is redundant behind V151');
  assert.deepEqual(without137.effects,full.effects,item.name+' / same native effects without Capture137');
  if(item.name.includes('Capture')){
    assert.deepEqual(full.trace,['profile'],
      'V151 must reject canonical Capture before reaching Capture137, Dungeon identity or native UI');
  }
  evidence.push({name:item.name,nativeEntered:nativeResult.entered,capture137Entered:capture137.entered,
    productionEntered:full.entered,without137Entered:without137.entered,productionTrace:full.trace});
}

assert.equal(evidence.find(x=>x.name==='historical Capture with Dungeon style').nativeEntered,true,
  'removing both wrappers without moving the guard into the native owner would regress historical Capture');

console.log(JSON.stringify({
  scenario:'Phase 9 Dungeon setup entry ownership characterization',
  rule26:{bytes:bytes.length,blob},
  chain:['native openSessionDungeonSetup','captureFix137','gensStability151'],
  evidence,
  decision:'Move the full V151 entry predicate into the native pregame owner, preserve isDungeonMode(), then retire both wrappers in a separate TDD lot',
  runtimeChanged:false
},null,2));
