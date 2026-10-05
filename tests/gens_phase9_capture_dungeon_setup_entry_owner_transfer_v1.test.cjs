'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const fixtureBytes=fs.readFileSync(path.join(__dirname,'fixtures/phase9_dungeon_setup_entry_before_transfer_v1.json'));
assert.equal(crypto.createHash('sha256').update(fixtureBytes).digest('hex'),
  '3d925e4f3760819642b1f48d2ab2d0aba66dbd5c45d6595d0d4d4b1e3d22e7b2',
  'the exact pre-audit reference must remain immutable');
const before=JSON.parse(fixtureBytes);

function between(source,startMarker,endMarker){
  const start=source.indexOf(startMarker);
  assert.ok(start>=0,'missing '+startMarker);
  assert.equal(source.indexOf(startMarker,start+startMarker.length),-1,'ambiguous '+startMarker);
  const end=source.indexOf(endMarker,start+startMarker.length);
  assert.ok(end>start,'missing '+endMarker);
  return source.slice(start,end);
}
function block(id){return between(index,'<script id="'+id+'">','</script>').split('>').slice(1).join('>')}
const native=between(index,'function openSessionDungeonSetup(){','\nfunction closeSessionDungeonSetup(');
const dungeonIdentity=between(index,'function isDungeonMode(){','\nfunction ');
const captureIdentity=between(index,'function gensCapturePregameMode(){','\nfunction gensCaptureStarterPool(');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const mode151=between(block('gensStability151'),'window.gensMode151=function(){','\n\nwindow.dungeonMjRules151');
assert.equal(mode151,before.mode151,'the global classifier is protected');

const capture=(legacy=false,modulesOnly=false)=>({
  id:'gp_mt7ker7t_m2iw9',...(legacy?{gameStyle:'dungeon'}:{}),
  rpgUniverse:{gameplay:{...(modulesOnly?{}:{profile:'creature'}),
    modules:{capture:true,controllableCreatures:true}}}
});
const cases=[
  {name:'new Capture',profile:capture(),opens:false},
  {name:'historical Capture with Dungeon style',profile:capture(true),opens:false},
  {name:'Capture identified through modules',profile:capture(true,true),opens:false},
  {name:'built-in Dungeon',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},opens:true},
  {name:'built-in Dungeon id without style',profile:{id:'game_profile_dungeon_demo'},opens:false},
  {name:'custom Dungeon',profile:{id:'custom_dungeon',gameStyle:'dungeon'},opens:true},
  {name:'Survival id with Dungeon style',profile:{id:'game_profile_zombicide_base',gameStyle:'dungeon'},opens:false},
  {name:'Survival',profile:{id:'game_profile_zombicide_base'},opens:false},
  {name:'other profile',profile:{id:'custom_other'},opens:false},
  {name:'no active profile',profile:null,opens:false},
  {name:'Capture identity wins over built-in Dungeon id',profile:{...capture(true),id:'game_profile_dungeon_demo'},opens:false},
  {name:'creature identity without module flags',profile:{id:'creature_only',gameStyle:'dungeon',rpgUniverse:{gameplay:{profile:'creature'}}},opens:false},
  {name:'partial Capture flags do not identify Capture',profile:{id:'custom_dungeon',gameStyle:'dungeon',rpgUniverse:{gameplay:{modules:{capture:true,controllableCreatures:false}}}},opens:true},
  {name:'profile lookup fails closed',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},lookupError:true,opens:false},
  {name:'identity API fails closed',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},identityError:true,opens:false},
  {name:'missing optional identity API preserves Dungeon gate',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},missingIdentity:true,opens:true},
  {name:'storage lookup fails closed in native Dungeon helper',profile:{id:'custom_dungeon',gameStyle:'dungeon'},storageError:true,opens:false},
  {name:'missing setup element preserves native body',profile:{id:'game_profile_dungeon_demo',gameStyle:'dungeon'},missingPage:true,opens:true}
];

function execute(item,reference){
  const trace=[];
  const profile=item.profile&&JSON.parse(JSON.stringify(item.profile));
  const storage=new Map([
    ['gensrpg_game_profile_active_v1',profile?.id||''],
    ['gensrpg_game_profiles_v1',JSON.stringify(profile?[profile]:[])]
  ]);
  const storedBefore=JSON.stringify([...storage]),profileBefore=JSON.stringify(profile);
  const effects={hide:0,render:0,scroll:0};
  const page={style:{display:'none'}};
  const context={
    localStorage:{getItem:key=>{trace.push('storage:'+key);if(item.storageError)throw Error('storage failure');return storage.get(key)??null},
      setItem:()=>assert.fail('entry must not write storage'),removeItem:()=>assert.fail('entry must not remove storage')},
    getActiveGameProfile:()=>{trace.push('profile');if(item.lookupError)throw Error('profile failure');return profile},
    document:{getElementById:id=>{assert.equal(id,'sessionDungeonSetup');return item.missingPage?null:page}},
    hidePregameAndSessionPages:()=>{effects.hide++;trace.push('hide')},
    renderSessionDungeonLibrary:()=>{effects.render++;trace.push('render')},
    scrollTo:(x,y)=>{assert.equal(x,0);assert.equal(y,0);effects.scroll++;trace.push('scroll')}
  };
  context.window=context;vm.createContext(context);
  vm.runInContext(captureEntry,context,{filename:'capture/entry-v1.js'});
  if(item.missingIdentity)delete context.GensCaptureV1;
  if(item.identityError)context.GensCaptureV1={isProfile:()=>{throw Error('identity failure')}};
  vm.runInContext(dungeonIdentity+'\n'+captureIdentity+'\n'+(reference?before.native:native)+'\n'+mode151,
    context,{filename:reference?'verified-preaudit-reference.js':'native-pregame-owner.js'});
  if(reference){
    vm.runInContext(before.guard137,context,{filename:'retired-capture137-reference.js'});
    vm.runInContext(before.guard151,context,{filename:'retired-v151-reference.js'});
  }
  assert.equal(context.openSessionDungeonSetup(),undefined,'entry return contract must remain undefined');
  assert.equal(JSON.stringify([...storage]),storedBefore,'entry must preserve all stored profile bytes');
  assert.equal(JSON.stringify(profile),profileBefore,'entry must not migrate the active profile');
  return {effects,display:page.style.display,trace};
}

const failures=[],evidence=[];
for(const item of cases){
  const reference=execute(item,true),actual=execute(item,false);
  const expectedEffects=item.opens?{hide:1,render:1,scroll:1}:{hide:0,render:0,scroll:0};
  const expectedDisplay=item.opens&&!item.missingPage?'block':'none';
  assert.deepEqual(reference.effects,expectedEffects,item.name+' / verified historical production contract');
  assert.equal(reference.display,expectedDisplay,item.name+' / verified historical view');
  if(JSON.stringify(actual.effects)!==JSON.stringify(expectedEffects)||actual.display!==expectedDisplay){
    failures.push({name:item.name,expected:{effects:expectedEffects,display:expectedDisplay},actual:{effects:actual.effects,display:actual.display}});
  }
  if(item.name.includes('Capture')&&!item.opens){
    assert.deepEqual(reference.trace,['profile'],'historical Capture is rejected before Dungeon UI/identity');
    if(actual.trace.join('|')!=='profile')failures.push({name:item.name,expectedTrace:['profile'],actualTrace:actual.trace});
  }
  evidence.push({name:item.name,opens:item.opens,referenceEffects:reference.effects,nativeEffects:actual.effects});
}
assert.deepEqual(failures,[],
  'RED: native owner must preserve the complete V151 entry predicate, including historical Capture and Dungeon id without style');

assert.match(native,/GensCaptureV1\?\.isProfile\?\.\(p\)/,'native owner must reuse public canonical Capture identity');
assert.match(native,/p\?\.gameStyle!=="dungeon"/,'native owner must preserve the complete V151 Dungeon-style gate');
assert.match(native,/if\(!isDungeonMode\(\)\)return;/,'native Dungeon guard must remain');
assert.doesNotMatch(native,/gensMode151|gensCapturePregameMode/,'entry must own its boundary without legacy wrapper helpers');
assert.equal((index.match(/function openSessionDungeonSetup\(/g)||[]).length,1,'one native declaration');
assert.doesNotMatch(index,/\bwindow\.openSessionDungeonSetup\s*=/,'no inline module may reassign this protected entry');
assert.doesNotMatch(block('captureFix137'),/openSessionDungeonSetup/,'Capture137 relinquishes Dungeon navigation');
assert.doesNotMatch(block('gensStability151'),/openD151|openSessionDungeonSetup/,'V151 relinquishes this entry');

const restored=index.replace(native,before.native)
  .replace(before.anchor137,before.removed137+before.anchor137)
  .replace(before.anchor151,before.removed151+before.anchor151);
const restoredBytes=Buffer.from(restored,'utf8');
const restoredBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+restoredBytes.length+'\0'),restoredBytes
])).digest('hex');
assert.equal(restoredBlob,before.sourceIndexBlob,
  'reversing exactly this native guard transfer and the two wrapper removals must recover the byte-exact GREEN runtime');

for(const proof of [
  'tests/gens_phase9_capture_post_shell_without_dungeon_style_browser_characterization_v1.test.cjs',
  'tests/gens_phase9_capture_persisted_profile_without_dungeon_style_resume_characterization_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_dungeon_after_survival_start_state_browser_v11411.test.cjs',
  'tests/gens_phase5_module_launch_s4_dungeon_provider_browser_v1.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
])assert.ok(fs.existsSync(path.join(root,proof)),proof+' must remain protected');

console.log(JSON.stringify({scenario:'Phase 9 native Dungeon setup entry owner transfer',
  owner:'native openSessionDungeonSetup',retiredWrappers:['captureFix137','gensStability151'],
  referenceBlob:before.sourceIndexBlob,cases:evidence,exactRuntimeDiff:true},null,2));
