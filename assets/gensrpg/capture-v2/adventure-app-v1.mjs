// GenSrpg Capture V2 UI: configuration/session presentation only.
// Bestiary publication is computed by the SAME official Combat main function.
// The only gameplay model lives in adventure-contract-v1.mjs (not DOM).
import {captureBestiaryCardsV1} from '../../../vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js';
import {
 DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,calculateAdventureXpV1,
 createAdventureSessionV1,createAdventureStoreV1,publishedAdventureSpeciesV1
} from './adventure-contract-v1.mjs';

const $=id=>document.getElementById(id);
const status=$('adventure-status');
const idField={
 base:'adventure-xp-base',bonus:'adventure-xp-bonus',penalty:'adventure-xp-penalty',
 global:'adventure-xp-global',level:'adventure-xp-level',max:'adventure-level-max',
 currency:'adventure-currency'
};
let rules=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
let published=[];
let store;
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
  loot:{...rules.loot,currencyPerVictory:numberFrom(idField.currency)}
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
 return publishedAdventureSpeciesV1(captureBestiaryCardsV1({
  creatureTransfers:bundle.creatureTransfers,
  skillTransfers:bundle.skillTransfers,
  assetCatalog:assets,statRegistry:stats,nativeSkills:skills.entries??[]
 }));
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
   return;
  }
  const card=published.find(c=>c.id===state.party.active.speciesId);
  const a=state.party.active;
  const reward=state.lastAward;
  text($('adventure-save-summary'),
   'Partie '+state.sessionId.slice(0,8)+' · '+(card?.name??a.speciesId)+
   ' · niveau '+a.level+' · '+a.xp+' XP · '+state.inventory.currency+' pièces'+
   (reward?' · Dernier combat : '+reward.outcome+' ('+reward.xp+' XP)':'')+
   ' · statut : '+(state.status==='configured'?'configuration enregistrée':'en cours'));
 }catch(error){
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
$('adventure-create').addEventListener('click',guarded(()=>{
 if(!published.length)throw new Error('Bestiaire officiel indisponible; aucun contenu fictif ne sera utilisé');
 rules=fromFields();
 const id=()=>crypto.randomUUID();
 const state=createAdventureSessionV1({
  bestiaryCards:published,starterId:$('adventure-starter').value,
  rules,ids:{sessionId:id(),instanceId:id()},now:new Date().toISOString()
 });
 store.create(state);
 stateMessage('Partie sauvegardée. Le vrai mode Jouer sera activé une fois raccordé au Labo Exploration.');
 showSave();updatePreview();
}));
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
  published=await fetchPublishedBestiary();
  fillPublicSpecies();
  const active=store.load();
  if(active){rules=normalizeAdventureRulesV1(active.rules);setFields(rules);}
  renderItemRules();showSave();updatePreview();
  stateMessage(published.length+' créatures officielles publiées, aucune créature de brouillon chargée.');
 }catch(error){
  stateMessage('Aventure indisponible : '+error.message,true);
  $('adventure-create').disabled=true;
  console.error('Adventure boot: official publication/session owner failed',error);
 }
})();
