// GenSrpg Capture V2 UI: configuration/session presentation only.
// Bestiary publication is computed by the SAME official Combat main function.
// The only gameplay model lives in adventure-contract-v1.mjs (not DOM).
import {captureBestiaryCardsV1} from '../../../vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js';
import {readWorldAssemblerDraft} from '../../../vendor/exploration-lab/src/builder/world-assembler-handoff.js';
import {createUserHeroStoreV1} from '../../../vendor/exploration-lab/src/storage/user-hero-store-v1.js';
import {writeAdventureHeroSelectionGrantV1,ADVENTURE_HERO_SELECTION_SCHEMA_V1}
 from './adventure-hero-selection-grant-v1.mjs';
import {
 createNewExplorationPlay,readExplorationPlay
} from '../../../vendor/exploration-lab/src/play/exploration-play-session.js';
import {readCombatHandoff} from '../../../vendor/exploration-lab/src/encounters/combat-handoff-store.js';
import {connectAdventureCombatHostV1} from './adventure-combat-host-v1.mjs';
import {startAdventureExplorationV1} from './adventure-play-bridge-v1.mjs';
import {writeAdventurePublishedEncounterGrantV1} from './adventure-publication-grant-v1.mjs';
import {writeAdventurePlayingPartyV1} from './adventure-playing-party-grant-v1.mjs';
import {
 DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,calculateAdventureXpV1,
 createAdventureSessionV1,createAdventureStoreV1,publishedAdventureSpeciesV1
} from './adventure-contract-v1.mjs';

const $=id=>document.getElementById(id);
const status=$('adventure-status');
const idField={
 base:'adventure-xp-base',bonus:'adventure-xp-bonus',penalty:'adventure-xp-penalty',
 global:'adventure-xp-global',level:'adventure-xp-level',max:'adventure-level-max',
 currency:'adventure-currency',
 heroEnabled:'adventure-hero-xp-enabled',heroShare:'adventure-hero-xp-share',
 heroXpLevel:'adventure-hero-xp-per-level',heroMax:'adventure-hero-max-level',
 heroTalent:'adventure-hero-talent-points'
};
let rules=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
let published=[];
let officialCombatSha=null;
let store;
let heroLibrary=null,knownHeroes=[];
const officialHeroLibrary=()=>heroLibrary??(heroLibrary=createUserHeroStoreV1());
const text=(node,value)=>{node.textContent=String(value);};
const stateMessage=(message,error=false)=>{
 text(status,message);status.dataset.error=String(error);
};
const numberFrom=id=>{
 const raw=$(id).value.trim();
 if(!raw)throw new RangeError(id+' : renseigne une valeur');
 return Number(raw);
};
function setFields(value){
 $(idField.base).value=value.xp.baseVictoryXp;
 $(idField.bonus).value=value.xp.higherEnemyBonusPercent;
 $(idField.penalty).value=value.xp.higherAllyPenaltyPercent;
 $(idField.global).value=value.xp.globalMultiplier;
 $(idField.level).value=value.progression.xpPerLevel;
 $(idField.max).value=value.progression.maxLevel;
 $(idField.currency).value=value.loot.currencyPerVictory;
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
  progression:{...rules.progression,xpPerLevel:numberFrom(idField.level),
   maxLevel:numberFrom(idField.max)},
  loot:{...rules.loot,currencyPerVictory:numberFrom(idField.currency)},
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
  combatSha:delivery.combat.sha
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
// The official Explorer Hero Library owns image and animation Blob data.
// Aventure keeps only the chosen HeroDefinition ID in its Core Storage save.
async function refreshHeroChoices({preferStored=true}={}){
 const picker=$('adventure-hero-choice');
 const saved=store?.load();
 const desired=preferStored?(saved?.hero?.definitionId??picker.value):picker.value;
 knownHeroes=await officialHeroLibrary().list();
 picker.replaceChildren(
  new Option('Héros standard (sans visuel personnalisé)',''),
  ...knownHeroes.map(hero=>new Option(hero.name,hero.id))
 );
 picker.value=desired&&knownHeroes.some(hero=>hero.id===desired)?desired:'';
 if(desired&&!knownHeroes.some(hero=>hero.id===desired))
  stateMessage('Héros choisi introuvable dans la bibliothèque Exploration : sauvegarde préservée, aucun visuel fictif.',true);
}
function selectedHeroRecord(){
 const id=$('adventure-hero-choice').value;
 if(!id)return null;
 const record=knownHeroes.find(hero=>hero.id===id);
 if(!record)throw new Error('Sélectionne un héros de la bibliothèque Exploration officielle.');
 return record;
}
function saveHeroChoice(){
 const session=store?.load();
 if(!session)throw new Error('Crée une partie avant de choisir son héros.');
 const chosen=selectedHeroRecord();
 const hero={...(session.hero??{progression:null})};
 if(chosen)hero.definitionId=chosen.id;
 else delete hero.definitionId;
 store.save({...session,hero,updatedAt:new Date().toISOString()});
 showSave();
 stateMessage('Choix du héros enregistré. Ses images restent dans la bibliothèque Exploration.');
}
async function heroRecordFromSession(session){
 const id=session?.hero?.definitionId;
 if(!id)return null;
 const record=await officialHeroLibrary().get(id);
 if(!record)throw new Error('Héros choisi introuvable dans la bibliothèque officielle. Sauvegarde conservée, entrée Jouer bloquée.');
 return record;
}
function showSave(){
 try{
  const state=store.load();
  if(!state){
   text($('adventure-save-summary'),'Aucune partie créée.');
   $('adventure-play').disabled=true;
   $('adventure-hero-save-selection').disabled=true;
   return;
  }
  $('adventure-play').disabled=false;
  $('adventure-hero-save-selection').disabled=false;
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
setFields(rules);
for(const field of Object.values(idField))$(field).addEventListener('input',updatePreview);
$('adventure-enemy').addEventListener('change',updatePreview);
$('adventure-starter').addEventListener('change',updatePreview);
$('adventure-hero-refresh').addEventListener('click',()=>{
 refreshHeroChoices({preferStored:false})
  .then(()=>stateMessage(knownHeroes.length+' héros officiels disponibles dans la bibliothèque locale.'))
  .catch(error=>stateMessage(error.message,true));
});
$('adventure-hero-save-selection').addEventListener('click',guarded(saveHeroChoice));
$('adventure-hero-editor').addEventListener('click',guarded(()=>{
 const root=new URL('../../../vendor/exploration-lab/',import.meta.url);
 const url=new URL('../../../vendor/exploration-lab/hero-editor.html',import.meta.url);
 if(root.origin!==window.location.origin||!url.pathname.startsWith(root.pathname))
  throw new Error('Éditeur Explorer officiel requis sur la même origine.');
 $('adventure-hero-editor-frame').src=url.href;
 $('adventure-hero-editor-panel').hidden=false;
}));
$('adventure-hero-editor-close').addEventListener('click',()=>{
 $('adventure-hero-editor-panel').hidden=true;
 $('adventure-hero-editor-frame').src='about:blank';
 refreshHeroChoices({preferStored:false}).catch(error=>stateMessage(error.message,true));
});
$('adventure-create').addEventListener('click',guarded(()=>{
 if(!published.length)throw new Error('Bestiaire officiel indisponible; aucun contenu fictif ne sera utilisé');
 rules=fromFields();
 const id=()=>crypto.randomUUID();
 const state=createAdventureSessionV1({
  bestiaryCards:published,starterId:$('adventure-starter').value,
  rules,heroDefinitionId:selectedHeroRecord()?.id??null,
  ids:{sessionId:id(),instanceId:id()},now:new Date().toISOString()
 });
 store.create(state);
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
$('adventure-play').addEventListener('click',()=>{
 (async()=>{
  const current=store.load();
  if(!current)throw new Error('Aucune partie enregistrée.');
  // Validate the author-owned HeroDefinition before opening a playing session.
  // Never reset the actor or invent a visual if the selected Blob was deleted.
  const heroRecord=await heroRecordFromSession(current);
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
  publicationGrant:officialGrant,combatSha:officialCombatSha
 });
 refreshParty(result.session);
 const heroGrant=writeAdventureHeroSelectionGrantV1({
  storage:window.sessionStorage,session:result.session,world,heroRecord
 });
 if(heroGrant===null)
  window.sessionStorage.removeItem(ADVENTURE_HERO_SELECTION_SCHEMA_V1+':'+result.session.sessionId);
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
 frame.src=url.href;
 frame.hidden=false;
 document.querySelector('[data-adventure-app]').hidden=true;
 })().catch(error=>stateMessage(error.message,true));
});
$('adventure-resume').addEventListener('click',guarded(()=>{
 const state=store.load();
 if(!state)throw new Error('Aucune partie enregistrée à charger');
 rules=normalizeAdventureRulesV1(state.rules);
 setFields(rules);renderItemRules();showSave();updatePreview();
 stateMessage('Sauvegarde chargée sans modifier les données.');
}));
$('adventure-save-rules').addEventListener('click',guarded(()=>{
 rules=fromFields();
 const current=store.load();
 if(current)store.save({...current,rules,updatedAt:new Date().toISOString()});
 renderItemRules();showSave();updatePreview();
 stateMessage(current?'Règles de la partie enregistrées.':'Réglages prêts : crée une partie pour les sauvegarder.');
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
  const official=await fetchPublishedBestiary();
  published=official.cards;officialCombatSha=official.combatSha;
  fillPublicSpecies();
  const active=store.load();
  if(active){rules=normalizeAdventureRulesV1(active.rules);setFields(rules);}
  renderItemRules();showSave();updatePreview();
  stateMessage(published.length+' créatures officielles publiées, aucune créature de brouillon chargée.');
  // Optional Hero Library failure must never disable historical adventures.
  try{await refreshHeroChoices();}catch(error){
   stateMessage('Bibliothèque de héros inaccessible : '+error.message+
    '. Une partie sans héros personnalisé reste disponible.',true);
  }
 }catch(error){
  stateMessage('Aventure indisponible : '+error.message,true);
  $('adventure-create').disabled=true;
  console.error('Adventure boot: official publication/session owner failed',error);
 }
})();
