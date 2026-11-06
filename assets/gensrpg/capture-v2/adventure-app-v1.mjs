// GenSrpg Capture V2 UI: configuration/session presentation only.
// Bestiary publication is computed by the SAME official Combat main function.
// The only gameplay model lives in adventure-contract-v1.mjs (not DOM).
import {captureBestiaryCardsV1} from '../../../vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js';
import {readWorldAssemblerDraft} from '../../../vendor/exploration-lab/src/builder/world-assembler-handoff.js';
import {
 createNewExplorationPlay,readExplorationPlay
} from '../../../vendor/exploration-lab/src/play/exploration-play-session.js';
import {readCombatHandoff} from '../../../vendor/exploration-lab/src/encounters/combat-handoff-store.js';
import {connectAdventureCombatHostV1} from './adventure-combat-host-v1.mjs';
import {startAdventureExplorationV1} from './adventure-play-bridge-v1.mjs';
import {createAdventureRulesDraftStoreV1} from './adventure-rules-draft-v1.mjs';
import {adventurePlaySheetSnapshotV1} from './adventure-play-sheet-v1.mjs';
import {publishedCapturePortraitUrlV1} from './adventure-sheet-visual-v1.mjs';
import {renderAdventureSheetViewV1} from './adventure-play-sheet-view-v1.mjs';
import {createAdventureCreatorDraftStoreV1} from './adventure-creator-draft-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from './adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from './adventure-playing-party-grant-v1.mjs';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1,normalizeAdventureRulesV1,calculateAdventureXpV1,
 createAdventureSessionV1,createAdventureStoreV1,publishedAdventureSpeciesV1,
 coreAdventureProgressionConfigV1,availableAdventureStatPointsV1,
 allocateAdventureStatPointsV1,updateAdventureSessionControlV1,
 initializeAdventureSessionControlV1
} from './adventure-contract-v1.mjs';

const $=id=>document.getElementById(id);
const status=$('adventure-status');
const idField={
 base:'adventure-xp-base',bonus:'adventure-xp-bonus',penalty:'adventure-xp-penalty',
 global:'adventure-xp-global',level:'adventure-xp-level',max:'adventure-level-max',
 statPoints:'adventure-stat-points-per-level',xpMode:'adventure-xp-mode',
 currency:'adventure-currency',hpPercent:'adventure-combat-hp-percent',
 heroEnabled:'adventure-hero-xp-enabled',heroShare:'adventure-hero-xp-share',
 heroXpLevel:'adventure-hero-xp-per-level',heroMax:'adventure-hero-max-level',
 heroTalent:'adventure-hero-talent-points'
};
let rules=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
let published=[];
let officialCombatSha=null,officialStatRegistry=null;
let store,draftStore,creatorDraftStore;
const text=(node,value)=>{node.textContent=String(value);};
const stateMessage=(message,error=false)=>{
 text(status,message);status.dataset.error=String(error);
};
const numberFrom=id=>{
 const raw=$(id).value.trim();
 if(!raw)throw new RangeError(id+' : renseigne une valeur');
 return Number(raw);
};
function readXpBandRows(){
 return [...$('adventure-xp-bands').querySelectorAll('.xp-band-row')].map(row=>{
  const throughLevel=Number(row.querySelector('[data-xp-band-to]').value);
  const xpPerLevel=Number(row.querySelector('[data-xp-band-cost]').value);
  return {throughLevel,xpPerLevel};
 });
}
function renderXpBandRows(bands){
 const host=$('adventure-xp-bands');host.replaceChildren();
 for(const band of bands){
  const row=document.createElement('div');row.className='xp-band-row';
  const end=document.createElement('label');end.textContent="Jusqu'au niveau";
  const upper=document.createElement('input');upper.type='number';upper.min=2;
  upper.step=1;upper.value=band.throughLevel;upper.dataset.xpBandTo='1';
  const cost=document.createElement('label');cost.textContent="XP par niveau";
  const xp=document.createElement('input');xp.type='number';xp.min=1;xp.max=1000000000;
  xp.step=1;xp.value=band.xpPerLevel;xp.dataset.xpBandCost='1';
  const remove=document.createElement('button');remove.type='button';
  remove.textContent='Retirer';remove.disabled=bands.length===1;
  remove.addEventListener('click',()=>{
   if(host.querySelectorAll('.xp-band-row').length<=1)return;
   row.remove();
   const remaining=host.querySelectorAll('.xp-band-row');
   for(const other of remaining)
    other.querySelector('button').disabled=remaining.length<=1;
   updatePreview();
  });
  upper.addEventListener('input',updatePreview);
  xp.addEventListener('input',updatePreview);
  end.append(upper);cost.append(xp);
  row.append(end,cost,remove);host.append(row);
 }
}
// Increasing the level cap extends the final XP bracket visibly. Lowering
// the cap never silently deletes an authored tier; the normalizer will explain
// conflicting ranges and the creator can adjust them.
function extendFinalXpBandToCap(){
 if($(idField.xpMode).value!=='custom')return;
 const max=numberFrom(idField.max);
 if(!Number.isSafeInteger(max)||max<2)return;
 const rows=$('adventure-xp-bands').querySelectorAll('.xp-band-row');
 const last=rows[rows.length-1]?.querySelector('[data-xp-band-to]');
 if(last&&max>Number(last.value)){last.value=max;updatePreview();}
}
function toggleXpMode(){
 const custom=$(idField.xpMode).value==='custom';
 $('adventure-xp-bands-panel').hidden=!custom;
 $(idField.level).disabled=custom;
}
function setSessionControlFields(saved){
 const value=saved?.sessionControl??(!saved?creatorDraftStore?.load():null);
 const permissions=value?.guestPermissions??DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1;
 $('adventure-gm-enabled').checked=value?.hostIsGameMaster??false;
 $('adventure-join-enabled').checked=value?.joinEnabled??false;
 $('adventure-guest-edit-progression').checked=permissions.editProgression;
 $('adventure-guest-edit-rewards').checked=permissions.editRewards;
 $('adventure-guest-edit-world').checked=permissions.editWorld;
 $('adventure-guest-allocate-stats').checked=permissions.allocateOwnCreatureStats;
 $('adventure-save-control').disabled=false;
 $('adventure-save-control').textContent=saved?'Enregistrer les choix du créateur'
  :'Enregistrer les choix avant la première partie';
}
function sessionControlFromFields(){
 return {
  hostIsGameMaster:$('adventure-gm-enabled').checked,
  joinEnabled:$('adventure-join-enabled').checked,
  guestPermissions:{
   editProgression:$('adventure-guest-edit-progression').checked,
   editRewards:$('adventure-guest-edit-rewards').checked,
   editWorld:$('adventure-guest-edit-world').checked,
   allocateOwnCreatureStats:$('adventure-guest-allocate-stats').checked
  }
 };
}
function renderStatWallet(){
 const rows=$('adventure-stat-rows'),availableLabel=$('adventure-stat-points-left');
 rows.replaceChildren();
 const current=store?.load();
 if(!current){
  text(availableLabel,'Crée une partie pour connaître tes points disponibles.');
  return;
 }
 if(officialStatRegistry?.schema!=='capture-stat-registry-v1'||
    !Array.isArray(officialStatRegistry.stats))
  throw new Error('Registre officiel Combat indisponible pour la répartition');
 const available=availableAdventureStatPointsV1(current);
 text(availableLabel,available+' point(s) disponibles · '+
  (current.rules.progression.statPointsPerLevel??0)+' par niveau');
 for(const stat of officialStatRegistry.stats){
  const line=document.createElement('div');line.className='rule-row';
  const value=current.party.active.statAllocations?.[stat.id]??0;
  const label=document.createElement('span');
  label.textContent=stat.label+' · +'+value;
  const actions=document.createElement('div');actions.className='actions';
  for(const points of [1,5]){
   const button=document.createElement('button');button.type='button';
   button.textContent='+'+points;
   button.disabled=available<points;
   button.setAttribute('aria-label','Attribuer '+points+' point(s) en '+stat.label);
   button.addEventListener('click',guarded(()=>{
    const saved=store.load();
    const changed=allocateAdventureStatPointsV1({
     session:saved,registry:officialStatRegistry,statId:stat.id,
     points,now:new Date().toISOString()
    });
    store.save(changed);
    showSave();
    stateMessage(points+' point(s) attribués en '+stat.label+'. Sauvegarde mise à jour.');
   }));
   actions.append(button);
  }
  line.append(label,actions);rows.append(line);
 }
}
function setFields(value){
 $(idField.base).value=value.xp.baseVictoryXp;
 $(idField.bonus).value=value.xp.higherEnemyBonusPercent;
 $(idField.penalty).value=value.xp.higherAllyPenaltyPercent;
 $(idField.global).value=value.xp.globalMultiplier;
 $(idField.level).value=value.progression.xpPerLevel;
 $(idField.max).value=value.progression.maxLevel;
 $(idField.xpMode).value=value.progression.xpCurveMode;
 $(idField.statPoints).value=value.progression.statPointsPerLevel??0;
 $(idField.currency).value=value.loot.currencyPerVictory;
 $(idField.hpPercent).value=100*value.combat.hpMultiplier;
 renderXpBandRows(value.progression.xpBands??SHOWCASE_ADVENTURE_RULES_V1.progression.xpBands);
 toggleXpMode();
 $(idField.heroEnabled).checked=value.heroProgression.enabled;
 $(idField.heroShare).value=value.heroProgression.xpGainPercent;
 $(idField.heroXpLevel).value=value.heroProgression.xpPerLevel;
 $(idField.heroMax).value=value.heroProgression.maxLevel;
 $(idField.heroTalent).value=value.heroProgression.talentPointsPerLevel;
}
function fromFields(){
 return normalizeAdventureRulesV1({
  ...rules,
  xp:{...rules.xp,baseVictoryXp:numberFrom(idField.base),
   higherEnemyBonusPercent:numberFrom(idField.bonus),
   higherAllyPenaltyPercent:numberFrom(idField.penalty),
   globalMultiplier:numberFrom(idField.global)},
  progression:{xpCurveMode:$(idField.xpMode).value,
   xpPerLevel:numberFrom(idField.level),maxLevel:numberFrom(idField.max),
   statPointsPerLevel:numberFrom(idField.statPoints),
   ...($(idField.xpMode).value==='custom'?{xpBands:readXpBandRows()}: {})},
  loot:{...rules.loot,currencyPerVictory:numberFrom(idField.currency)},
  combat:{hpMultiplier:numberFrom(idField.hpPercent)/100},
  heroProgression:{...rules.heroProgression,
   enabled:$(idField.heroEnabled).checked,
   xpGainPercent:numberFrom(idField.heroShare),
   xpPerLevel:numberFrom(idField.heroXpLevel),
   maxLevel:numberFrom(idField.heroMax),
   talentPointsPerLevel:numberFrom(idField.heroTalent)}
 });
}
async function fetchJson(relative){
 const url=new URL(relative,import.meta.url);
 const result=await fetch(url,{cache:'no-store'});
 if(!result.ok)throw new Error('Source officielle indisponible (HTTP '+result.status+') : '+url.pathname);
 return result.json();
}
async function fetchPublishedBestiary(){
 // A single Combat source: same captureBestiaryCardsV1 publication predicate,
 // same Showcase transfers and skill definitions; immutable visual catalog as
 // certified in the GenSrpg Pages release, never a moving global-assets branch.
 const [bundle,assets,stats,skills,delivery]=await Promise.all([
  fetchJson('../../../vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json'),
  fetchJson('../../../vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json'),
  fetchJson('../../../vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json'),
  fetchJson('../../../vendor/combat-lab/data/combat/skills/catalog.v1.json'),
  fetchJson('./delivery-manifest.json')
 ]);
 if(bundle.schema!=='capture-author-encounter-bundle-v1'||
   bundle.authorSha!==delivery?.combat?.sha||
   bundle.engineSha!==delivery.combat.sha)
  throw new Error('Bestiaire: transferts incompatibles avec la version Combat officielle publiée');
 return Object.freeze({
  cards:publishedAdventureSpeciesV1(captureBestiaryCardsV1({
   creatureTransfers:bundle.creatureTransfers,
   skillTransfers:bundle.skillTransfers,
   assetCatalog:assets,statRegistry:stats,nativeSkills:skills.entries??[]
  })),
  combatSha:delivery.combat.sha,
  statRegistry:stats
 });
}
function option(value,caption,disabled=false){
 const o=document.createElement('option');
 o.value=value;o.textContent=caption;o.disabled=disabled;return o;
}
function eligibleForNewGame(card){
 return Array.isArray(card.skills)&&card.skills.some(s=>s.state==='ready');
}
function fillPublicSpecies(){
 const starters=$('adventure-starter'),enemies=$('adventure-enemy'),drops=$('adventure-drop-species');
 starters.replaceChildren(option('','Choisir une créature publiée…'));
 enemies.replaceChildren();drops.replaceChildren();
 for(const card of published){
  const playable=eligibleForNewGame(card);
  starters.append(option(card.id,card.name+(playable?'':' · capacité non prête'),!playable));
  enemies.append(option(card.id,card.name));
  drops.append(option(card.id,card.name));
 }
 const allowed=published.filter(eligibleForNewGame).length;
 text($('adventure-bestiary-count'),published.length+' créature(s) dans le Bestiaire · '+
  allowed+' avec au moins une capacité utilisable');
 starters.disabled=enemies.disabled=drops.disabled=published.length===0;
 $('adventure-create').disabled=allowed===0;
 if(allowed)starters.value=published.find(eligibleForNewGame).id;
}
function row(caption,remove){
 const holder=document.createElement('div');holder.className='rule-row';
 const span=document.createElement('span');span.textContent=caption;
 const btn=document.createElement('button');btn.type='button';btn.textContent='Supprimer';
 btn.addEventListener('click',remove);
 holder.append(span,btn);
 return holder;
}
function renderItemRules(){
 const itemList=$('adventure-items'),dropList=$('adventure-drops');
 itemList.replaceChildren(...(rules.loot.items.length?rules.loot.items.map(item=>
  row(item.name+' · '+item.saleValue+' pièces',()=>{
   const items=rules.loot.items.filter(i=>i.id!==item.id);
   const drops=rules.loot.drops.filter(d=>d.itemId!==item.id);
   rules=normalizeAdventureRulesV1({...rules,loot:{...rules.loot,items,drops}});
   renderItemRules();updatePreview();
  })): [document.createTextNode('Aucun objet défini.')]));
 const itemSelect=$('adventure-drop-item');itemSelect.replaceChildren();
 for(const item of rules.loot.items)itemSelect.append(option(item.id,item.name));
 $('adventure-drop-add').disabled=!published.length||!rules.loot.items.length;
 dropList.replaceChildren(...(rules.loot.drops.length?rules.loot.drops.map((drop,index)=>
  row((published.find(c=>c.id===drop.speciesId)?.name??drop.speciesId)+
   ' → '+(rules.loot.items.find(i=>i.id===drop.itemId)?.name??drop.itemId)+
   ' · '+drop.chancePercent+' % · '+drop.minQuantity+'–'+drop.maxQuantity,()=>{
    rules=normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
     drops:rules.loot.drops.filter((_,i)=>i!==index)}});
    renderItemRules();
   })): [document.createTextNode('Aucun drop : aucune récompense aléatoire implicite.')]));
}
function showSave(){
 try{
  const state=store.load();
  if(!state){
   text($('adventure-save-summary'),'Aucune partie créée.');
   $('adventure-play').disabled=true;
   renderStatWallet();
   return;
  }
  $('adventure-play').disabled=false;
  $('adventure-play').textContent=state.status==='playing'?'Continuer la partie':'Entrer dans le monde';
  const card=published.find(c=>c.id===state.party.active.speciesId);
  const a=state.party.active;
  const reward=state.lastAward;
  text($('adventure-save-summary'),
   'Partie '+state.sessionId.slice(0,8)+' · '+(card?.name??a.speciesId)+
   ' · niveau '+a.level+' · '+a.xp+' XP · '+state.inventory.currency+' pièces'+
   (state.rules.heroProgression?.enabled===true
    ?' · Héros niv. '+(state.hero?.progression?.level??1)+' · '+
      (state.hero?.progression?.xp??0)+' XP'
    :' · Héros sans niveau')+
   (reward?' · Dernier combat : '+reward.outcome+' ('+reward.xp+' XP)':'')+
   ' · statut : '+(state.status==='configured'?'configuration enregistrée':'en cours'));
  renderStatWallet();
 }catch(error){
  $('adventure-play').disabled=true;
  stateMessage('Sauvegarde protégée : '+error.message,true);
 }
}
function updatePreview(){
 try{
  const enemy=published.find(c=>c.id===$('adventure-enemy').value);
  if(!enemy){text($('adventure-xp-preview'),'Aucun ennemi publié sélectionné.');return;}
  const settings=fromFields();
  const saved=store?.load();
  const allyLevel=saved?.party?.active?.level??1;
  const xp=calculateAdventureXpV1({rules:settings,allyLevel,enemyLevel:enemy.level});
  text($('adventure-xp-preview'),'Allié niv. '+allyLevel+' / '+enemy.name+
   ' niv. '+enemy.level+' : '+xp.xp+' XP · écart '+xp.levelGap+
   ' · multiplicateur '+xp.levelFactor.toFixed(2)+
   '. Ce calcul est un aperçu, aucun butin n’est attribué.');
 }catch(error){
  text($('adventure-xp-preview'),'Réglage invalide : '+error.message);
 }
}
function guarded(callback){
 return ()=>{
  try{callback();}catch(error){stateMessage(error.message,true);}
 };
}
// The Exploration iframe remains mounted; only this Capture-owned view
// consumes the already persisted AdventureSession. No second player state.
let activePlayingSheet=null;
let currentSheetTab='hero';
let currentHeroVisual=null;
let heroImageEpoch=0;
function discardHeroVisual(){
 ++heroImageEpoch;
 if(currentHeroVisual?.url)URL.revokeObjectURL(currentHeroVisual.url);
 currentHeroVisual=null;
}
// The image file is owned by the native Exploration HeroDefinition IndexedDB store.
// Never put blobs or object URLs into AdventureSession or a second catalogue.
async function loadSelectedHeroVisual(){
 const session=store.load(),id=session?.hero?.definitionId;
 const epoch=++heroImageEpoch;
 if(!id)return;
 try{
  const {createUserHeroStoreV1}=await import(
   '../../../vendor/exploration-lab/src/storage/user-hero-store-v1.js');
  const record=await createUserHeroStoreV1().get(id);
  if(epoch!==heroImageEpoch||!$('adventure-play-sheet').open)return;
  if(!record)return;
  const base=record.assets.find(entry=>entry.id===record.mapVisual.assetId);
  if(!(base?.blob instanceof Blob))return;
  const url=URL.createObjectURL(base.blob);
  if(epoch!==heroImageEpoch||!$('adventure-play-sheet').open){
   URL.revokeObjectURL(url);return;
  }
  currentHeroVisual={name:record.name,url};
  if(currentSheetTab==='hero')renderPlayingSheet();
 }catch(error){
  // Missing/unavailable local hero image is not grounds for inventing one.
  console.warn('Exploration HeroDefinition portrait unavailable',error);
 }
}
function renderPlayingSheet(){
 if(!activePlayingSheet)throw new Error('Aucune partie Aventure active pour cette fiche');
 const session=store.load();
 if(session?.sessionId!==activePlayingSheet.sessionId)
  throw new Error('La fiche ne correspond plus à la partie active');
 const snapshot=adventurePlaySheetSnapshotV1({
  session,bestiaryCards:published,statRegistry:officialStatRegistry
 });
 for(const button of document.querySelectorAll('[data-adventure-sheet-tab]')){
  const selected=button.dataset.adventureSheetTab===currentSheetTab;
  button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
 }
 const card=published.find(value=>value.id===snapshot.creature.speciesId);
 const portraitUrl=publishedCapturePortraitUrlV1({card,moduleUrl:import.meta.url});
 renderAdventureSheetViewV1({
  host:$('adventure-sheet-content'),snapshot,tab:currentSheetTab,
  portraitUrl,heroVisual:currentHeroVisual,
  onAllocate:(statId,points)=>{
   void allocatePlayingSheetStat(statId,points).catch(error=>{
    text($('adventure-sheet-status'),error.message);
    $('adventure-sheet-status').dataset.error='true';
   });
  }
 });
}
async function allocatePlayingSheetStat(statId,points){
 const play=activePlayingSheet;
 if(!play)throw new Error('Aucune partie active');
 const locks=window.navigator.locks;
 if(typeof locks?.request!=='function')
  throw new Error('Verrou de sauvegarde Aventure indisponible : aucune modification');
 // Same serialized transaction domain as the authoritative CombatResult commit.
 await locks.request('gensrpg.capture.v2.adventure-combat:'+play.sessionId,()=>{
  const session=store.load();
  if(session?.status!=='playing'||session.sessionId!==play.sessionId)
   throw new Error('La partie a changé ; attribution refusée.');
  const changed=allocateAdventureStatPointsV1({
   session,registry:officialStatRegistry,statId,points,now:new Date().toISOString()
  });
  store.save(changed); // Core Storage is the only persistent game owner.
  play.refreshParty(changed); // Exploration consumes the same authoritative member.
 });
 showSave();renderPlayingSheet();
 text($('adventure-sheet-status'),points+' point(s) attribués et enregistrés.');
 $('adventure-sheet-status').dataset.error='false';
}
$('adventure-open-sheet').addEventListener('click',guarded(()=>{
 const dialog=$('adventure-play-sheet');
 if(dialog.open)return;
 discardHeroVisual();
 currentSheetTab='hero';
 renderPlayingSheet();
 text($('adventure-sheet-status'),'Fiche mise à jour depuis la partie sauvegardée.');
 $('adventure-sheet-status').dataset.error='false';
 dialog.showModal();
 void loadSelectedHeroVisual();
 $('adventure-close-sheet').focus();
}));
$('adventure-close-sheet').addEventListener('click',()=>{
 $('adventure-play-sheet').close();$('adventure-open-sheet').focus();
});
$('adventure-play-sheet').addEventListener('close',discardHeroVisual);
for(const button of document.querySelectorAll('[data-adventure-sheet-tab]')){
 button.addEventListener('click',guarded(()=>{
  currentSheetTab=button.dataset.adventureSheetTab;
  renderPlayingSheet();
 }));
}

setFields(rules);
setSessionControlFields(null);
for(const field of Object.values(idField))$(field).addEventListener('input',updatePreview);
$(idField.xpMode).addEventListener('change',()=>{toggleXpMode();updatePreview();});
$(idField.max).addEventListener('change',extendFinalXpBandToCap);
$('adventure-xp-band-add').addEventListener('click',guarded(()=>{
 const bands=readXpBandRows();
 if(!bands.length)throw new Error('Conserve au moins un palier de niveaux.');
 const last=bands.at(-1),previous=bands.at(-2)?.throughLevel??1;
 if(last.throughLevel-previous<2)
  throw new Error('Diminue la borne du dernier palier avant d’en ajouter un.');
 const middle=Math.floor((last.throughLevel+previous)/2);
 bands.splice(bands.length-1,0,{throughLevel:middle,xpPerLevel:last.xpPerLevel});
 renderXpBandRows(bands);updatePreview();
}));
$('adventure-enemy').addEventListener('change',updatePreview);
$('adventure-starter').addEventListener('change',updatePreview);
$('adventure-create').addEventListener('click',guarded(()=>{
 if(!published.length)throw new Error('Bestiaire officiel indisponible; aucun contenu fictif ne sera utilisé');
 rules=fromFields();
 const id=()=>crypto.randomUUID();
 const now=new Date().toISOString();
 const state=createAdventureSessionV1({
  bestiaryCards:published,starterId:$('adventure-starter').value,
  rules,ids:{sessionId:id(),instanceId:id(),creatorId:id()},now
 });
 const configured=updateAdventureSessionControlV1({
  session:state,settings:sessionControlFromFields(),now
 });
 store.create(configured);
 setSessionControlFields(configured);
 stateMessage('Partie sauvegardée. Tu peux entrer dans le monde si une carte est disponible dans le World Builder GenSRPG.');
 showSave();updatePreview();
}));
$('adventure-world-builder').addEventListener('click',guarded(()=>{
 // The existing Monster Capture Shell owns navigation between the two Lab UIs.
 // The fallback only supports opening this standalone GenSRPG page directly.
 const shell=window.parent!==window?window.parent.GensCaptureV2:null;
 if(shell?.open?.('world')===true)return;
 const url=new URL('../../../vendor/exploration-lab/world-assembler.html',import.meta.url);
 if(url.origin!==window.location.origin)
  throw Error('World Builder officiel requis sur la même origine GenSRPG');
 window.location.assign(url.href);
}));

function syncFullscreenControl(){
 const enabled=Boolean(document.fullscreenElement);
 const control=$('adventure-fullscreen');
 control.textContent=enabled?'Quitter le plein écran':'Plein écran';
 control.setAttribute('aria-pressed',String(enabled));
}
async function requestAdventureFullscreen(){
 if(document.fullscreenElement)return;
 if(!document.fullscreenEnabled||typeof document.documentElement.requestFullscreen!=='function')return;
 try{await document.documentElement.requestFullscreen();}
 catch{ /* Full viewport is maintained by CSS when the browser blocks fullscreen. */ }
 syncFullscreenControl();
}
$('adventure-fullscreen').addEventListener('click',()=>{
 if(document.fullscreenElement){
  void document.exitFullscreen?.().catch(()=>{});
 }else void requestAdventureFullscreen();
});
document.addEventListener('fullscreenchange',syncFullscreenControl);
syncFullscreenControl();

$('adventure-play').addEventListener('click',guarded(()=>{
 const world=readWorldAssemblerDraft(window.localStorage);
 const result=startAdventureExplorationV1({
  store,storage:window.localStorage,world,
  navigation:{createNewExplorationPlay,readExplorationPlay},
  now:new Date().toISOString()
 });
 // GenSRPG owns the one transient permission to encounter Combat-published
 // species. The real Exploration main independently validates it against its
 // authoritative Showcase bundle before ever considering wild encounters.
 const officialGrant=writeAdventurePublishedEncounterGrantV1({
  storage:window.sessionStorage,session:result.session,world,
  bestiaryCards:published,combatSha:officialCombatSha
 });
 // The member instance/level/HP are projected from the SAME Core save.
 // Exploration may read this versioned envelope, never our private storage.
 // Exploration owns encounter activation and consumes the projection.
 const refreshParty=session=>writeAdventurePlayingPartyV1({
  storage:window.sessionStorage,session,world,
  publicationGrant:officialGrant,combatSha:officialCombatSha,
   statRegistry:officialStatRegistry
 });
 refreshParty(result.session);
 const url=new URL('../../../vendor/exploration-lab/sculpt-lab.html',import.meta.url);
 const sessionId=result.session.sessionId;
 url.searchParams.set('play','1');
 url.searchParams.set('adventureSession',sessionId);
 if(url.origin!==window.location.origin)
  throw new Error('Jouer doit utiliser le moteur Exploration officiel de la même origine');
 const frame=$('adventure-play-frame');
 connectAdventureCombatHostV1({
  frame,playUrl:url.href,sessionId,worldId:world.id,store,locks:window.navigator.locks,
  readPending:()=>readCombatHandoff(window.localStorage,{sessionId}),
  refreshParty,bestiaryCards:published,progressionCore:window.GensProgressionV1
 });
 // Keep the Aventure owner mounted while the native Exploration frame runs.
 activePlayingSheet={sessionId,refreshParty};
 frame.src=url.href;
 frame.hidden=false;
 document.querySelector('[data-adventure-app]').hidden=true;
 document.body.dataset.adventurePlaying='true';
 $('adventure-play-hud').hidden=false;
 // This gesture may be denied by a browser; the CSS fallback still fills the viewport.
 void requestAdventureFullscreen();
}));
$('adventure-resume').addEventListener('click',guarded(()=>{
 const state=store.load();
 if(!state)throw new Error('Aucune partie enregistrée à charger');
 rules=normalizeAdventureRulesV1(state.rules);
 setFields(rules);setSessionControlFields(state);
 renderItemRules();showSave();updatePreview();
 stateMessage('Sauvegarde chargée sans modifier les données.');
}));
$('adventure-save-control').addEventListener('click',guarded(()=>{
 const session=store.load();
 const settings=sessionControlFromFields(),now=new Date().toISOString();
 if(!session){
  creatorDraftStore.save(settings);
  setSessionControlFields(null);
  stateMessage('Choix créateur/MJ enregistrés avant la partie. Ils seront restaurés à la réouverture.');
  return;
 }
 const updated=session.sessionControl
  ?updateAdventureSessionControlV1({session,settings,now})
  :initializeAdventureSessionControlV1({
    session,settings,creatorId:crypto.randomUUID(),now
   });
 store.save(updated);setSessionControlFields(updated);showSave();
 stateMessage('Choix du créateur/MJ enregistrés. La connexion des invités et les actions MJ seront raccordées ultérieurement.');
}));
$('adventure-save-rules').addEventListener('click',guarded(()=>{
 rules=fromFields();
 const current=store.load();
 if(current)store.save({...current,rules,updatedAt:new Date().toISOString()});
 else draftStore.save(rules);
 renderItemRules();showSave();updatePreview();
 stateMessage(current?'Règles de la partie enregistrées.':'Brouillon de réglages enregistré : il sera restauré après rechargement.');
}));
$('adventure-item-add').addEventListener('click',guarded(()=>{
 const name=$('adventure-item-name').value.trim();
 if(!name||name.length>80)throw new Error('Le nom de l’objet doit comporter de 1 à 80 caractères');
 if(rules.loot.items.some(x=>x.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr')))
  throw new Error('Cet objet figure déjà dans ton catalogue');
 const item={id:'item-'+crypto.randomUUID(),name,
  saleValue:numberFrom('adventure-item-value')};
 rules=normalizeAdventureRulesV1({...fromFields(),loot:{...rules.loot,
  items:[...rules.loot.items,item]}});
 $('adventure-item-name').value='';
 renderItemRules();updatePreview();
 stateMessage('Objet ajouté au brouillon. Enregistre les réglages pour le conserver.');
}));
$('adventure-drop-add').addEventListener('click',guarded(()=>{
 const speciesId=$('adventure-drop-species').value;
 if(!published.some(card=>card.id===speciesId))
  throw new Error('Espèce absente du Bestiaire officiel');
 const drop={speciesId,itemId:$('adventure-drop-item').value,
  chancePercent:numberFrom('adventure-drop-chance'),
  minQuantity:numberFrom('adventure-drop-min'),
  maxQuantity:numberFrom('adventure-drop-max')};
 rules=normalizeAdventureRulesV1({...fromFields(),loot:{...rules.loot,
  drops:[...rules.loot.drops,drop]}});
 renderItemRules();updatePreview();
 stateMessage('Drop ajouté au brouillon. Enregistre les réglages pour le conserver.');
}));
(async()=>{
 try{
  store=createAdventureStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  draftStore=createAdventureRulesDraftStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  creatorDraftStore=createAdventureCreatorDraftStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  const official=await fetchPublishedBestiary();
  published=official.cards;officialCombatSha=official.combatSha;
  officialStatRegistry=official.statRegistry;
  fillPublicSpecies();
  const active=store.load();
  if(active){rules=normalizeAdventureRulesV1(active.rules);setFields(rules);}
  else {const draft=draftStore.load();if(draft){rules=draft;setFields(rules);}}
  setSessionControlFields(active);
  renderItemRules();showSave();updatePreview();
  stateMessage(published.length+' créatures officielles publiées, aucune créature de brouillon chargée.');
 }catch(error){
  stateMessage('Aventure indisponible : '+error.message,true);
  $('adventure-create').disabled=true;
  console.error('Adventure boot: official publication/session owner failed',error);
 }
})();
