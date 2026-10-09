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

// Compose the later Phase 9 Capture session-start transfer inverse before
// replaying this older Dungeon-entry proof. This keeps the historical target
// immutable instead of repinning it to a newer runtime.
const sessionLoadOld='<script src="assets/gensrpg/capture/entry-v1.js?v=1"></script>';
const sessionLoadNew=sessionLoadOld+'\n<script src="assets/gensrpg/capture/session-start-v1.js?v=1"></script>';
const sessionSeamOld=`/* Neutralise l'ouverture automatique d'une fiche durant la fenêtre critique de lancement. */
window._captureStarting139=false;

/* Remplace le lancement Capture par un chemin dédié, sans passer par les initialisations Dungeon. */
const start139=window.startConfiguredGame;
window.startConfiguredGame=async function(){
  if(!isCaptureContext138())return await start139.apply(this,arguments);

  const participants=normalizeGameParticipants();
  if(!participants.length){
    alert("Sélectionne au moins un dresseur avant de démarrer.");
    openSessionHeroSetup();return;
  }
  if(typeof gensCaptureParticipantsReady==="function"&&!gensCaptureParticipantsReady()){
    alert("Choisis les créatures de départ avant de démarrer.");
    openSessionHeroSetup();return;
  }

  window._captureStarting139=true;
  try{
    /* participant actif fixé AVANT activation de la session */
    current=String(participants[0]);
    try{state=loadState(current)}catch(e){}
    saveGameParticipants([...participants]);

    try{applyCustomHeroesMulti()}catch(e){}
    try{applyPregameGoldToParticipants(participants)}catch(e){}
    try{markSessionActive(true)}catch(e){}

    /* nouveau monde Capture */
    try{
      const ws=captureWorldState();
      ws.day=1;ws.turnIndex=0;ws.round=1;ws.last=null;
      if(!ws.locationId)ws.locationId="cap_forest";
      if(!ws.locationName)ws.locationName="Forêt sauvage";
      saveCaptureWorldState(ws);
    }catch(e){}

    try{captureEnsureStarterKitsForParticipants()}catch(e){}

    /* Tours : ne démarrent que si explicitement cochés */
    const toggle=document.getElementById("participantTurnOrderToggle");
    const cfg=loadGameCustomization();
    cfg.turnOrder=!!toggle?.checked;
    saveGameCustomization(cfg);
    if(cfg.turnOrder){
      try{startTurnManagerForGame()}catch(e){}
    }else{
      try{saveTurnState(null);closeTurnPopup(false);renderTurnUi()}catch(e){}
    }

    captureEnterWorld139();
  }finally{
    /* garde le verrou un instant pour bloquer les vieux setTimeout openChar */
    setTimeout(()=>{
      window._captureStarting139=false;
      captureEnterWorld139();
    },1200);
  }
};
const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;
window.GensCaptureV1.install(gensCaptureStartConfiguredGame139V1);`;
const sessionSeamNew=`/* Le propriétaire Capture initialise la session ; Capture139 ne conserve que le câblage legacy explicite. */
window.GensCaptureSessionStartV1.install({
  normalizeParticipants:()=>normalizeGameParticipants(),
  participantsReady:()=>typeof gensCaptureParticipantsReady!=="function"||gensCaptureParticipantsReady(),
  activateParticipant:id=>{
    current=String(id);
    try{state=loadState(current)}catch(e){}
  },
  saveParticipants:participants=>saveGameParticipants([...participants]),
  applyCustomHeroes:()=>applyCustomHeroesMulti(),
  applyPregameGold:participants=>applyPregameGoldToParticipants(participants),
  markSessionActive:()=>markSessionActive(true),
  loadWorld:()=>captureWorldState(),
  saveWorld:ws=>saveCaptureWorldState(ws),
  ensureStarterKits:()=>captureEnsureStarterKitsForParticipants(),
  readTurnOrderEnabled:()=>!!document.getElementById("participantTurnOrderToggle")?.checked,
  loadCustomization:()=>loadGameCustomization(),
  saveCustomization:cfg=>saveGameCustomization(cfg),
  startTurnManager:()=>startTurnManagerForGame(),
  clearTurnManager:()=>{saveTurnState(null);closeTurnPopup(false);renderTurnUi()},
  enterWorld:()=>captureEnterWorld139(),
  notify:message=>alert(message),
  openParticipantSetup:()=>openSessionHeroSetup()
});
window.GensCaptureV1.install(window.GensCaptureSessionStartV1);`;

const captureCardMetaOld=`const meta=(p.heroPool?.length||0)+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" monstres";`;
const captureCardMetaNew=`const trainerCount=p.heroPool?.length||0;
      const meta=gensContentFamilyForProfile(p)==="creature"
        ? trainerCount+" dresseur"+(trainerCount===1?"":"s")+" · Capture de créatures"
        : trainerCount+" héros · "+(p.objectPool?.length||0)+" objets · "+Object.keys(p.enemyConfig||{}).length+" monstres";`;

assert.equal(index.split(captureCardMetaNew).length-1,1,
  'current runtime must contain the one approved Capture-card semantic seam');
// Invert the separately approved Capture screen-return owner transfer first.
// This additional seam must restore the prior GREEN byte-for-byte, before
// the earlier Capture card and session-start inverses are composed.
const captureReturnLoadOld="<script src=\"assets/gensrpg/capture/session-start-v1.js?v=1\"></script>";
const captureReturnLoadNew="<script src=\"assets/gensrpg/capture/session-start-v1.js?v=1\"></script>\n<script src=\"assets/gensrpg/capture/screen-return-v1.js?v=1\"></script>";
const captureReturnSeamOld=`/* Le Shell garde l’unique frontière globale goMenu.
   Capture expose uniquement son retour owner-local via le contrat public. */
window.GensShellScreenReturnV1?.register?.("capture",function(){
  if(!hasActiveSession()||!isCaptureContext138())return false;
  captureEnterWorld139();
  return true;
});`;
const captureReturnSeamNew=`/* Le propriétaire Capture enregistre son retour via ses seules dépendances legacy. */
window.GensCaptureScreenReturnV1.install({
  hasActiveSession:()=>hasActiveSession(),
  isCaptureContext:()=>isCaptureContext138(),
  enterWorld:()=>captureEnterWorld139()
});`;
assert.equal(index.split(captureReturnLoadNew).length-1,1,'exactly one current Capture return-owner script load seam');

const hubEntryLoadOld="<script src=\"assets/gensrpg/capture/screen-return-v1.js?v=1\"></script>";
const hubEntryLoadNew="<script src=\"assets/gensrpg/capture/screen-return-v1.js?v=1\"></script>\n<script src=\"assets/gensrpg/capture/hub-entry-v1.js?v=1\"></script>";
const hubEntrySeamOld="window.captureEnterWorld139=function(){\n  try{closeTurnPopup(false)}catch(e){}\n  [\"pregameSetup\",\"sessionHeroSetup\",\"sessionObjectSetup\",\"sessionWaveSetup\",\"sessionDungeonSetup\",\"sheet\",\"setup\"].forEach(id=>{\n    const e=document.getElementById(id);if(e)e.style.setProperty(\"display\",\"none\",\"important\");\n  });\n  const menu=document.getElementById(\"menu\");\n  if(menu)menu.style.setProperty(\"display\",\"block\",\"important\");\n  try{renderMenuStatuses()}catch(e){}\n  try{renderCaptureWorldHub()}catch(e){}\n  const hub=document.getElementById(\"captureGameHub\");\n  if(hub){\n    hub.style.setProperty(\"display\",\"block\",\"important\");\n    requestAnimationFrame(()=>hub.scrollIntoView({block:\"start\",behavior:\"auto\"}));\n  }\n};";
const hubEntrySeamNew="window.GensCaptureHubEntryV1.install({\n  closeTurnPopup:()=>closeTurnPopup(false),\n  renderMenuStatuses:()=>renderMenuStatuses(),\n  renderCaptureWorldHub:()=>renderCaptureWorldHub()\n});";
const hubEntryBindOld="enterWorld:()=>captureEnterWorld139()";
const hubEntryBindNew="enterWorld:()=>window.GensCaptureHubEntryV1.enterWorld()";
assert.equal(index.split(hubEntryLoadNew).length-1,1,'one Hub owner script load');
assert.equal(index.split(hubEntrySeamNew).length-1,1,'one Hub owner install');
assert.equal(index.split(hubEntryBindNew).length-1,2,'both Capture owners use dedicated hub');
const beforeHubEntry=index.replace(hubEntryBindNew,hubEntryBindOld)
  .replace(hubEntryBindNew,hubEntryBindOld)
  .replace(hubEntrySeamNew,hubEntrySeamOld)
  .replace(hubEntryLoadNew,hubEntryLoadOld);
const restoredHubBytes=Buffer.from(beforeHubEntry,'utf8');
const restoredHubBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+restoredHubBytes.length+'\0'),restoredHubBytes
])).digest('hex');
assert.equal(restoredHubBlob,'26421e0347305437fe2b1dc149b3e4fb8b3761bd','before cumulative rollback, undo Hub owner exactly');
assert.equal(beforeHubEntry.split(captureReturnLoadNew).length-1,1,'Capture return script load preserved in rollback');
assert.equal(beforeHubEntry.split(captureReturnSeamNew).length-1,1,'Capture return dependency preserved in rollback');
const beforeReturnOwner=beforeHubEntry.replace(captureReturnLoadNew,captureReturnLoadOld).replace(captureReturnSeamNew,captureReturnSeamOld);
const beforeReturnBytes=Buffer.from(beforeReturnOwner,'utf8');
const beforeReturnBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+beforeReturnBytes.length+'\0'),beforeReturnBytes
])).digest('hex');
assert.equal(beforeReturnBlob,'462abc969e7ac636f8ac4ee54c0d14fe51b83e7d',
  'reversing ONLY the Capture return owner must restore the approved preceding GREEN exactly');
const beforeCaptureCard=beforeReturnOwner.replace(captureCardMetaNew,captureCardMetaOld);

assert.equal(beforeCaptureCard.split(sessionLoadNew).length-1,1,'current runtime must contain one Capture session-owner load seam');
assert.equal(beforeCaptureCard.split(sessionSeamNew).length-1,1,'current runtime must contain one Capture session-owner wiring seam');
let beforeSessionOwner=beforeCaptureCard.replace(sessionLoadNew,sessionLoadOld).replace(sessionSeamNew,sessionSeamOld);
const beforeSessionOwnerBytes=Buffer.from(beforeSessionOwner,'utf8');
const beforeSessionOwnerBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+beforeSessionOwnerBytes.length+'\0'),beforeSessionOwnerBytes
])).digest('hex');
assert.equal(beforeSessionOwnerBlob,'20381d1df0b10b664d5163f308f909cd7a6e45df',
  'inverting the approved Capture-card seam plus the Capture session-start transfer must recover the exact GREEN base');

// Invert the separately declared canonical Survival-editor guard seam first.
const editorBoundarySeams=[{"count": 1, "before": "function activeSurvivalModId(){\n  const p=getActiveGameProfile();\n  if(p&&p.gameStyle!==\"dungeon\")return p.id;\n  return GAME_PROFILE_BASE_ID;\n}", "after": "function activeSurvivalModId(){\n  const p=getActiveGameProfile();\n  if(p&&gensContentFamilyForProfile(p)===\"survival\")return p.id;\n  return GAME_PROFILE_BASE_ID;\n}"}, {"count": 1, "before": "function setActiveSurvivalMod(id){\n  const p=loadGameProfiles().find(x=>String(x.id)===String(id)&&x.gameStyle!==\"dungeon\");\n  if(p)applyGameProfile(p,false);\n}", "after": "function setActiveSurvivalMod(id){\n  const p=loadGameProfiles().find(x=>String(x.id)===String(id)&&gensContentFamilyForProfile(x)===\"survival\");\n  if(p)applyGameProfile(p,false);\n}"}, {"count": 1, "before": "function currentSmodProfile(){\n  const arr=loadGameProfiles();return arr.find(x=>String(x.id)===String(smodEditingId)&&x.gameStyle!==\"dungeon\")||arr.find(x=>x.id===GAME_PROFILE_BASE_ID)\n}", "after": "function currentSmodProfile(){\n  const arr=loadGameProfiles();return arr.find(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\")||arr.find(x=>x.id===GAME_PROFILE_BASE_ID&&gensContentFamilyForProfile(x)===\"survival\")\n}"}, {"count": 1, "before": "function selectSurvivalModProfile(id){smodEditingId=id;setActiveSurvivalMod(id);renderSurvivalModEditor()}", "after": "function selectSurvivalModProfile(id){if(!loadGameProfiles().some(x=>String(x.id)===String(id)&&gensContentFamilyForProfile(x)===\"survival\"))return;smodEditingId=id;setActiveSurvivalMod(id);renderSurvivalModEditor()}"}, {"count": 6, "before": "  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(smodEditingId));if(i<0)return;", "after": "  const profiles=loadGameProfiles(),i=profiles.findIndex(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\");if(i<0)return;"}, {"count": 1, "before": "  const profiles=loadGameProfiles(),pi=profiles.findIndex(x=>String(x.id)===String(smodEditingId));if(pi<0)return;", "after": "  const profiles=loadGameProfiles(),pi=profiles.findIndex(x=>String(x.id)===String(smodEditingId)&&gensContentFamilyForProfile(x)===\"survival\");if(pi<0)return;"}, {"count": 1, "before": "  const profiles=loadGameProfiles(),source=currentSmodProfile();if(!source)return;", "after": "  const profiles=loadGameProfiles(),source=currentSmodProfile();if(!source||String(source.id)!==String(smodEditingId))return;"}];
let beforeEditorBoundary=beforeSessionOwner;
for(const seam of [...editorBoundarySeams].reverse()){
  assert.equal(beforeEditorBoundary.split(seam.after).length-1,seam.count,"declared canonical editor guard count");
  beforeEditorBoundary=beforeEditorBoundary.split(seam.after).join(seam.before);
}
const editorBoundaryBytes=Buffer.from(beforeEditorBoundary,"utf8");
const editorBoundaryBlob=crypto.createHash("sha1").update(Buffer.concat([
  Buffer.from("blob "+editorBoundaryBytes.length+"\0"),editorBoundaryBytes
])).digest("hex");
assert.equal(editorBoundaryBlob,"d721d1665ba937b855d8de6c5b59c8d04d4a2bdf","inverse editor guards must recover the exact preceding GREEN");

// Compose the separately authorized Survival-library seam before the historical
// owner-transfer inverse. Both immutable checkpoints remain byte-exact targets.
const previousLibrary='function survivalProfiles(){\n  return loadGameProfiles().filter(p=>p.gameStyle!=="dungeon").map(ensureSurvivalProfileData);\n}';
const canonicalLibrary='function survivalProfiles(){\n  return loadGameProfiles().filter(p=>gensContentFamilyForProfile(p)==="survival").map(ensureSurvivalProfileData);\n}';
assert.equal(beforeEditorBoundary.split(canonicalLibrary).length-1,1,'exactly one canonical Survival-library owner must be present');
const ownershipRuntime=beforeEditorBoundary.replace(canonicalLibrary,previousLibrary);
const ownershipBytes=Buffer.from(ownershipRuntime,'utf8');
const ownershipBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+ownershipBytes.length+'\0'),ownershipBytes
])).digest('hex');
assert.equal(ownershipBlob,'1e3398755beb751786d825047bc60fe1a7179d79',
  'undoing only the declared Survival-library predicate must recover the byte-exact preaudit GREEN');

const restored=ownershipRuntime.replace(native,before.native)
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
