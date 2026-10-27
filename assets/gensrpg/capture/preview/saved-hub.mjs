import {loadCombatLabEngineV1,COMBAT_LAB_SOURCE_V1} from '../combat-lab-engine-loader-v1.mjs';
import {createCombatLabProviderV1} from '../combat-lab-provider-v1.mjs';
import {createCaptureLabAuthoredSourceV1} from '../combat-lab-authored-source-v1.mjs';
import {createCaptureWorldLabWildTransactionV1} from '../capture-world-lab-wild-transaction-v1.mjs';
import {createCaptureLabHubBattleCommandV1} from '../capture-lab-hub-battle-command-v1.mjs';

// Opt-in isolated visual preview. The original, byte-identical World and
// team-roster scripts are loaded by the HTML and do ALL persistent writes.
// Lab author transfer+exporter and native Core execute from immutable sources.
const status=document.getElementById('hub-status');
const worldLabel=document.getElementById('hub-location');
const profileLabel=document.getElementById('hub-profile');
const battleButton=document.getElementById('hub-battle');
const newButton=document.getElementById('hub-new');
const abortButton=document.getElementById('hub-abort');
const battleHost=document.getElementById('live-battle');
const root=new URL('../../../..',import.meta.url); // never used as a media/version authority
const generated=new URL('./assets/gensrpg/capture/preview/generated/',document.baseURI);
const vendor=new URL('./vendor/combat-lab/',document.baseURI);
const getJson=async(relative)=>{
 const response=await fetch(new URL(relative,generated),{cache:'no-store'});
 if(!response.ok)throw new Error('Source Lab indisponible : '+relative);
 return response.json();
};
let command=null,settings=null;
function setStatus(message,{ready, outcome, incompatible, error}={}){
 status.textContent=message;
 if(ready!==undefined)status.dataset.ready=String(ready);
 if(outcome!==undefined)status.dataset.outcome=outcome;
 if(incompatible!==undefined)status.dataset.incompatible=String(incompatible);
 if(error!==undefined)status.dataset.error=String(error);
}
function refresh(){
 const world=captureWorldState();
 const saved=loadState('trainer-preview'),member=saved?.creatureTeam?.[0];
 worldLabel.textContent='📍 '+world.locationName+' · Jour '+world.day+' · Tour '+world.turnIndex+
  ' · Rencontre '+(world.last?.type==='wild'?world.last.creatureId:'terminée');
 profileLabel.textContent='Loup volcanique · PV '+(member?.hp??'—')+' / '+(member?.maxHp??'—');
 const running=command?.status().phase==='running';
 battleButton.disabled=running||world.last?.type!=='wild';
 newButton.disabled=running;
 abortButton.hidden=!running;
}
function portrait(actor,exported,catalog,metadata,source){
 const creature=exported.creatures.find(c=>c.id===actor.creatureId);
 const binding=exported.presentation?.creatures?.[creature?.presentationId];
 const visual=actor.actorId===source.battleFormat.localActorId?binding?.visual?.back:binding?.visual?.front;
 if(!visual?.assetId)throw new Error('Visuel auteur manquant : '+actor.creatureId);
 const media=globalThis.GensAssetResolverV1.resolveCaptureLabAsset({
  catalog,assetId:visual.assetId,commit:metadata.assetsSha,
  approvedCommit:metadata.assetsSha,approvedRepository:metadata.assetsRepository
 });
 const image=document.createElement('img');
 image.src=media.url;image.alt='Visuel officiel de '+actor.displayName;
 image.dataset.authorAssetId=visual.assetId;
 image.decoding='async';
 return image;
}
function makeBattleView({catalog,metadata,buildFromTicket}){
 return function mountBattle(battle,context){
  const authored=buildFromTicket(context);
  const source=authored.nativeCombatSource;
  const arena=document.createElement('div');arena.className='hub-fighters';
  const cards=source.battleFormat.actors.map(actor=>{
   const card=document.createElement('article');card.className='hub-fighter';
   const heading=document.createElement('h2');heading.textContent=actor.displayName;
   const img=portrait(actor,authored.exported,catalog,metadata,source);
   const hp=document.createElement('p'),meter=document.createElement('progress'),energy=document.createElement('p');
   meter.setAttribute('aria-label','PV de '+actor.displayName);
   if(actor.actorId===source.battleFormat.localActorId)energy.dataset.playerEnergy='true';
   card.append(heading,img,hp,meter,energy);arena.append(card);
   return {id:actor.actorId,hp,meter,energy};
  });
  const message=document.createElement('p');message.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='actions';
  for(const skill of battle.skills()){
   const button=document.createElement('button');button.type='button';button.textContent=skill.name;
   button.addEventListener('click',()=>{
    try{const result=battle.useSkill(skill.id);message.textContent=result.ok?'Action en préparation…':'Action indisponible pour le moment.';}
    catch(error){message.textContent='Combat interrompu : '+error.message;}
   });actions.append(button);
  }
  const flee=document.createElement('button');flee.type='button';flee.textContent='Fuir';
  flee.addEventListener('click',()=>battle.flee());actions.append(flee);
  battleHost.hidden=false;battleHost.replaceChildren(arena,message,actions);
  return Object.freeze({
   render(state){
    for(const card of cards){
     const fighter=state.fighters[card.id];
     card.hp.textContent='PV '+fighter.hp+' / '+fighter.maxHp;
     card.meter.max=fighter.maxHp;card.meter.value=fighter.hp;
     card.energy.textContent='Énergie '+fighter.energy+' / '+fighter.maxEnergy;
    }
   },
   dispose(){battleHost.replaceChildren();battleHost.hidden=true;}
  });
 };
}
try{
 const [engine,inputs,catalog,metadata]=await Promise.all([
  loadCombatLabEngineV1(vendor),
  getJson('author-inputs.json'),
  getJson('global-visual-assets.json'),
  getJson('source.json')
 ]);
 if(inputs.schema!=='gensrpg-capture-lab-author-inputs-v1'||
   inputs.sourceSha!==COMBAT_LAB_SOURCE_V1.sha||
   metadata.combatSha!==COMBAT_LAB_SOURCE_V1.sha||
   metadata.schema!=='gensrpg-capture-lab-authored-preview-source-v1'||
   !globalThis.GensAssetResolverV1?.resolveCaptureLabAsset){
  throw new Error('Sources officielles Labo/visuels non validées.');
 }
 const lab=await Promise.all([
  'src/contracts/capture-creature-transfer-v1.js',
  'src/contracts/capture-skill-editor-draft-v1.js',
  'src/adapters/input/capture/capture-combat-rules-overlay-v1.js',
  'src/adapters/input/capture/capture-editor-exporter-v3.js',
  'src/adapters/input/capture/capture-export-adapter-stack-v1.js'
 ].map(relative=>import(new URL(relative,vendor).href)));
 const [creature,skillDraft,rules,exporter,adapter]=lab;
 const author=createCaptureLabAuthoredSourceV1({
  normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
  normalizeSkillDraft:skillDraft.normalizeCaptureSkillEditorDraftV1,
  overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
  exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
  adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
  statRegistry:inputs.statRegistry,
  configuredSkillDrafts:inputs.configuredSkillDrafts,
  creatureTransfers:inputs.creatureTransfers
 });
 const previewCreatureId=metadata.expectedPlayer,previewWildId=metadata.expectedOpponent;
 const official=author.buildEncounter({
  ...inputs.battleSettings,encounterId:metadata.encounter,
  player:{instanceId:metadata.playerInstanceId,creatureId:previewCreatureId},
  opponent:{instanceId:metadata.opponentInstanceId,creatureId:previewWildId}
 });
 const source=official.nativeCombatSource,player=source.fighterConfigs[previewCreatureId];
 if(!player||!source.skillIdsByActor?.player?.length)throw new Error('Labo auteur : joueur incomplet');
 globalThis.capturePreviewEntities=official.exported.creatures.map(c=>({
  id:c.id,name:c.displayName,hp:c.combat.maxHp,abilityIds:[...c.skillIds]
 }));
 const heroId=captureActiveHeroId();
 if(!localStorage.getItem(key(heroId))){
  saveHeroCreatureState(heroId,{
   creatureTeam:[{
    uid:metadata.playerInstanceId,entityId:previewCreatureId,
    hp:player.maxHp,maxHp:player.maxHp,
    knownAbilityIds:[...source.skillIdsByActor.player],
    activeAbilityIds:[...source.skillIdsByActor.player],
    level:1,xp:0,customField:'retain-source-owner'
   }],
   creatureReserve:[],gold:42,inventory:[{id:'creator-leaf',qty:1}],
   creatorNote:'Ma forêt du créateur'
  });
 }
 const world=captureWorldState();
 if(!world.locationId && !world.last){
  saveCaptureWorldState({
   ...world,locationId:'cap_forest',locationName:'Ma forêt du créateur',
   day:9,turnIndex:2,playMode:'turns',
   last:{type:'wild',creatureId:previewWildId,text:'Rencontre sauvage dans ma forêt du créateur'}
  });
 }
 const transaction=createCaptureWorldLabWildTransactionV1({
  activeHeroId:()=>captureActiveHeroId(),
  loadHeroState:id=>loadState(id),
  saveHeroState:(id,next)=>{
   // Count only calls to the real owner, never wrap or shadow storage.
   saveHeroCreatureState(id,next);
   globalThis.capturePreviewHeroWrites++;
  },
  readWorldState:()=>captureWorldState(),
  saveWorldState:next=>saveCaptureWorldState(next),
  consumeWildEncounter:reason=>captureConsumeWildEncounter(reason),
  worldStorageKey:()=>captureWorldKey(),
  nextEncounterId:()=> 'capture'+crypto.randomUUID().replaceAll('-',''),
  authoredSource:author,readBattleSettings:()=>inputs.battleSettings,
  adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
  validateBattleResult:globalThis.GensCaptureBattleBridgeContractV1.result
 });
 const nativeForTicket=context=>{
  const s=context?.snapshot;
  const local=s?.sides?.[0]?.creatures?.[0],wild=s?.sides?.[1]?.creatures?.[0];
  if(!local||!wild)throw new TypeError('Combat snapshot Capture manquant');
  return author.buildEncounter({
   ...inputs.battleSettings,encounterId:context.encounterId,
   player:{creatureId:local.creatureId,instanceId:local.instanceId},
   opponent:{creatureId:wild.creatureId,instanceId:wild.instanceId}
  });
 };
 command=createCaptureLabHubBattleCommandV1({
  transaction,combatPort:globalThis.GensCaptureLabOwnershipPortV1,
  engine,createProvider:createCombatLabProviderV1,
  mountBattle:makeBattleView({catalog,metadata,buildFromTicket:nativeForTicket}),
  onReturn:event=>{
   refresh();
   setStatus(event.cancelled?'Rencontre interrompue.':({
    victory:'Victoire ! Rencontre enregistrée.',
    defeat:'Ton compagnon est KO. Rencontre enregistrée.',
    flee:'Tu as fui. Rencontre enregistrée.'
   }[event.outcome]??'Rencontre terminée.'),{ready:true,
    outcome:event.outcome??'cancelled',error:false,incompatible:false});
  },
  onError:event=>{
   refresh();
   setStatus('Le résultat n’a pas été effacé : '+String(event.error?.message||event.error),
    {ready:true,error:true,incompatible:false});
  }
 });
 battleButton.addEventListener('click',()=>{
  try{
   const wild=captureWorldState().last;
   if(wild?.type!=='wild')throw new Error('Aucune rencontre sauvage disponible.');
   command.startWildBattle(wild.creatureId);
   status.dataset.outcome='running';
   setStatus('Combat officiel en cours.',{incompatible:false,error:false});
   refresh();
  }catch(error){
   refresh();
   const text=String(error?.message||error);
   setStatus('Combat non démarré : '+text,{incompatible:/incompatible|loadout|skill|catalog|team|1v1|HP|roster/i.test(text),error:true});
  }
 });
 newButton.addEventListener('click',()=>{
  if(command.status().phase==='running')return;
  const ws=captureWorldState();
  saveCaptureWorldState({...ws,last:{
   type:'wild',creatureId:previewWildId,text:'Nouvelle rencontre créée par le World owner Capture'
  }});
  refresh();setStatus('Rencontre sauvage prête.',{ready:true,outcome:'none',incompatible:false,error:false});
 });
 abortButton.addEventListener('click',()=>command.cancel());
 refresh();
 setStatus('Rencontre sauvage prête : un seul moteur officiel.',{ready:true,outcome:'none',incompatible:false,error:false});
 addEventListener('pagehide',event=>{
  if(event.persisted)return;
  try{command?.dispose();}catch(error){
   // A partially committed save must remain observable, not be silently discarded.
   console.error('Capture World commit still pending',error);
  }
 });
}catch(error){
 setStatus('Échec de chargement : '+String(error.message||error),{error:true,ready:false});
}
