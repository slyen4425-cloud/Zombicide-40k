'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const lab=process.env.COMBAT_LAB_ROOT;
const PIN='65e21792ff74aea9862e528c8dbfdb22797b6693';
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
