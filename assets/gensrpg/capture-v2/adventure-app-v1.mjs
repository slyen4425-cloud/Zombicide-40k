// GenSrpg Capture V2 UI: configuration/session presentation only.
// Bestiary publication is computed by the SAME official Combat main function.
// The only gameplay model lives in adventure-contract-v1.mjs (not DOM).
import {fetchOfficialAdventureJsonV1} from './adventure-official-json-v1.mjs';
import {captureBestiaryCardsV1} from '../../../vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js';
import {projectCaptureEncounterOwnedStatsV1}
 from '../../../vendor/combat-lab/src/adapters/input/capture/capture-encounter-owned-stats-v1.js';
import {projectCaptureStatEffectsV1}
 from '../../../vendor/combat-lab/src/core/combat/capture-stat-effects-v1.js';
import {projectCaptureEncounterMaxHpV1}
 from '../../../vendor/combat-lab/src/ui/capture-encounter-combat-source-v1.js';
import {createAdventureHpProjectorV1} from './adventure-hp-projection-v1.mjs';
import {readWorldAssemblerDraft} from '../../../vendor/exploration-lab/src/builder/world-assembler-handoff.js';
import {
 createNewExplorationPlay,readExplorationPlay,playWorldFingerprint
} from '../../../vendor/exploration-lab/src/play/exploration-play-session.js';
import {readCombatHandoff} from '../../../vendor/exploration-lab/src/encounters/combat-handoff-store.js';
import {connectAdventureCombatHostV1} from './adventure-combat-host-v1.mjs';
import {projectAdventureCombatAwardV1} from './adventure-result-presentation-v1.mjs';
import {startAdventureExplorationV1} from './adventure-play-bridge-v1.mjs';
import {createAdventureRulesDraftStoreV1} from './adventure-rules-draft-v1.mjs';
import {adventurePlaySheetSnapshotV1} from './adventure-play-sheet-v1.mjs';
import {publishedCapturePortraitUrlV1} from './adventure-sheet-visual-v1.mjs';
import {renderAdventureSheetViewV1} from './adventure-play-sheet-view-v1.mjs';
import {createAdventureCreatorDraftStoreV1} from './adventure-creator-draft-v1.mjs';
import {createAdventurePortfolioStoreV1} from './adventure-portfolio-store-v1.mjs';
import {withSelectedAdventureWorldV1,resolveSelectedAdventureWorldV1,
 activateSelectedAdventureWorldV1,checkAdventureWorldArchiveV1}
 from './adventure-world-choice-v1.mjs';
import {createCaptureRoomTransportV1} from './adventure-multiplayer-transport-v1.mjs';
import {createCaptureSupabaseClientV1} from './adventure-multiplayer-provider-v1.mjs';
import {preflightCaptureOnlineWorldV1,publishCaptureInitialPositionV1
} from './adventure-multiplayer-play-bridge-v1.mjs';
import {attachCaptureExplorationPositionEventsV1
} from './adventure-multiplayer-exploration-events-v1.mjs';
import {attachCapturePeerFrameRelayV1
} from './adventure-multiplayer-peer-frame-relay-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from './adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from './adventure-playing-party-grant-v1.mjs';
import {writeAdventureHeroSelectionGrantV1} from './adventure-hero-selection-grant-v1.mjs';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 summonAdventureCreatureWithFragmentsV1,grantAdventureCreatureFragmentXpV1,
 DEFAULT_ADVENTURE_GUEST_PERMISSIONS_V1,normalizeAdventureRulesV1,calculateAdventureXpV1,
 createAdventureSessionV1,createAdventureStoreV1,updateAdventureCameraPolicyV1,publishedAdventureSpeciesV1,
 coreAdventureProgressionConfigV1,
 allocateAdventureStatPointsV1,chooseAdventureActiveCreatureV1,moveAdventurePartyMemberV1,
 updateAdventureSessionControlV1,
 initializeAdventureSessionControlV1
} from './adventure-contract-v1.mjs';
import {DEFAULT_ADVENTURE_FRAGMENTS_V1}
 from './adventure-fragments-v1.mjs';
import {normalizeCaptureItemTemplatesV1,materializeCaptureItemTemplatesV1}
 from './item-templates-v1.mjs';

const $=id=>document.getElementById(id);
const status=$('adventure-status');
const idField={
 base:'adventure-xp-base',bonus:'adventure-xp-bonus',penalty:'adventure-xp-penalty',
 global:'adventure-xp-global',distribution:'adventure-xp-distribution',level:'adventure-xp-level',max:'adventure-level-max',
 statPoints:'adventure-stat-points-per-level',xpMode:'adventure-xp-mode',
 currency:'adventure-currency',hpPercent:'adventure-combat-hp-percent',
 moveSpeed:'adventure-move-speed',
 heroEnabled:'adventure-hero-xp-enabled',heroShare:'adventure-hero-xp-share',
 heroXpLevel:'adventure-hero-xp-per-level',heroMax:'adventure-hero-max-level',
 heroTalent:'adventure-hero-talent-points'
};
const fragmentFields={
 enabled:'adventure-fragments-enabled',
 required:'adventure-fragments-required',
 summonLevel:'adventure-fragments-summon-level',
 xpPerFragment:'adventure-fragments-xp',
 dropChancePercent:'adventure-fragments-drop-chance',
 dropMin:'adventure-fragments-drop-min',
 dropMax:'adventure-fragments-drop-max',
 storageCapacity:'adventure-fragments-storage-capacity',
 allowDuplicates:'adventure-fragments-duplicates'
};
let rules=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
const isItemEditor=new URLSearchParams(window.location.search).get('editor')==='items';
let activeItemEditId=null;
let activeDropEditIndex=null;
let itemTemplates=Object.freeze({schema:'gensrpg-capture-item-templates-v1',version:1,items:Object.freeze([])});
const availableItemVisuals=()=>[...itemTemplates.items,...(itemTemplates.icons??[])];
const officialItemIconUrl=iconKey=>{
 const template=availableItemVisuals().find(entry=>entry.id===iconKey);
 return template?new URL(template.iconPath,import.meta.url).href:null;
};
if(isItemEditor){
 document.body.dataset.adventureItemEditor='true';
 document.querySelector('.adventure-head h1').textContent='Éditeur d’objets';
 document.querySelector('.adventure-head p').textContent=
  'Catalogue, valeur de vente et butin par espèce — même sauvegarde que Jouer.';
 const panel=document.getElementById('adventure-loot-panel');panel.open=true;
}
let published=[];
let officialCombatSha=null,officialStatRegistry=null;
let officialCombatVitalsProjector=null;
let store,portfolio,draftStore,creatorDraftStore,worldLibrary=null;
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
 $('adventure-creator-camera-angle').value=String(saved?.cameraPolicy?.angleDeg??45);
 $('adventure-creator-camera-zoom').value=String(saved?.cameraPolicy?.zoomPercent??(saved?175:205));
 $('adventure-creator-camera-zoom-value').textContent=$('adventure-creator-camera-zoom').value+' %';
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
function setFields(value){
 $(idField.base).value=value.xp.baseVictoryXp;
 $(idField.bonus).value=value.xp.higherEnemyBonusPercent;
 $(idField.penalty).value=value.xp.higherAllyPenaltyPercent;
 $(idField.global).value=value.xp.globalMultiplier;
 $(idField.distribution).value=value.xp.distribution;
 $(idField.level).value=value.progression.xpPerLevel;
 $(idField.max).value=value.progression.maxLevel;
 $(idField.xpMode).value=value.progression.xpCurveMode;
 $(idField.statPoints).value=value.progression.statPointsPerLevel??0;
 $(idField.currency).value=value.loot.currencyPerVictory;
 $(idField.hpPercent).value=100*value.combat.hpMultiplier;
 $(idField.moveSpeed).value=value.navigation?.moveSpeed??90;
 $('adventure-move-speed-value').textContent=$(idField.moveSpeed).value;
 $('adventure-defeat-policy').value=value.combat.defeatPolicy??'restore';
 renderXpBandRows(value.progression.xpBands??SHOWCASE_ADVENTURE_RULES_V1.progression.xpBands);
 toggleXpMode();
 $(idField.heroEnabled).checked=value.heroProgression.enabled;
 $(idField.heroShare).value=value.heroProgression.xpGainPercent;
 $(idField.heroXpLevel).value=value.heroProgression.xpPerLevel;
 $(idField.heroMax).value=value.heroProgression.maxLevel;
 $(idField.heroTalent).value=value.heroProgression.talentPointsPerLevel;
 const policy=value.fragmentRecruitment??DEFAULT_ADVENTURE_FRAGMENTS_V1;
 for(const [key,id] of Object.entries(fragmentFields)){
  if(key==='enabled')$(id).checked=value.fragmentRecruitment?.enabled??false;
  else if(key==='allowDuplicates')$(id).checked=policy.allowDuplicates;
  else $(id).value=String(policy[key]);
 }
}
function fromFields(){
 return normalizeAdventureRulesV1({
  ...rules,
  xp:{...rules.xp,baseVictoryXp:numberFrom(idField.base),
   higherEnemyBonusPercent:numberFrom(idField.bonus),
   higherAllyPenaltyPercent:numberFrom(idField.penalty),
   globalMultiplier:numberFrom(idField.global),
   distribution:$(idField.distribution).value},
  progression:{xpCurveMode:$(idField.xpMode).value,
   xpPerLevel:numberFrom(idField.level),maxLevel:numberFrom(idField.max),
   statPointsPerLevel:numberFrom(idField.statPoints),
   ...($(idField.xpMode).value==='custom'?{xpBands:readXpBandRows()}: {})},
  loot:{...rules.loot,currencyPerVictory:numberFrom(idField.currency)},
  combat:{hpMultiplier:numberFrom(idField.hpPercent)/100,
    defeatPolicy:$('adventure-defeat-policy').value},
  navigation:{moveSpeed:numberFrom(idField.moveSpeed)},
  heroProgression:{...rules.heroProgression,
   enabled:$(idField.heroEnabled).checked,
   xpGainPercent:numberFrom(idField.heroShare),
   xpPerLevel:numberFrom(idField.heroXpLevel),
   maxLevel:numberFrom(idField.heroMax),
   talentPointsPerLevel:numberFrom(idField.heroTalent)},
  // Old worlds with no fragment feature must not silently opt in.
  ...(rules.fragmentRecruitment||$(fragmentFields.enabled).checked?{
   fragmentRecruitment:{
    ...(rules.fragmentRecruitment??DEFAULT_ADVENTURE_FRAGMENTS_V1),
    enabled:$(fragmentFields.enabled).checked,
    required:numberFrom(fragmentFields.required),
    summonLevel:numberFrom(fragmentFields.summonLevel),
    xpPerFragment:numberFrom(fragmentFields.xpPerFragment),
    dropChancePercent:numberFrom(fragmentFields.dropChancePercent),
    dropMin:numberFrom(fragmentFields.dropMin),
    dropMax:numberFrom(fragmentFields.dropMax),
    storageCapacity:numberFrom(fragmentFields.storageCapacity),
    allowDuplicates:$(fragmentFields.allowDuplicates).checked
   }
  }:{})
 });
}
async function fetchPublishedBestiary(){
 // The preview is an installed PWA: its previous worker may still serve JSON
 // cache-first even when fetch({cache:'no-store'}) is requested. One fresh,
 // unguessable boot key forces all FIVE official files to use the same new
 // network snapshot instead of combining old Combat transfers and new pins.
 // The original Combat main publication predicate stays the sole authority.
 const releaseLoadId=crypto.randomUUID();
 const fetchJson=relative=>fetchOfficialAdventureJsonV1(
  relative,import.meta.url,releaseLoadId,fetch);
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
  statRegistry:stats,creatureTransfers:bundle.creatureTransfers
 });
}
// Only the original Exploration IndexedDB is authoritative for user HeroDefinition images.
async function officialHeroStore(){
 const {createUserHeroStoreV1}=await import(
  '../../../vendor/exploration-lab/src/storage/user-hero-store-v1.js');
 return createUserHeroStoreV1();
}
async function fillHeroChoices(savedHeroId=null){
 const picker=$('adventure-hero-choice'),notice=$('adventure-hero-choice-status');
 picker.disabled=true;
 try{
  const records=await (await officialHeroStore()).list();
  picker.replaceChildren(option('','Aucun héros personnalisé'),
   ...records.map(hero=>option(hero.id,hero.name)));
  if(savedHeroId&&records.some(hero=>hero.id===savedHeroId))picker.value=savedHeroId;
  else if(savedHeroId){
   picker.append(option(savedHeroId,'Héros enregistré indisponible',true));
   picker.value=savedHeroId;
  }
  text(notice,records.length
   ?records.length+' héros enregistrés dans la bibliothèque Exploration.'
   :'Aucun héros créé : ajoute-en un depuis l’éditeur officiel Exploration.');
 }catch(error){
  picker.replaceChildren(option('','Bibliothèque héros indisponible'));
  text(notice,'Bibliothèque du héros indisponible : '+error.message+
   '. Tu peux créer une partie sans héros personnalisé.');
 }
 picker.disabled=false;
}

function option(value,caption,disabled=false){
 const o=document.createElement('option');
 o.value=value;o.textContent=caption;o.disabled=disabled;return o;
}
function eligibleForNewGame(card){
 return Array.isArray(card.skills)&&card.skills.some(s=>s.state==='ready');
}
function renderStarterReserveSelectors(){
 const count=Number($('adventure-starter-count').value);
 if(!Number.isSafeInteger(count)||count<1||count>6)
  throw new RangeError('Choisis entre 1 et 6 créatures de départ.');
 const host=$('adventure-starter-reserve');
 const previous=[...host.querySelectorAll('select')].map(node=>node.value);
 const ready=published.filter(eligibleForNewGame);
 host.replaceChildren();
 for(let i=1;i<count;i++){
  const label=document.createElement('label');
  label.textContent='Créature '+(i+1)+' (réserve)';
  const choice=document.createElement('select');
  choice.dataset.starterSlot=String(i);
  choice.setAttribute('aria-label','Créature de départ '+(i+1));
  choice.append(option('','Choisis une créature publiée…'));
  for(const card of published)
   choice.append(option(card.id,card.name,!eligibleForNewGame(card)));
  choice.value=ready.some(card=>card.id===previous[i-1])
   ?previous[i-1]:(ready[i%ready.length]?.id??'');
  label.append(choice);host.append(label);
 }
}
function getStarterSpeciesIds(){
 const chosen=[$('adventure-starter').value,
  ...[...$('adventure-starter-reserve').querySelectorAll('[data-starter-slot]')]
   .map(select=>select.value)];
 if(chosen.length!==Number($('adventure-starter-count').value)||
    chosen.length<1||chosen.length>6)
  throw new RangeError('Choix de créatures de départ incomplet.');
 for(const id of chosen)
  if(!published.some(card=>card.id===id&&eligibleForNewGame(card)))
   throw new RangeError('Sélectionne une créature publiée et jouable pour chaque emplacement.');
 return chosen;
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
 renderStarterReserveSelectors();
}
function row(caption,remove){
 const holder=document.createElement('div');holder.className='rule-row';
 const span=document.createElement('span');span.textContent=caption;
 const btn=document.createElement('button');btn.type='button';btn.textContent='Supprimer';
 btn.addEventListener('click',remove);
 holder.append(span,btn);
 return holder;
}
function resetItemEditor(){
 activeItemEditId=null;
 $('adventure-item-name').value='';$('adventure-item-value').value='0';
 $('adventure-item-icon').value='';
 $('adventure-item-add').textContent='Ajouter cet objet';
 $('adventure-item-edit-cancel').hidden=true;
}
function editItem(itemId){
 const item=rules.loot.items.find(value=>value.id===itemId);
 if(!item)throw Error('Objet non disponible');
 activeItemEditId=itemId;
 $('adventure-item-name').value=item.name;
 $('adventure-item-value').value=String(item.saleValue);
 const select=$('adventure-item-icon');
 if(item.iconKey&&!availableItemVisuals().some(x=>x.id===item.iconKey))
  select.append(option(item.iconKey,'Icône indisponible (conservée)'));
 select.value=item.iconKey??'';
 $('adventure-item-add').textContent='Enregistrer les modifications';
 $('adventure-item-edit-cancel').hidden=false;
 $('adventure-item-name').focus();
}
function resetDropEditor(){
 activeDropEditIndex=null;
 $('adventure-drop-add').textContent='Ajouter une règle de drop';
 $('adventure-drop-edit-cancel').hidden=true;
}
function editDropRule(index){
 const drop=rules.loot.drops[index];
 if(!drop)throw new Error('Règle de drop indisponible');
 activeDropEditIndex=index;
 $('adventure-drop-species').value=drop.speciesId;
 $('adventure-drop-item').value=drop.itemId;
 $('adventure-drop-chance').value=String(drop.chancePercent);
 $('adventure-drop-min').value=String(drop.minQuantity);
 $('adventure-drop-max').value=String(drop.maxQuantity);
 $('adventure-drop-add').textContent='Enregistrer la règle de drop';
 $('adventure-drop-edit-cancel').hidden=false;
 $('adventure-drop-chance').focus();
}
function renderItemRules(){
 const itemList=$('adventure-items'),dropList=$('adventure-drops');
 const needle=$('adventure-item-search').value.trim().toLocaleLowerCase('fr');
 itemList.replaceChildren();
 for(const item of rules.loot.items.filter(i=>!needle||
  [i.name,...rules.loot.drops.filter(d=>d.itemId===i.id)
   .map(d=>published.find(c=>c.id===d.speciesId)?.name??d.speciesId)]
    .some(t=>t.toLocaleLowerCase('fr').includes(needle)))){
  const holder=document.createElement('div');holder.className='rule-row';
  const iconUrl=officialItemIconUrl(item.iconKey);
  if(iconUrl){
   const image=document.createElement('img');image.className='sheet-item-icon';
   image.alt='Icône de '+item.name;image.src=iconUrl;image.loading='lazy';holder.append(image);
  }
  const span=document.createElement('span');span.textContent=item.name+' · '+item.saleValue+' pièces';
  holder.append(span);
  const edit=document.createElement('button');edit.type='button';edit.textContent='Modifier';
  edit.addEventListener('click',guarded(()=>editItem(item.id)));
  const remove=document.createElement('button');remove.type='button';remove.textContent='Supprimer';
  remove.addEventListener('click',guarded(()=>{
   const attached=rules.loot.drops.filter(d=>d.itemId===item.id).length;
   if(attached&&!window.confirm('Supprimer '+item.name+' et ses '+attached+' drop(s) associés ?'))return;
   rules=normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
    items:rules.loot.items.filter(i=>i.id!==item.id),
    drops:rules.loot.drops.filter(d=>d.itemId!==item.id)}});
   if(activeItemEditId===item.id)resetItemEditor();
   renderItemRules();updatePreview();
   stateMessage('Objet supprimé du brouillon. Enregistre les paramètres.');
  }));
  holder.append(edit,remove);itemList.append(holder);
 }
 if(!itemList.childNodes.length)itemList.append(document.createTextNode(needle
  ?'Aucun résultat.':'Aucun objet défini.'));
 const selector=$('adventure-drop-item'),selected=selector.value;
 selector.replaceChildren();
 for(const item of rules.loot.items)selector.append(option(item.id,item.name));
 if(rules.loot.items.some(x=>x.id===selected))selector.value=selected;
 $('adventure-drop-add').disabled=!published.length||!rules.loot.items.length;
 dropList.replaceChildren(...(rules.loot.drops.length?rules.loot.drops.map((drop,index)=>{
  const holder=row((published.find(c=>c.id===drop.speciesId)?.name??drop.speciesId)+
   ' → '+(rules.loot.items.find(i=>i.id===drop.itemId)?.name??drop.itemId)+
   ' · '+drop.chancePercent+' % · '+drop.minQuantity+'–'+drop.maxQuantity,()=>{
    rules=normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
     drops:rules.loot.drops.filter((_,i)=>i!==index)}});
    resetDropEditor();renderItemRules();updatePreview();
   });
  const edit=document.createElement('button');edit.type='button';
  edit.textContent='Modifier';
  edit.addEventListener('click',guarded(()=>editDropRule(index)));
  holder.append(edit);return holder;
 }): [document.createTextNode('Aucun drop : aucune récompense aléatoire implicite.')]));
}
async function loadOfficialItemTemplates(){
 // Optional author illustrations must NEVER prevent the game from starting.
 // Invalid/unreachable manifests fail closed: no import and no invented icons.
 try{
  const response=await fetch(new URL('./item-templates.v1.json',import.meta.url),
   {cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  itemTemplates=normalizeCaptureItemTemplatesV1(await response.json(),published);
  const selector=$('adventure-item-icon');
  selector.replaceChildren(option('','Sans icône officielle'));
  for(const item of availableItemVisuals())selector.append(option(item.id,item.name));
  $('adventure-item-import').disabled=!itemTemplates.items.length;
  text($('adventure-item-icon-status'),itemTemplates.items.length
   ?itemTemplates.items.length+' objets officiels importables, '+
     (itemTemplates.icons?.length??0)+' icônes supplémentaires utilisables manuellement.'
   :'Icônes en attente du dépôt validé. Création manuelle déjà disponible.');
 }catch(error){
  console.warn('Catalogue visuel officiel indisponible ; jeu intact',error);
  $('adventure-item-import').disabled=true;
  text($('adventure-item-icon-status'),
   'Catalogue visuel indisponible ; objets et récompenses manuels conservés.');
 }
 renderItemRules();
}

function renderPortfolioOptions(){
 if(!portfolio)return;
 const select=$('adventure-save-select'),saved=portfolio.list();
 const active=portfolio.activeId();
 select.replaceChildren(...(saved.length?saved.map(entry=>
  option(entry.sessionId,'Partie '+entry.sessionId.slice(0,8)+
   ' · '+(published.find(c=>c.id===entry.speciesId)?.name??entry.speciesId)+
   ' niv. '+entry.level+' · '+entry.partySize+' créature(s)'+
   (entry.status==='playing'?' · en cours':
     entry.status==='finished'?' · fin de partie':' · prête')))
   :[option('','Aucune partie enregistrée')]));
 select.disabled=!saved.length;
 $('adventure-save-load').disabled=!saved.length;
  $('adventure-save-delete').disabled=!saved.length;
 if(active&&saved.some(entry=>entry.sessionId===active))select.value=active;
}
function refreshWorldChoices(saved=null){
 const picker=$('adventure-world-select'),notice=$('adventure-world-status');
 if(!worldLibrary){
  picker.disabled=true;
  text(notice,'Bibliothèque officielle Exploration pas encore raccordée au main publié. Le monde local actuel reste disponible.');
  return;
 }
 const worlds=worldLibrary.list();
 const previous=picker.value;
 picker.replaceChildren(option('','Monde local actuel (compatibilité)'),
  ...worlds.map(w=>option(w.id,w.id+' · '+w.areaCount+' zone(s)')));
 picker.disabled=false;
 if(saved?.world?.mapRef&&worlds.some(w=>w.id===saved.world.mapRef))
  picker.value=saved.world.mapRef;
 else if(worlds.some(w=>w.id===previous))picker.value=previous;
 text(notice,worlds.length
  ?worlds.length+' monde(s) enregistrés. Choisis celui de ton aventure avant de jouer.'
  :'Aucun monde archivé : enregistre d’abord ton monde dans le World Builder officiel.');
}
async function installOfficialWorldLibrary(){
 try{
  // The official Lab owns archive/WorldDocument import/export and activation.
  // Before its API is on certified main, never create a second codec.
  const owner=await import(
   '../../../vendor/exploration-lab/src/builder/exploration-world-document-library-v1.js');
  worldLibrary=owner.createExplorationWorldDocumentLibraryV1({storage:window.localStorage});
 }catch(error){
  worldLibrary=null;
  console.info('Bibliothèque multi-mondes en attente de main Exploration',error.message);
 }
 refreshWorldChoices(store?.load()??null);
}
function renderPartyActiveChoices(){
 const select=$('adventure-active-creature');
 const current=store?.load();
 select.replaceChildren();
 if(!current){
  select.append(option('','Crée une partie pour choisir une créature.'));
  select.disabled=true;$('adventure-select-active').disabled=true;
  return;
 }
 const actors=[current.party.active,...(current.party.reserve??[])];
 for(const actor of actors){
  const name=published.find(card=>card.id===actor.speciesId)?.name??actor.speciesId;
  select.append(option(actor.instanceId,name+(actor.hp===0?' · KO':''),actor.hp===0));
 }
 select.value=current.party.active.instanceId;
 select.disabled=actors.length===1||current.status==='finished';
 $('adventure-select-active').disabled=select.disabled;
}
$('adventure-select-active').addEventListener('click',guarded(()=>{
 if(document.body.dataset.adventurePlaying==='true')
  throw new Error('Quitte le jeu avant de changer la créature active.');
 const saved=store?.load();
 const selected=chooseAdventureActiveCreatureV1({
  session:saved,instanceId:$('adventure-active-creature').value,
  now:new Date().toISOString()
 });
 if(selected!==saved)store.save(selected);
 showSave();
 stateMessage('Créature active de ton équipe enregistrée.');
}));
function renderSavedAdventureRosterV1(state){
 const host=$('adventure-saved-roster'),list=$('adventure-saved-roster-members');
 const members=state?[state.party.active,...(state.party.reserve??[])]:[];
 host.hidden=!members.length;
 list.replaceChildren(...members.map((member,index)=>{
  const name=published.find(card=>card.id===member.speciesId)?.name??member.speciesId;
  const li=document.createElement('li');
  li.textContent=name+' · niv. '+member.level+' · '+member.xp+' XP'+
   (member.hp===0?' · KO':member.hp===null?' · PV au maximum':' · '+member.hp+' PV')+
   (index===0?' · premier combattant':' · réserve');
  li.dataset.instanceId=member.instanceId;
  return li;
 }));
}
function showSave(){
 try{
  renderPortfolioOptions();
  const state=store.load();
  $('adventure-room-host').disabled=!!activeCaptureRoom||!state?.sessionControl?.joinEnabled;
  text($('adventure-play-team-count'),String(state?1+(state.party.reserve?.length??0):0));
  renderSavedAdventureRosterV1(state); // Always reread the same persisted Core save.
  if(!state){
   $('adventure-hero-choice').disabled=false;
   text($('adventure-save-summary'),'Aucune partie créée.');
   $('adventure-play').disabled=true;
   renderPartyActiveChoices();
   return;
  }
  // The picker affects the NEXT new game, not the already saved hero.
  $('adventure-hero-choice').disabled=false;
  $('adventure-play').disabled=state.status==='finished';
  $('adventure-play').textContent=state.status==='finished'?'Partie terminée':
   state.status==='playing'?'Continuer la partie':'Entrer dans le monde';
  const card=published.find(c=>c.id===state.party.active.speciesId);
  const a=state.party.active;
  const reward=state.lastAward;
  text($('adventure-save-summary'),
   'Partie '+state.sessionId.slice(0,8)+' · '+(card?.name??a.speciesId)+
   ' · niveau '+a.level+' · '+(1+(state.party.reserve?.length??0))+
   ' créature(s) · '+a.xp+' XP · '+state.inventory.currency+' pièces'+
   (a.hp===0?' · KO : 0 PV, soins ou réanimation nécessaires':'')+
   (state.rules.heroProgression?.enabled===true
    ?' · Héros niv. '+(state.hero?.progression?.level??1)+' · '+
      (state.hero?.progression?.xp??0)+' XP'
    :' · Héros sans niveau')+
   (reward?' · Dernier combat : '+reward.outcome+' ('+reward.xp+' XP)':'')+
   ' · statut : '+(state.status==='configured'?'configuration enregistrée':
     state.status==='finished'?'terminée après défaite':'en cours'));
  renderPartyActiveChoices();
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
function guardedAsync(callback){
 return ()=>{
  try{void Promise.resolve(callback()).catch(error=>stateMessage(error.message,true));}
  catch(error){stateMessage(error.message,true);}
 };
}
// A separate Capture-only Supabase Auth namespace protects Survival players.
// The real network is started by an explicit player click, never during
// adventure boot or legacy shell startup.
let captureRoomTransport=null,activeCaptureRoom=null,activeCaptureExplorationEvents=null;
let activeCapturePeerRelay=null;
// Display-only peer projections. Never persisted and never used for movement.
const captureRemotePositions=new Map();
function onlineRoomStatus(message,error=false){
 const output=$('adventure-room-status');
 output.textContent=message;output.dataset.error=String(error);
}
function captureRoomProvider(){
 if(captureRoomTransport)return captureRoomTransport;
 let factory;
 try{
  // The parent GenSRPG Shell already loads the official Supabase SDK.
  // No second network runtime is installed into the Survival Shell.
  const sdk=window.supabase??(window.parent!==window?window.parent.supabase:null);
  factory=sdk?.createClient?.bind(sdk);
 }catch{factory=null;}
 if(!factory)throw new Error(
  'Client réseau indisponible dans cette vue. Ouvre Monster Capture depuis le Hub GenSRPG.');
 const client=createCaptureSupabaseClientV1({factory});
 captureRoomTransport=createCaptureRoomTransportV1({client});
 return captureRoomTransport;
}
function renderCaptureRoomMembers(state){
 const host=$('adventure-room-members');host.replaceChildren();
 if(!state){
  captureRemotePositions.clear();renderCaptureRemotePositions();
  onlineRoomStatus('Salon fermé ou accès expiré ; aucune sauvegarde modifiée.',true);
  return;
 }
 for(const member of state.members){
  const item=document.createElement('div');item.className='rule-row';
  item.textContent=(member.role==='host'?'👑 ':'👤 ')+member.name;
  host.append(item);
 }
 onlineRoomStatus('CODE '+state.code+' · '+state.members.length+
  ' / '+state.maxPlayers+' joueur(s) · '+(state.open?'Salon ouvert':'Salon fermé'));
 const members=new Set(state.members.map(p=>p.id));
 for(const id of captureRemotePositions.keys()){
  if(!members.has(id))captureRemotePositions.delete(id);
 }
 renderCaptureRemotePositions();
}
function updateCaptureRemotePositions(snapshot){
 if(!activeCaptureRoom||!Array.isArray(snapshot?.actors))return;
 for(const actor of snapshot.actors){
  // Server projection has already been validated against room membership,
  // world fingerprint and monotonic revision by the Capture transport.
  if(typeof actor?.actorId!=='string')continue;
  captureRemotePositions.set(actor.actorId,actor);
 }
 renderCaptureRemotePositions();
}
function renderCaptureRemotePositions(){
 const total=captureRemotePositions.size;
 const statement=total+' autre(s) joueur(s) avec position reçue';
 // C3 intentionally DOES NOT claim an avatar has been drawn. Exploration
 // alone will later display the validated peers using its official renderer.
 text($('adventure-room-positions'),'Positions reçues : '+statement+
  ' · avatars distants pas encore affichés.');
 text($('adventure-play-remote-status'),'Positions reçues : '+total+
  ' · '+(activeCapturePeerRelay?'envoi au renderer Exploration':'affichage des avatars à raccorder'));
 activeCapturePeerRelay?.publish([...captureRemotePositions.values()]);
}
async function connectCaptureRoom(response){
 const transport=captureRoomProvider();
 // Separate authorization: the server already validated this user and the
 // room. The view receives only projected membership and never an AdventureSave.
 activeCaptureRoom=response;
 captureRemotePositions.clear();renderCaptureRemotePositions();
 $('adventure-room-code').value=response.code;
 $('adventure-room-host').disabled=true;
 $('adventure-room-join').disabled=true;
 $('adventure-room-leave').disabled=false;
 await transport.observe({
  roomId:response.roomId,userId:response.userId,
  onChange:renderCaptureRoomMembers,
  onPositions:updateCaptureRemotePositions,
  onStatus:message=>{if(message!=='Salon connecté')onlineRoomStatus(message,true);}
 });
 const state=await transport.inspectRoom(response.roomId);
 renderCaptureRoomMembers(state);
}
$('adventure-room-host').addEventListener('click',guardedAsync(async()=>{
 if(activeCaptureRoom)throw new Error('Quitte le salon actif avant d’en créer un autre.');
 const session=store?.load();
 if(!session)throw new Error('Crée une partie Monster Capture avant de l’héberger.');
 onlineRoomStatus('Création du salon Monster Capture…');
 const response=await captureRoomProvider().create({
  session,name:$('adventure-player-alias').value,
  maxPlayers:Number($('adventure-room-capacity').value)
 });
 await connectCaptureRoom(response);
}));
$('adventure-room-join').addEventListener('click',guardedAsync(async()=>{
 if(activeCaptureRoom)throw new Error('Quitte le salon actif avant d’en rejoindre un autre.');
 onlineRoomStatus('Connexion au salon Monster Capture…');
 const response=await captureRoomProvider().join({
  code:$('adventure-room-code').value,name:$('adventure-player-alias').value
 });
 await connectCaptureRoom(response);
}));
$('adventure-room-leave').addEventListener('click',guardedAsync(async()=>{
 const room=activeCaptureRoom;
 if(!room)return;
 activeCaptureExplorationEvents?.dispose();activeCaptureExplorationEvents=null;
 activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
 await captureRoomProvider().leave({roomId:room.roomId});
 activeCaptureRoom=null;
 captureRemotePositions.clear();renderCaptureRemotePositions();
 $('adventure-room-members').replaceChildren();
 $('adventure-room-leave').disabled=true;
 $('adventure-room-join').disabled=false;
 $('adventure-room-host').disabled=!store?.load()?.sessionControl?.joinEnabled;
 onlineRoomStatus('Salon quitté. Ta sauvegarde locale Monster Capture est intacte.');
}));
window.addEventListener('pagehide',()=>{
 // No globally persistent heartbeat and no shared save mutation.
 activeCaptureExplorationEvents?.dispose();activeCaptureExplorationEvents=null;
 activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
 captureRemotePositions.clear();
 void captureRoomTransport?.dispose().catch(()=>{});
});

// The Exploration iframe remains mounted; only this Capture-owned view
// consumes the already persisted AdventureSession. No second player state.
let activePlayingSheet=null,activeCombatHost=null;
function showAdventureCombatResult({session,award}){
 const view=projectAdventureCombatAwardV1({session,award,bestiaryCards:published});
 text($('adventure-result-title'),view.title);
 const host=$('adventure-result-rows');
 host.replaceChildren(...view.rows.map(entry=>{
  const row=document.createElement('div');row.className='rule-row';
  const label=document.createElement('span');label.textContent=entry.label;
  const value=document.createElement('strong');value.textContent=entry.value;
  row.append(label,value);return row;
 }));
 $('adventure-open-last-result').hidden=false;
 const dialog=$('adventure-result-dialog');
 if(!dialog.open)dialog.showModal();
 $('adventure-result-close').focus();
}
$('adventure-open-last-result').addEventListener('click',guarded(()=>{
 const session=store?.load();
 if(!session?.lastAward)throw new Error('Aucun résultat de combat enregistré');
 showAdventureCombatResult({session,award:session.lastAward});
}));
$('adventure-result-close').addEventListener('click',()=>{
 $('adventure-result-dialog').close();
});
let currentSheetTab='hero',currentSheetCreatureId=null;
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
 if(![session.party.active,...(session.party.reserve??[])].some(actor=>
     actor.instanceId===currentSheetCreatureId))
  currentSheetCreatureId=session.party.active.instanceId;
 const snapshot=adventurePlaySheetSnapshotV1({
  session,bestiaryCards:published,statRegistry:officialStatRegistry,
  projectCombatVitals:officialCombatVitalsProjector,
  selectedInstanceId:currentSheetCreatureId
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
  onSelectCreature:instanceId=>{currentSheetCreatureId=instanceId;renderPlayingSheet();},
  onMoveCreature:(instanceId,direction)=>{
   void updatePlayingTeam(instanceId,'move',direction).catch(sheetActionError);
  },
  onMakeActive:instanceId=>{
   void updatePlayingTeam(instanceId,'active').catch(sheetActionError);
  },
  onAllocate:(statId,points)=>{
   void allocatePlayingSheetStat(statId,points,currentSheetCreatureId).catch(error=>{
    text($('adventure-sheet-status'),error.message);
    $('adventure-sheet-status').dataset.error='true';
   });
  },
  resolveItemIcon:officialItemIconUrl,
  resolveFragmentIcon:speciesId=>{
   const icon=published.find(card=>card.id===speciesId)?.icon;
   return publishedCapturePortraitUrlV1({
    card:icon?{portrait:icon}:null,moduleUrl:import.meta.url
   });
  },
  onSummonFragment:speciesId=>{
   void performPlayingFragmentAction({kind:'summon',speciesId}).catch(sheetActionError);
  },
  onUseFragmentXp:(speciesId,instanceId,quantity)=>{
   void performPlayingFragmentAction({
    kind:'xp',speciesId,instanceId,quantity
   }).catch(sheetActionError);
  }
 });
}
function sheetActionError(error){
 text($('adventure-sheet-status'),error.message);
 $('adventure-sheet-status').dataset.error='true';
}
let fragmentActionPending=false;
async function performPlayingFragmentAction({kind,speciesId,instanceId=null,quantity=null}){
 const play=activePlayingSheet;
 if(!play||play.sessionId!==store?.load()?.sessionId)
  throw new Error('Aucune partie active pour utiliser les éclats');
 // A double-click is one intent, never two independently issued actions.
 if(fragmentActionPending)return;
 fragmentActionPending=true;
 try{
  const locks=window.navigator.locks;
  if(typeof locks?.request!=='function')
   throw new Error('Verrou de sauvegarde indisponible : éclats conservés');
  let receipt=null,refreshWarning=null;
  await locks.request('gensrpg.capture.v2.adventure-combat:'+play.sessionId,()=>{
   const session=store.load();
   if(session?.status!=='playing'||session.sessionId!==play.sessionId)
    throw new Error('La partie a changé : action annulée sans consommation');
   if(readCombatHandoff(window.localStorage,{sessionId:play.sessionId}))
    throw new Error('Termine le combat avant d’utiliser les éclats');
   const event={
    session,bestiaryCards:published,speciesId,
    actionId:crypto.randomUUID(),now:new Date().toISOString(),
    progressionCore:window.GensProgressionV1
   };
   receipt=kind==='summon'
    ?summonAdventureCreatureWithFragmentsV1({
     ...event,instanceId:crypto.randomUUID(),destination:'auto'
    })
    :grantAdventureCreatureFragmentXpV1({
     ...event,instanceId,quantity
    });
   if(!receipt.applied)throw new Error('Action déjà enregistrée');
   // Save first, then refresh Exploration's official party projection.
   // If the saving fails, the original inventory remains untouched.
   store.save(receipt.session);
   try{play.refreshParty(receipt.session);}
   catch(error){refreshWarning=error.message;}
  });
  showSave();renderPlayingSheet();
  const summary=kind==='summon'
   ?'Créature invoquée au niveau '+receipt.creature.level+
     (receipt.destination==='storage'?' et placée dans le stockage hors combat.':'.')
   :'+'+receipt.xpGained+' XP enregistrée(s) sur la créature sélectionnée.';
  text($('adventure-sheet-status'),summary+(refreshWarning
   ?' Sauvegarde effectuée, mais synchronisation Exploration à vérifier : '+refreshWarning:''));
  $('adventure-sheet-status').dataset.error=String(Boolean(refreshWarning));
 }finally{fragmentActionPending=false;}
}
async function updatePlayingTeam(instanceId,action,direction=null){
 const play=activePlayingSheet;
 if(!play)throw new Error('Aucune partie active');
 const locks=window.navigator.locks;
 if(typeof locks?.request!=='function')throw new Error('Verrou de sauvegarde indisponible');
 await locks.request('gensrpg.capture.v2.adventure-combat:'+play.sessionId,()=>{
  const session=store.load();
  if(session?.status!=='playing'||session.sessionId!==play.sessionId)
   throw new Error('La partie a changé ; modification refusée.');
  if(readCombatHandoff(window.localStorage,{sessionId:play.sessionId}))
   throw new Error('Termine d’abord le combat en cours pour modifier l’équipe.');
  const changed=action==='active'
   ?chooseAdventureActiveCreatureV1({session,instanceId,now:new Date().toISOString()})
   :moveAdventurePartyMemberV1({session,instanceId,direction,now:new Date().toISOString()});
  if(changed!==session){store.save(changed);play.refreshParty(changed);}
 });
 currentSheetCreatureId=instanceId;
 showSave();renderPlayingSheet();
 text($('adventure-sheet-status'),'Ordre de l’équipe enregistré pour le prochain combat.');
 $('adventure-sheet-status').dataset.error='false';
}
async function allocatePlayingSheetStat(statId,points,instanceId){
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
   session,registry:officialStatRegistry,statId,points,instanceId,
   now:new Date().toISOString()
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
 currentSheetTab='team'; // Immediately show all 1–6 saved creatures on the map.
 currentSheetCreatureId=store.load()?.party?.active?.instanceId??null;
 renderPlayingSheet();
 text($('adventure-sheet-status'),'Fiche mise à jour depuis la partie sauvegardée.');
 $('adventure-sheet-status').dataset.error='false';
 dialog.showModal();
 void loadSelectedHeroVisual();
 $('adventure-close-sheet').focus();
}));
$('adventure-return-title').addEventListener('click',()=>{
 const frame=$('adventure-play-frame');
 if(!activePlayingSheet||frame.hidden)return;
 text($('adventure-sheet-status'),'Enregistrement de la position avant le retour au titre…');
 frame.contentWindow?.postMessage({
  schema:'gensrpg.capture.v2.save-and-title.v1',
  sessionId:activePlayingSheet.sessionId
 },window.location.origin);
});
window.addEventListener('message',event=>{
 const frame=$('adventure-play-frame');
 if(event.origin!==window.location.origin||event.source!==frame.contentWindow||
    event.data?.schema!=='gensrpg.exploration.play.return-title.v1'||
    event.data.sessionId!==activePlayingSheet?.sessionId)return;
 if($('adventure-play-sheet').open)$('adventure-play-sheet').close();
 discardHeroVisual();
 activeCombatHost?.dispose();activeCombatHost=null;
 activeCaptureExplorationEvents?.dispose();activeCaptureExplorationEvents=null;
 activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
 activePlayingSheet=null;currentSheetCreatureId=null;
 dismissJourneyLoading();
 frame.hidden=true;frame.src='about:blank';
 document.body.dataset.adventurePlaying='false';
 $('adventure-play-hud').hidden=true;
 document.querySelector('[data-adventure-app]').hidden=false;
 if(document.fullscreenElement)void document.exitFullscreen?.().catch(()=>{});
 showSave();stateMessage('Retour au titre : position enregistrée, partie conservée.');
 // In the official Shell, title means Monster Capture's real title/menu,
 // not a second HTML menu or a temporary Exploration page.
 const shell=window.parent!==window?window.parent.GensCaptureV2:null;
 if(shell?.status?.().view==='adventure')shell.home();
});
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
for(const field of Object.values(fragmentFields))$(field).addEventListener('input',updatePreview);
$(idField.moveSpeed).addEventListener('input',()=>{
 $('adventure-move-speed-value').textContent=$(idField.moveSpeed).value;
});
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
$('adventure-creator-camera-zoom').addEventListener('input',()=>{
 $('adventure-creator-camera-zoom-value').textContent=$('adventure-creator-camera-zoom').value+' %';
});
$('adventure-enemy').addEventListener('change',updatePreview);
$('adventure-starter').addEventListener('change',updatePreview);
$('adventure-starter-count').addEventListener('change',guarded(renderStarterReserveSelectors));
$('adventure-create').addEventListener('click',guarded(()=>{
 if(!published.length)throw new Error('Bestiaire officiel indisponible; aucun contenu fictif ne sera utilisé');
 rules=fromFields();
 const id=()=>crypto.randomUUID();
 const now=new Date().toISOString();
 const starterIds=getStarterSpeciesIds();
 const state=createAdventureSessionV1({
  bestiaryCards:published,starterId:starterIds[0],starterIds,
  rules,ids:{sessionId:id(),instanceId:id(),
   reserveInstanceIds:starterIds.slice(1).map(()=>id()),creatorId:id()},now,
  heroDefinitionId:$('adventure-hero-choice').value||null,
  cameraAngle:Number($('adventure-creator-camera-angle').value),
  cameraZoomPercent:Number($('adventure-creator-camera-zoom').value)
 });
 const configured=updateAdventureSessionControlV1({
  session:state,settings:sessionControlFromFields(),now
 });
 const worldId=$('adventure-world-select').value;
 const created=worldId?withSelectedAdventureWorldV1(configured,worldId):configured;
 portfolio.create(created);
 setSessionControlFields(created);
 stateMessage('Nouvelle partie enregistrée séparément. Les anciennes sauvegardes sont conservées.');
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

// Never inspect or mutate the Shell DOM. Its own presentation API is the
// fullscreen owner when Capture is opened through the four-mode app.
function captureShellFullscreenOwner(){
 try{
  const shell=window.parent!==window?window.parent.GensCaptureV2:null;
  return shell?.status?.().view==='adventure'?shell:null;
 }catch{return null;}
}
function syncFullscreenControl(){
 const shell=captureShellFullscreenOwner();
 const enabled=Boolean(shell?.gameFullscreenActive?.()||document.fullscreenElement);
 const control=$('adventure-fullscreen');
 control.textContent=enabled?'Quitter le plein écran':'Plein écran';
 control.setAttribute('aria-pressed',String(enabled));
}
async function requestAdventureFullscreen(){
 const shell=captureShellFullscreenOwner();
 if(shell?.requestGameFullscreen){
  // Synchronous call into the Shell-owned method preserves Android's user
  // activation; Shell fullscreen includes BOTH Back and the Adventure HUD.
  try{await shell.requestGameFullscreen();}
  catch{ /* Browser may deny native fullscreen, 100dvh remains active. */ }
  syncFullscreenControl();return;
 }
 if(document.fullscreenElement)return;
 if(!document.fullscreenEnabled||typeof document.documentElement.requestFullscreen!=='function')return;
 try{
  await document.documentElement.requestFullscreen({navigationUI:'hide'});
  if(document.fullscreenElement&&typeof screen.orientation?.lock==='function'){
   try{await screen.orientation.lock('landscape');}
   catch{ /* Android may deny orientation lock, authored camera stays intact. */ }
  }
 }catch{ /* The CSS dynamic viewport remains the standalone fallback. */ }
 syncFullscreenControl();
}
$('adventure-fullscreen').addEventListener('click',()=>{
 const shell=captureShellFullscreenOwner();
 if(shell?.gameFullscreenActive?.()){
  void shell.exitGameFullscreen();
 }else if(document.fullscreenElement){
  void document.exitFullscreen?.().catch(()=>{});
 }else void requestAdventureFullscreen();
});
document.addEventListener('fullscreenchange',syncFullscreenControl);
const detachShellFullscreen=captureShellFullscreenOwner()?.onGameFullscreenChange?.(
 syncFullscreenControl);
window.addEventListener('pagehide',()=>detachShellFullscreen?.(),{once:true});
syncFullscreenControl();

const journeyLoading=$('adventure-launch-loading');
let journeyLaunchEpoch=0;
function showJourneyLoading(message){
 text($('adventure-launch-loading-status'),message);
 journeyLoading.hidden=false;
}
function dismissJourneyLoading(){
 journeyLoading.hidden=true;
}
function cancelPendingAdventureLaunch(){
 ++journeyLaunchEpoch; // Explicit cancellation invalidates any still-pending async preflight.
 const frame=$('adventure-play-frame');
 activeCombatHost?.dispose();activeCombatHost=null;
 activeCaptureExplorationEvents?.dispose();activeCaptureExplorationEvents=null;
 activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
 activePlayingSheet=null;currentSheetCreatureId=null;
 frame.hidden=true;frame.src='about:blank';
 $('adventure-play-hud').hidden=true;
 document.body.dataset.adventurePlaying='false';
 document.querySelector('[data-adventure-app]').hidden=false;
 dismissJourneyLoading();
 showSave();
}
$('adventure-loading-cancel').addEventListener('click',()=>{
 cancelPendingAdventureLaunch();
 stateMessage('Retour à la préparation. Équipe et checkpoint conservés.');
});
window.addEventListener('message',event=>{
 const frame=$('adventure-play-frame');
 if(journeyLoading.hidden||event.origin!==window.location.origin||
    event.source!==frame.contentWindow||
    event.data?.sessionId!==activePlayingSheet?.sessionId)return;
 if(event.data.schema==='gensrpg.exploration.play.ready.v1'){
  if(event.data.worldId!==store.load()?.world?.mapRef&&
     event.data.worldId!==readWorldAssemblerDraft(window.localStorage)?.id)return;
  dismissJourneyLoading();
 }else if(event.data.schema==='gensrpg.exploration.play.failed.v1'){
  text($('adventure-launch-loading-status'),
   'Impossible de charger cette partie : '+String(event.data.message??'Erreur inconnue')+
   '. Utilise « Retour à la préparation » pour réessayer.');
 }
});
$('adventure-play').addEventListener('click',guardedAsync(async()=>{
 // Must be requested inside the real user gesture, before async world/asset
 // checks lose activation. The viewport CSS remains the browser-denied fallback.
 // Nested Exploration fullscreen is deliberately disallowed: Sac stays in parent.
 void requestAdventureFullscreen();
 if(!journeyLoading.hidden)return; // One authoritative launch at a time.
 showJourneyLoading('Chargement du monde et des sauvegardes…');
 const launchEpoch=++journeyLaunchEpoch;
 try{
 const selectedWorldId=$('adventure-world-select').value;
 let world=readWorldAssemblerDraft(window.localStorage);
 let beforeWorldSession=store.load();
 // The preparation controls must apply to the next actual play entry even
 // when the player didn't reopen the creator's advanced settings.
 if(beforeWorldSession&&beforeWorldSession.status!=='finished'){
  const angleDeg=Number($('adventure-creator-camera-angle').value);
  const zoomPercent=Number($('adventure-creator-camera-zoom').value);
  if(beforeWorldSession.cameraPolicy?.angleDeg!==angleDeg||
     (beforeWorldSession.cameraPolicy?.zoomPercent??175)!==zoomPercent){
   beforeWorldSession=updateAdventureCameraPolicyV1({
    session:beforeWorldSession,angleDeg,zoomPercent,now:new Date().toISOString()
   });
   store.save(beforeWorldSession);
  }
 }
 if(worldLibrary&&selectedWorldId){
  world=resolveSelectedAdventureWorldV1({
   session:beforeWorldSession,worldLibrary,selectedWorldId
  });
  const draft=readWorldAssemblerDraft(window.localStorage);
  if(checkAdventureWorldArchiveV1({
   activeWorld:draft,archivedWorld:world,selectedWorldId,
   fingerprint:playWorldFingerprint
  }).stale)
   throw new Error('Ce monde a des modifications non archivées dans Exploration (passages, zones ou terrain). Ouvre le World Builder, enregistre ce monde dans Mes mondes, puis reprends cette partie. La sauvegarde reste intacte.');
 }else if(beforeWorldSession?.world?.mapRef&&
  beforeWorldSession.world.mapRef!==world?.id){
  throw new Error('Cette partie exige son WorldDocument '+beforeWorldSession.world.mapRef+
   '. Charge le monde officiel avant de reprendre la partie.');
 }
 const savedHeroId=store.load()?.hero?.definitionId??null;
 const heroRecord=savedHeroId?await (await officialHeroStore()).get(savedHeroId):null;
 if(launchEpoch!==journeyLaunchEpoch)return; // Closed during asynchronous HeroDefinition lookup.
 if(savedHeroId&&!heroRecord)
  throw new Error('Le héros de cette partie n’existe plus dans la bibliothèque Exploration. La sauvegarde reste intacte.');
 // Bound worlds are immutable for this room. Refuse an alien/world-mismatched
 // guest BEFORE touching their local AdventureSession or Exploration checkpoint.
 const onlineContext=await preflightCaptureOnlineWorldV1({
  room:activeCaptureRoom,transport:captureRoomTransport,
  world,officialFingerprint:playWorldFingerprint,
  sessionId:store.load()?.sessionId
 });
 if(launchEpoch!==journeyLaunchEpoch)return;
 if(worldLibrary&&selectedWorldId){
  const activated=activateSelectedAdventureWorldV1({
   worldLibrary,selectedWorldId
  });
  if(playWorldFingerprint(activated)!==playWorldFingerprint(world))
   throw new Error('Le monde archivé a changé avant son activation : partie conservée.');
 }
 if(selectedWorldId&&beforeWorldSession?.world?.mapRef===null){
  store.save(withSelectedAdventureWorldV1(beforeWorldSession,selectedWorldId));
 }
 const result=startAdventureExplorationV1({
  store,storage:window.localStorage,world,
  navigation:{createNewExplorationPlay,readExplorationPlay},
  now:new Date().toISOString()
 });
 // Initial peer position comes from the SAME official Exploration checkpoint.
 // Future movement must wait for a documented Exploration change event,
 // not monkey-patching Storage or a duplicate navigation loop.
 await publishCaptureInitialPositionV1({
  context:onlineContext,transport:captureRoomTransport,
  navigation:result.navigation
 });
 if(launchEpoch!==journeyLaunchEpoch)return;
 // Native Exploration consumes the original selected HeroDefinition by ID only.
 writeAdventureHeroSelectionGrantV1({storage:window.sessionStorage,
  session:result.session,world,heroRecord});
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
 const refreshParty=session=>{
  const grant=writeAdventurePlayingPartyV1({
   storage:window.sessionStorage,session,world,
   publicationGrant:officialGrant,combatSha:officialCombatSha,
   statRegistry:officialStatRegistry
  });
  // Notify only the native Exploration consumer. This projection is still
  // owned and persisted exclusively by the official AdventureSession.
  $('adventure-play-frame').contentWindow?.postMessage({
   schema:'gensrpg.capture.v2.party-refresh.v1',
   sessionId:session.sessionId
  },window.location.origin);
  return grant;
 };
 refreshParty(result.session);
 const url=new URL('../../../vendor/exploration-lab/sculpt-lab.html',import.meta.url);
 const sessionId=result.session.sessionId;
 url.searchParams.set('play','1');
 url.searchParams.set('adventureSession',sessionId);
 url.searchParams.set('cameraAngle',String(result.session.cameraPolicy?.angleDeg??55));
 url.searchParams.set('cameraZoom',String(result.session.cameraPolicy?.zoomPercent??175));
 url.searchParams.set('moveSpeed',String(result.session.rules.navigation?.moveSpeed??90));
 if(url.origin!==window.location.origin)
  throw new Error('Jouer doit utiliser le moteur Exploration officiel de la même origine');
 const frame=$('adventure-play-frame');
 activeCombatHost?.dispose();
 activeCombatHost=connectAdventureCombatHostV1({
  frame,playUrl:url.href,sessionId,worldId:world.id,store,locks:window.navigator.locks,
  readPending:()=>readCombatHandoff(window.localStorage,{sessionId}),
  refreshParty,bestiaryCards:published,progressionCore:window.GensProgressionV1,
  onCombatResult:showAdventureCombatResult,
  onGameOver:()=>{
   dismissJourneyLoading();
   activeCombatHost?.dispose();activeCombatHost=null;
   activePlayingSheet=null;
   activeCaptureExplorationEvents?.dispose();
   activeCaptureExplorationEvents=null;
   activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
   frame.hidden=true;
   document.body.dataset.adventurePlaying='false';
   $('adventure-play-hud').hidden=true;
   document.querySelector('[data-adventure-app]').hidden=false;
   showSave();
   stateMessage('Défaite : partie terminée selon la règle du créateur. Sélectionne ou crée une autre sauvegarde.');
  }
 });
 // Keep the Aventure owner mounted while the native Exploration frame runs.
 activePlayingSheet={sessionId,refreshParty};
 currentSheetCreatureId=result.session.party.active.instanceId;
 $('adventure-open-last-result').hidden=!result.session.lastAward;
 activeCaptureExplorationEvents?.dispose();
 activeCapturePeerRelay?.dispose();activeCapturePeerRelay=null;
 activeCaptureExplorationEvents=onlineContext
  ?attachCaptureExplorationPositionEventsV1({
    frame,roomId:onlineContext.room.roomId,transport:captureRoomTransport,
    sessionId,worldId:onlineContext.worldId,
    worldFingerprint:onlineContext.worldFingerprint,
    origin:window.location.origin,
    onStatus:message=>onlineRoomStatus(message)
   })
  :null;
 // READ-ONLY remote peers. Rendering and perspective remain owned by the
 // official Exploration MapActor renderer; network transports never mutate
 // a navigation checkpoint. The scoped receiver may not yet be published.
 activeCapturePeerRelay=onlineContext
  ?attachCapturePeerFrameRelayV1({
    frame,origin:window.location.origin,sessionId,
    worldId:onlineContext.worldId,
    worldFingerprint:onlineContext.worldFingerprint,
    ownActorId:onlineContext.room.userId,
    onReady:()=>onlineRoomStatus('Affichage des joueurs distants raccordé à Exploration')
   })
  :null;
 activeCapturePeerRelay?.publish([...captureRemotePositions.values()]);
 // No fake fallback if pinned Exploration main lacks the official API.
 frame.src=url.href;
 frame.hidden=false;
 document.querySelector('[data-adventure-app]').hidden=true;
 document.body.dataset.adventurePlaying='true';
 $('adventure-play-hud').hidden=false;
 // Capture's parent owns native fullscreen and keeps Sac/Équipe/Retour above
 // the official Exploration iframe. If denied, existing viewport CSS applies.
 }catch(error){
   cancelPendingAdventureLaunch();
   throw error;
 }
}));
$('adventure-world-select').addEventListener('change',()=>{
 text($('adventure-world-status'),'Monde sélectionné pour la prochaine entrée en jeu. Une sauvegarde existante conserve son monde lié.');
});
$('adventure-save-load').addEventListener('click',guardedAsync(async()=>{
 const chosen=$('adventure-save-select').value;
 if(!chosen)throw new Error('Sélectionne une partie enregistrée.');
 if(activeCaptureRoom)
  throw new Error('Quitte le salon réseau actif avant de changer de sauvegarde.');
 const loaded=portfolio.select(chosen);
 rules=normalizeAdventureRulesV1(loaded.rules);
 setFields(rules);setSessionControlFields(loaded);
 renderItemRules();showSave();updatePreview();
 refreshWorldChoices(loaded);
 await fillHeroChoices(loaded.hero?.definitionId??null);
 stateMessage('Partie '+chosen.slice(0,8)+' chargée. Les autres sauvegardes restent intactes.');
}));
$('adventure-save-delete').addEventListener('click',guardedAsync(async()=>{
  const chosen=$('adventure-save-select').value;
  if(!chosen)throw new Error('Sélectionne la sauvegarde à supprimer.');
  if(activeCaptureRoom)
   throw new Error('Quitte le salon réseau actif avant de supprimer une sauvegarde.');
  if(document.body.dataset.adventurePlaying==='true')
   throw new Error('Quitte le mode Jouer avant de supprimer une sauvegarde.');
  const chosenEntry=portfolio.list().find(entry=>entry.sessionId===chosen);
  if(!chosenEntry)throw new Error('Sauvegarde introuvable : aucune suppression.');
  const description='Partie '+chosen.slice(0,8)+' · niveau '+chosenEntry.level;
  if(!window.confirm('Supprimer définitivement '+description+' ?\\n' +
   'Cette opération ne supprimera ni les autres parties ni les mondes.'))return;
  portfolio.delete(chosen);
  const remaining=store.load();
  rules=normalizeAdventureRulesV1(remaining?.rules??draftStore.load()??SHOWCASE_ADVENTURE_RULES_V1);
  setFields(rules);setSessionControlFields(remaining);
  renderItemRules();showSave();updatePreview();
  refreshWorldChoices(remaining);
  await fillHeroChoices(remaining?.hero?.definitionId??null);
  stateMessage(description+' supprimée. Les autres sauvegardes et mondes sont conservés.');
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
 const saved=session.sessionControl
  ?updateAdventureSessionControlV1({session,settings,now})
  :initializeAdventureSessionControlV1({
    session,settings,creatorId:crypto.randomUUID(),now
   });
 // Same AdventureSession owns creator settings and the camera policy.
 const updated=updateAdventureCameraPolicyV1({
  session:saved,angleDeg:Number($('adventure-creator-camera-angle').value),
  zoomPercent:Number($('adventure-creator-camera-zoom').value),now
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
$('adventure-item-edit-cancel').addEventListener('click',resetItemEditor);
$('adventure-item-search').addEventListener('input',renderItemRules);
$('adventure-item-add').addEventListener('click',guarded(()=>{
 const name=$('adventure-item-name').value.trim();
 if(!name||name.length>80)throw new Error('Le nom de l’objet doit comporter de 1 à 80 caractères');
 if(rules.loot.items.some(x=>x.id!==activeItemEditId&&
     x.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr')))
  throw new Error('Cet objet figure déjà dans ton catalogue');
 if(activeItemEditId&&!rules.loot.items.some(x=>x.id===activeItemEditId))
  throw new Error('Cet objet ne figure plus dans la partie.');
 const iconKey=$('adventure-item-icon').value;
 const item={id:activeItemEditId??'item-'+crypto.randomUUID(),name,
  saleValue:numberFrom('adventure-item-value'),
  ...(iconKey?{iconKey}:{})};
 const items=activeItemEditId?rules.loot.items.map(x=>
  x.id===activeItemEditId?item:x):[...rules.loot.items,item];
 rules=normalizeAdventureRulesV1({...fromFields(),loot:{...rules.loot,items}});
 resetItemEditor();renderItemRules();updatePreview();
 stateMessage('Objet conservé dans le brouillon. Clique Enregistrer les paramètres.');
}));
$('adventure-item-import').addEventListener('click',guarded(()=>{
 const staged=materializeCaptureItemTemplatesV1({rules:fromFields(),templates:itemTemplates});
 rules=normalizeAdventureRulesV1({...fromFields(),loot:staged.loot});
 resetItemEditor();renderItemRules();updatePreview();
 stateMessage(staged.addedItems+' objets et '+staged.addedDrops+
  ' drops officiels ajoutés. Tes objets personnalisés restent intacts. Enregistre les paramètres.');
}));
$('adventure-drop-edit-cancel').addEventListener('click',resetDropEditor);
$('adventure-drop-add').addEventListener('click',guarded(()=>{
 const speciesId=$('adventure-drop-species').value;
 if(!published.some(card=>card.id===speciesId))
  throw new Error('Espèce absente du Bestiaire officiel');
 const drop={speciesId,itemId:$('adventure-drop-item').value,
  chancePercent:numberFrom('adventure-drop-chance'),
  minQuantity:numberFrom('adventure-drop-min'),
  maxQuantity:numberFrom('adventure-drop-max')};
 const drops=activeDropEditIndex===null?[...rules.loot.drops,drop]:
   rules.loot.drops.map((value,index)=>index===activeDropEditIndex?drop:value);
 rules=normalizeAdventureRulesV1({...fromFields(),loot:{...rules.loot,drops}});
 resetDropEditor();renderItemRules();updatePreview();
 stateMessage('Règle de drop enregistrée dans le brouillon. Enregistre les paramètres pour confirmer.');
}));
(async()=>{
 try{
  const legacyStore=createAdventureStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  portfolio=createAdventurePortfolioStoreV1({
   storage:window.localStorage,coreStorage:window.GensStorageV1,legacyStore
  });
  store=portfolio;
  draftStore=createAdventureRulesDraftStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  creatorDraftStore=createAdventureCreatorDraftStoreV1({storage:window.localStorage,coreStorage:window.GensStorageV1});
  const official=await fetchPublishedBestiary();
  published=official.cards;officialCombatSha=official.combatSha;
  await loadOfficialItemTemplates();
  officialStatRegistry=official.statRegistry;
  officialCombatVitalsProjector=createAdventureHpProjectorV1({
   creatureTransfers:official.creatureTransfers,statRegistry:officialStatRegistry,
   projectOwnedStats:projectCaptureEncounterOwnedStatsV1,
   projectStatEffects:projectCaptureStatEffectsV1,
   projectMaxHp:projectCaptureEncounterMaxHpV1
  });
  fillPublicSpecies();
  const active=store.load();
  if(active){rules=normalizeAdventureRulesV1(active.rules);setFields(rules);}
  else {const draft=draftStore.load();if(draft){rules=draft;setFields(rules);}}
  setSessionControlFields(active);
  renderItemRules();showSave();updatePreview();
  await fillHeroChoices(active?.hero?.definitionId??null);
  await installOfficialWorldLibrary();
  stateMessage(published.length+' créatures officielles publiées, aucune créature de brouillon chargée.');
 }catch(error){
  stateMessage('Aventure indisponible : '+error.message,true);
  $('adventure-create').disabled=true;
  console.error('Adventure boot: official publication/session owner failed',error);
 }
})();
