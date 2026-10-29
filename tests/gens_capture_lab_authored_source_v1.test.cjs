'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const lab=process.env.COMBAT_LAB_ROOT;
const PIN='92e2f75ff6e9b3e03d460115d53b5604adf0e718';
assert.ok(lab,'Official pinned Combat Lab checkout required');
assert.equal(execFileSync('git',['-C',lab,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),PIN);
const read=rel=>JSON.parse(fs.readFileSync(path.join(lab,rel),'utf8'));
const importLab=rel=>import(pathToFileURL(path.join(lab,rel)).href);
let dependencies;
async function source(){
 if(!dependencies){
  dependencies=Promise.all([
   import('../assets/gensrpg/capture/combat-lab-authored-source-v1.mjs'),
   importLab('src/contracts/capture-creature-transfer-v1.js'),
   importLab('src/contracts/capture-skill-transfer-v1.js'),
   importLab('src/contracts/capture-skill-editor-draft-v1.js'),
   importLab('src/adapters/input/capture/capture-combat-rules-overlay-v1.js'),
   importLab('src/adapters/input/capture/capture-editor-exporter-v3.js'),
   importLab('src/adapters/input/capture/capture-export-adapter-stack-v1.js'),
   importLab('src/catalogs/capture-portable-native-skill-catalog-v1.js'),
   importLab('src/catalogs/capture-complex-native-skill-catalog-v1.js')
  ]).then(([app,creature,skill,skillDraft,rules,exporter,adapter,portable,complex])=>{
   const catalog=read('data/combat/skills/catalog.v1.json');
   const manifest=fs.readFileSync(path.join(lab,'src/catalogs/capture-showcase-skill-presets-v1.js'),'utf8');
   // Parse only static manifest string literals and use the pinned official files.
   const listed=[...manifest.matchAll(/"((?:data\/capture\/showcase\/)[^"]+\.capture-skill-transfer-v1\.json)"/g)].map(m=>m[1]);
   assert.ok(listed.length>40,'official skill catalog must be fully available');
   const byId=new Map();
   for(const row of catalog.entries){
    const draft=skillDraft.normalizeCaptureSkillEditorDraftV1({
     schema:'capture-skill-editor-draft-v1',id:row.id,
     description:row.label||row.id,requiredLevel:1,
     usageScopes:['capture','combat'],definition:row.definition,presentation:null
    });
    byId.set(draft.id,draft);
   }
   for(const draft of [...portable.capturePortableNativeSkillDraftsV1(),...complex.captureComplexNativeSkillDraftsV1()]){
    byId.set(draft.id,draft);
   }
   for(const file of listed){
    const record=skill.normalizeCaptureSkillTransferV1(read(file));
    byId.set(record.draft.id,record.draft);
   }
   return {app,creature,skill,skillDraft,rules,exporter,adapter,skillDrafts:[...byId.values()],
    statRegistry:read('data/capture/monster-capture-stat-registry.v1.json'),
    transfers:[
      read('data/capture/showcase/crea-loup.capture-creature-transfer-v1.json'),
      read('data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json')
    ]};
  });
 }
 return dependencies;
}
const combatRules=Object.freeze({
 schema:'capture-combat-rules-editor-draft-v1',
 maxEnergy:10,initialEnergy:10,energyChargeAmount:1,
 energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0
});
const battleSettings=Object.freeze({arenaId:'forest',skillSpeedMultiplier:0.5,combatRules});
async function factory(options={}){
 const v=await source();
 return v.app.createCaptureLabAuthoredSourceV1({
   normalizeCreatureTransfer:v.creature.normalizeCaptureCreatureTransferV1,
   normalizeSkillDraft:v.skillDraft.normalizeCaptureSkillEditorDraftV1,
   overlayCombatRules:v.rules.applyCaptureCombatRulesToCreatureDraftV1,
   exportEditorDrafts:v.exporter.exportCaptureEditorDraftsToCombatExportV3,
   adaptCombatExport:v.adapter.adaptCaptureCombatExportStackV1,
   statRegistry:v.statRegistry,configuredSkillDrafts:v.skillDrafts,
   creatureTransfers:v.transfers,...options
 });
}
const battle={encounterId:'wild-capture-42',
 player:{instanceId:'ci_player_original',creatureId:'crea-loup'},
 opponent:{instanceId:'wild:42',creatureId:'crea_voltik'},
 ...battleSettings};

test('official authored transfers yield native playable 1v1, five authored skills and precise asset IDs',async()=>{
 const f=await factory();
 const out=f.buildEncounter(battle);
 const source=out.nativeCombatSource;
 assert.deepEqual(out.actorIds,['player','opponent']);
 assert.equal(source.battleFormat.localActorId,'player');
 assert.deepEqual(source.skillIdsByActor.player,[
   'claw','fireball','cap_fire_special_1','lib_flame_bite','cap_fire_atk_6'
 ]);
 assert.ok(source.fighterConfigs['crea-loup'].maxHp>0);
 assert.ok(source.fighterConfigs.crea_voltik.maxHp>0);
 const authoredTravel=read('data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json')
   .draft.presentation.visual.travel.assetId;
 const authoredImpact=read('data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json')
   .draft.presentation.visual.impact.assetId;
 assert.equal(source.skillPresentations.cap_fire_special_1.visual.travel.assetId,authoredTravel,
   'the player projectile must be the unmodified authored skill asset');
 assert.equal(source.skillPresentations.lib_flame_bite.visual.impact.assetId,authoredImpact,
   'the impact must not silently revert to an older test-specific animation');
 assert.match(authoredTravel,/^pack:capture:/);
 assert.equal(source.roster.teams.player.activeMemberId,'ci_player_original');
 assert.equal(source.roster.teams.opponent.activeMemberId,'wild:42');
 assert.equal(out.exported.schema,'capture-combat-export-v1');
 assert.ok(out.exported.creatures.some(x=>x.id==='crea_voltik'));
 const {loadCombatLabEngineV1}=await import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
 const engine=await loadCombatLabEngineV1(pathToFileURL(path.resolve(lab)+path.sep));
 const session=engine.createCombatSession({fighters:source.fighters,
   battleFormat:source.battleFormat,skillSpeedMultiplier:source.skillSpeedMultiplier});
 const actualPlayer=source.fighters.find(x=>x.id==='player');
 const actualOpponent=source.fighters.find(x=>x.id==='opponent');
 assert.equal(session.snapshot().fighters.player.hp,actualPlayer.initialHp??actualPlayer.maxHp,
   'native Core initializes authored HP from maxHp when initialHp is omitted');
 assert.equal(session.snapshot().fighters.opponent.hp,actualOpponent.initialHp??actualOpponent.maxHp);
});

test('source is keyed by real authored creature ID and not an implicit fixed demo opponent',async()=>{
 const f=await factory();
 const a=f.buildEncounter(battle);
 const b=f.buildEncounter({...battle,
  player:{instanceId:'ci_2',creatureId:'crea_voltik'},
  opponent:{instanceId:'wild:43',creatureId:'crea-loup'},encounterId:'wild-capture-43'});
 assert.equal(a.nativeCombatSource.battleFormat.actors.find(x=>x.actorId==='opponent').creatureId,'crea_voltik');
 assert.equal(b.nativeCombatSource.battleFormat.actors.find(x=>x.actorId==='opponent').creatureId,'crea-loup');
 assert.notDeepEqual(a.nativeCombatSource.skillIdsByActor.player,b.nativeCombatSource.skillIdsByActor.player);
});

test('absence of authored energy rules, unknown source and invalid actor identities fail closed',async()=>{
 const f=await factory();
 assert.throws(()=>f.buildEncounter({...battle,combatRules:null}),/combatRules|rules/i);
 assert.throws(()=>f.buildEncounter({...battle,opponent:{...battle.opponent,creatureId:'unknown'}}),/creature|catalog/i);
 assert.throws(()=>f.buildEncounter({...battle,opponent:{...battle.opponent,instanceId:'ci_player_original'}}),/instance|duplicate/i);
 assert.throws(()=>f.buildEncounter({...battle,arenaId:''}),/arena/i);
 assert.throws(()=>f.buildEncounter({...battle,skillSpeedMultiplier:0}),/skillSpeedMultiplier|speed/i);
});

test('not a second catalog owner: duplicate creator transfers and missing skill are rejected',async()=>{
 const v=await source();
 await assert.rejects(factory({creatureTransfers:[v.transfers[0],v.transfers[0]]}),/duplicate/i);
 const f=await factory({configuredSkillDrafts:v.skillDrafts.filter(x=>x.id!=='cap_fire_atk_6')});
 assert.throws(()=>f.buildEncounter(battle),/skill|cap_fire_atk_6/);
});

test('producer transfers remain unmodified before and after export',async()=>{
 const v=await source();
 const original=JSON.stringify(v.transfers);
 const f=await factory();
 f.buildEncounter(battle);
 assert.equal(JSON.stringify(v.transfers),original);
});

test('native authored source, existing saved-profile seam and sole Core provider agree on identity and HP',async()=>{
 const v=await source(),f=await factory(),built=f.buildEncounter(battle);
 const profile={creatureTeam:[{
  uid:battle.player.instanceId,entityId:battle.player.creatureId,
  hp:built.nativeCombatSource.fighterConfigs[battle.player.creatureId].maxHp,
  maxHp:built.nativeCombatSource.fighterConfigs[battle.player.creatureId].maxHp,
  activeAbilityIds:[...built.nativeCombatSource.skillIdsByActor.player],
  xp:37,customUserValue:'retain-me'
 }],creatureReserve:[],gold:31};
 let stored=structuredClone(profile),writes=0;
 const context={};vm.runInNewContext(fs.readFileSync(
  path.resolve(__dirname,'../assets/gensrpg/capture/battle-bridge-contract-v1.js'),'utf8'),context);
 const {createCaptureSavedProfileBattleBridgeV1}=await import(
  '../assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs');
 const savedBridge=createCaptureSavedProfileBattleBridgeV1({
  activeHeroId:()=> 'real-capture-hero',
  loadHeroState:()=>structuredClone(stored),
  saveHeroState:(_id,next)=>{stored=structuredClone(next);writes++;},
  readEncounter:()=>({type:'wild',encounterId:battle.encounterId,creatureId:battle.opponent.creatureId}),
  exported:built.exported,adaptCombatExport:v.adapter.adaptCaptureCombatExportStackV1,
  validateBattleResult:context.GensCaptureBattleBridgeContractV1.result
 });
 const ticket=savedBridge.prepareEncounter();
 assert.equal(ticket.snapshot.sides[0].creatures[0].instanceId,battle.player.instanceId);
 assert.equal(ticket.snapshot.sides[0].creatures[0].maxHp,profile.creatureTeam[0].maxHp);
 const {loadCombatLabEngineV1}=await import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
 const {createCombatLabProviderV1}=await import('../assets/gensrpg/capture/combat-lab-provider-v1.mjs');
 const engine=await loadCombatLabEngineV1(pathToFileURL(path.resolve(lab)+path.sep));
 let nextTimer=0;const timers=new Map();
 const clock={
  now:()=>0,
  setTimer(fn,ms){const k=++nextTimer;timers.set(k,{fn,ms});return k;},
  clearTimer(k){timers.delete(k);}
 };
 const provider=createCombatLabProviderV1({
  engine,clock,
  resolveBattle:ctx=>({...ticket.resolveBattle(ctx),aiEnabled:false}),
  mountBattle:()=>({dispose(){}})
 });
 const handle=provider.createBattle({encounterId:ticket.encounterId,snapshot:ticket.snapshot});
 provider.startBattle(handle);
 assert.equal(handle.state().fighters.player.hp,profile.creatureTeam[0].hp);
 assert.equal(handle.flee(),true);
 const result=await handle.completion;
 provider.disposeBattle(handle);
 assert.equal(ticket.applyResult(result).applied,true);
 assert.equal(ticket.applyResult(result),false);
 assert.equal(writes,1);
 assert.equal(stored.creatureTeam[0].uid,battle.player.instanceId);
 assert.equal(stored.creatureTeam[0].customUserValue,'retain-me');
 assert.equal(stored.gold,31);
 assert.equal(timers.size,0,'official Combat runtime timers released');
});

// Data-owned author matrix: verify every published species, not merely a
// static list or a preview dummy. All definitions come from the same pinned Lab.
test('all twelve media-complete pinned Lab author creature transfers export genuine native 1v1 with their own skills', async()=>{
 const official=["crea-loup","crea_ailevent","crea_dracendre","crea_foudrillon","crea_lumilo","crea_maraileron","crea_mossback","crea_ombre_2","crea_scar_2","crea_tox_2","crea_voltik","kitsune_lunaire"];
 const settings=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/capture-lab-authored-preview-settings-v1.json'),'utf8'));
 const transfers=settings.authoredCreatureFiles.map(read);
 assert.equal(transfers.length,12,'only the twelve media-complete official species are deliverable');
 assert.deepEqual(transfers.map(x=>x.draft.id),official,'exact author order and IDs, no aliases or invented entries');
 const visualRoot=process.env.COMBAT_ASSETS_ROOT;
 assert.ok(visualRoot,'Official pinned visual catalog checkout required');
 const visualCatalog=JSON.parse(fs.readFileSync(path.join(visualRoot,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
 const ids=new Set(visualCatalog.assets.map(x=>x.id));
 const allRefs=[];
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
   if(key==='assetId'&&typeof child==='string'&&child.startsWith('pack:capture:'))allRefs.push(child);
   else if(typeof child==='object')visit(child);
  }
 };
 for(const transfer of transfers)visit(transfer.draft.presentation);
 assert.equal(allRefs.filter(id=>!ids.has(id)).length,0,'every published creature visual must exist at the pinned SHA');
 const kitsune=transfers.find(x=>x.draft.id==='kitsune_lunaire');
 assert.ok(kitsune,'the approved Kitsune must be present in the exact official source');
 const attackBackId=kitsune.draft.presentation.visual.rangedAttackBack.assetId;
 assert.equal(attackBackId,'pack:capture:creature-lunaire-attack-player-8-v1');
 const atlas=visualCatalog.assets.find(x=>x.id===attackBackId);
 assert.ok(atlas,'approved Kitsune 8-frame atlas must exist at the pinned visual SHA');
 assert.equal(atlas.resource.frameCount,8,'never silently downgrade the approved 8-frame author atlas');
 const expectedSkills=['teleport-strike','Onde Spirituel','fleche_spirituel','aura-lunaire','Sacrifice_kitsune'];
 assert.deepEqual(kitsune.loadout.slots.map(slot=>slot.skillId),expectedSkills);
 for(const skillId of expectedSkills){
  const authoredSkill=read('data/capture/showcase/'+skillId+'.capture-skill-transfer-v1.json');
  assert.equal(authoredSkill.draft.id,skillId,'native skill ID must be the real Labo author ID');
  visit(authoredSkill.draft.presentation);
 }
 assert.deepEqual(allRefs.filter(id=>!ids.has(id)),[],
  'all approved Kitsune skill visuals must resolve at the same pinned catalog SHA');
 const author=await factory({creatureTransfers:transfers});
 for(const creatureId of official){
  const opponent=creatureId==='crea-loup'?'crea_voltik':creatureId;
  const built=author.buildEncounter({...battle,
   encounterId:'real-author-'+creatureId,
   opponent:{instanceId:'wild-'+creatureId,creatureId:opponent}
  });
  const source=built.nativeCombatSource;
  const exported=built.exported.creatures.find(x=>x.id===opponent);
  assert.ok(exported,opponent+' official author missing');
  assert.ok(source.fighterConfigs[opponent]?.maxHp>0,opponent+' native HP missing');
  assert.equal(source.battleFormat.actors.find(x=>x.actorId==='opponent').creatureId,opponent);
  assert.equal(source.skillIdsByActor.opponent.length,5,opponent+' five authored abilities required');
  assert.ok(source.skillIdsByActor.opponent.every(id=>source.skills[id]),opponent+' official skills not imported');
  assert.ok(exported.presentationId&&built.exported.presentation.creatures[exported.presentationId]?.visual?.front?.assetId,
   opponent+' official face sprite missing');
 }
});


// C2 native team author projection: the same pinned Lab exporter, never a new
// combat engine or a substitute 2v2 simulation. No public team activation yet.
const twoSideActors=Object.freeze({
 playerTeam:Object.freeze([
  Object.freeze({instanceId:'capture:first',creatureId:'crea-loup'}),
  Object.freeze({instanceId:'capture:second',creatureId:'crea_mossback'})
 ]),
 opponentTeam:Object.freeze([
  Object.freeze({instanceId:'wild:first',creatureId:'crea_voltik'}),
  Object.freeze({instanceId:'wild:second',creatureId:'kitsune_lunaire'})
 ])
});
const authorizedTeamCatalog=()=>JSON.parse(fs.readFileSync(
 path.resolve(__dirname,'fixtures/capture-lab-authored-preview-settings-v1.json'),'utf8'
)).authoredCreatureFiles.map(read);

test('RED then GREEN: two authored active creatures per camp export through the actual pinned Lab 2v2 battle contract',async()=>{
 const f=await factory({creatureTransfers:authorizedTeamCatalog()});
 const before=JSON.stringify(twoSideActors);
 const result=f.buildEncounter({encounterId:'native-authored-2v2',
  ...battleSettings,...twoSideActors});
 const src=result.nativeCombatSource;
 assert.deepEqual(result.actorIds,['player','ally','opponent','opponent-b'],
  'the only supported native slot order is local, allied, enemy 1 and enemy 2');
 assert.deepEqual(src.battleFormat.teams['capture-team'],['player','ally']);
 assert.deepEqual(src.battleFormat.teams['wild-team'],['opponent','opponent-b']);
 assert.equal(src.battleFormat.localActorId,'player');
 assert.equal(src.battleFormat.actors.length,4);
 assert.equal(src.fighters.length,4);
 for(const [id,creatureId,instanceId] of [
  ['player','crea-loup','capture:first'],['ally','crea_mossback','capture:second'],
  ['opponent','crea_voltik','wild:first'],['opponent-b','kitsune_lunaire','wild:second']
 ]){
  assert.equal(src.battleFormat.actors.find(a=>a.actorId===id)?.creatureId,creatureId);
  assert.equal(src.roster.teams[id]?.activeMemberId,instanceId);
  assert.equal(src.roster.teams[id]?.members.length,1);
  assert.equal(src.roster.teams[id]?.members[0].creatureId,creatureId);
  assert.equal(src.skillIdsByActor[id]?.length,5,'authored creature must retain its real five skills');
  assert.ok(src.skillIdsByActor[id].every(skillId=>src.skills[skillId]),
   'native Core must resolve every real authored skill');
  assert.equal(src.fighters.find(x=>x.id===id)?.maxHp,src.fighterConfigs[creatureId]?.maxHp);
 }
 const {loadCombatLabEngineV1}=await import('../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
 const engine=await loadCombatLabEngineV1(pathToFileURL(path.resolve(lab)+path.sep));
 const session=engine.createCombatSession({fighters:src.fighters,
  battleFormat:src.battleFormat,skillSpeedMultiplier:src.skillSpeedMultiplier});
 engine.createRosterSession({combatSession:session,roster:src.roster,
  fighterConfigs:src.fighterConfigs,battleFormat:src.battleFormat});
 for(const actorId of result.actorIds){
  assert.ok(session.snapshot().fighters[actorId]?.hp>0,
   'all four actors must be instantiated by the real pinned Combat Core');
 }
 assert.equal(JSON.stringify(twoSideActors),before,'source must never mutate team inputs');
});

test('2v2 author projection rejects incomplete, ambiguous, duplicate or reserve-unsafe teams without fallback',async()=>{
 const f=await factory({creatureTransfers:authorizedTeamCatalog()});
 const ok={encounterId:'native-authored-2v2',...battleSettings,...twoSideActors};
 assert.throws(()=>f.buildEncounter({...ok,opponentTeam:[ok.opponentTeam[0]]}),/same|equal|two|2v2|team|slots/i);
 assert.throws(()=>f.buildEncounter({...ok,player:battle.player}),/ambiguous|exclusive|both|team/i);
 assert.throws(()=>f.buildEncounter({...ok,playerTeam:[ok.playerTeam[0],ok.playerTeam[0]]}),/duplicate|instance/i);
 assert.throws(()=>f.buildEncounter({...ok,playerTeam:[ok.playerTeam[0],{...ok.playerTeam[1],instanceId:'wild:first'}]}),/duplicate|instance/i);
 assert.throws(()=>f.buildEncounter({...ok,opponentTeam:[{...ok.opponentTeam[0],creatureId:'unknown'},ok.opponentTeam[1]]}),/unknown|creature|catalog/i);
 assert.throws(()=>f.buildEncounter({...ok,playerTeam:[{...ok.playerTeam[0],reserve:[{instanceId:'hidden',creatureId:'crea-loup'}]},ok.playerTeam[1]]}),/reserve|unsupported/i);
 assert.throws(()=>f.buildEncounter({...ok,playerTeam:[ok.playerTeam[0],ok.playerTeam[1],ok.playerTeam[0]]}),/team|slots|2v2/i);
});
