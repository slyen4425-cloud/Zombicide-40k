// Single opt-in ESM implementation INVOKED BY the original Capture World
// captureStartWildBattle declaration. Never installs a replacement window
// function, a second combat simulation, a duplicate storage writer or a timer.
import {createCaptureOfficialHubCompositionV1} from './capture-official-hub-composition-v1.mjs';
import {createCaptureNativeLabProviderV1} from './capture-native-lab-provider-v1.mjs';
import {createCaptureNativeLabSceneV1} from './capture-native-lab-scene-v1.mjs';
import {createCaptureSavedProfileLabMigrationV1} from './saved-profile-lab-migration-v1.mjs';

let active = null;
const text = value => typeof value === 'string' ? value.trim() : '';

function worldOwners() {
 const root=globalThis;
 const names=[
  'captureActiveHeroId','loadState','saveHeroCreatureState',
  'captureWorldState','saveCaptureWorldState','captureConsumeWildEncounter',
  'captureWorldKey'
 ];
 for(const name of names){
  if(typeof root[name]!=='function'){
   throw new TypeError('Propriétaire officiel Capture manquant : '+name);
  }
 }
 return Object.freeze({
  activeHeroId:()=>root.captureActiveHeroId(),
  loadHeroState:id=>root.loadState(id),
  saveHeroState:(id,next)=>root.saveHeroCreatureState(id,next),
  readWorldState:()=>root.captureWorldState(),
  saveWorldState:next=>root.saveCaptureWorldState(next),
  consumeWildEncounter:reason=>root.captureConsumeWildEncounter(reason),
  worldStorageKey:()=>root.captureWorldKey(),
  nextEncounterId:()=>{
   if(typeof root.crypto?.randomUUID!=='function'){
    throw new Error('Identifiant de rencontre sécurisé indisponible');
   }
   return 'capture-'+root.crypto.randomUUID().replaceAll('-','');
  }
 });
}
async function existingPort() {
 // The historical public index does not load these dormant Capture contracts.
 // Load them ONLY if absent, exactly once, through their canonical IIFE files.
 if(!globalThis.GensCaptureBattleBridgeContractV1){
  await import('./battle-bridge-contract-v1.js');
 }
 if(!globalThis.GensCaptureLabOwnershipPortV1){
  await import('./lab-ownership-port-v1.js');
 }
 const contract=globalThis.GensCaptureBattleBridgeContractV1;
 const port=globalThis.GensCaptureLabOwnershipPortV1;
 if(typeof contract?.result!=='function'||typeof port?.startEncounter!=='function'){
  throw new Error('Contrat unique Capture / Labo Combat indisponible');
 }
 return {contract,port};
}
function createDialog(){
 const doc=globalThis.document;
 if(!doc?.body?.appendChild)throw new Error('Interface Capture indisponible');
 const shell=doc.createElement('section');
 shell.id='gens-capture-official-battle-v1';
 shell.setAttribute('role','dialog');
 shell.setAttribute('aria-modal','true');
 shell.setAttribute('aria-label','Combat officiel Monster Capture');
 Object.assign(shell.style,{
  position:'fixed',inset:'0',zIndex:'2147482000',display:'flex',
  alignItems:'center',justifyContent:'center',padding:'max(10px,env(safe-area-inset-top))',
  background:'rgba(9,18,16,.96)',color:'#f5faf6',
  fontFamily:'system-ui,sans-serif',overflow:'auto'
 });
 const panel=doc.createElement('div');
 Object.assign(panel.style,{
  width:'min(100%,1040px)',maxHeight:'98vh',overflow:'auto',padding:'12px',
  borderRadius:'12px',background:'#1c3025',border:'1px solid #65846d',
  display:'flex',flexDirection:'column',gap:'8px'
 });
 const title=doc.createElement('h2');title.textContent='Monster Capture · Combat officiel';
 title.style.margin='0';title.style.fontSize='clamp(16px,3vw,22px)';
 const status=doc.createElement('p');status.setAttribute('role','status');
 status.id='capture-official-entry-status';status.textContent='Chargement du moteur officiel…';
 status.style.margin='4px 0';status.style.fontSize='clamp(12px,2.2vw,16px)';
 const host=doc.createElement('div');host.id='capture-official-entry-arena';host.hidden=true;
 const row=doc.createElement('div');row.style.display='flex';row.style.gap='8px';
 row.style.flexWrap='wrap';row.style.justifyContent='center';
 const back=doc.createElement('button');back.type='button';back.textContent='Retour au monde';back.id='capture-official-flee';
 const retry=doc.createElement('button');retry.type='button';
 retry.textContent='Réessayer la sauvegarde';retry.hidden=true;
 for(const button of [back,retry]){
  button.style.minHeight='44px';button.style.minWidth='160px';
  button.style.background='#386848';button.style.color='#fff';
  button.style.border='1px solid #b4d5bc';button.style.borderRadius='8px';
  row.appendChild(button);
 }
 Object.assign(shell.style,{padding:'0',overflow:'hidden',background:'#0b1420'});
 Object.assign(panel.style,{width:'100vw',height:'100dvh',maxHeight:'100dvh',
  overflow:'hidden',padding:'0',border:'none',borderRadius:'0',background:'#0b1420'});
 Object.assign(host.style,{flex:'1 1 auto',width:'100%',minHeight:'0'});
 Object.assign(row.style,{position:'absolute',top:'max(4px,env(safe-area-inset-top))',right:'max(4px,env(safe-area-inset-right))',zIndex:'250'});
 panel.append(title,status,host,row);shell.append(panel);doc.body.appendChild(shell);
 return Object.freeze({shell,status,host,back,retry});
}
function redrawCaptureWorld(){
 for(const key of ['renderCaptureWorldHub','renderCaptureExploreResult']){
  if(typeof globalThis[key]==='function'){
   try{globalThis[key]();}catch(error){
    console.error('Capture World render after official battle',error);
   }
  }
 }
}
function close(entry,{render=true}={}){
 if(active!==entry)return false;
 if(entry.controller?.status().phase==='commit-pending'){
  throw new Error('Résultat partiellement sauvegardé : réessaie la sauvegarde avant de sortir.');
 }
 entry.closed=true;
 try{entry.controller?.dispose();}finally{
  globalThis.removeEventListener?.('pagehide',entry.onPageHide);
  globalThis.removeEventListener?.('beforeunload',entry.onBeforeUnload);
  entry.ui.shell.remove();active=null;
  if(render)redrawCaptureWorld();
 }
 return true;
}
function visibleFailure(entry,error,{commitPending=false}={}){
 if(entry.closed)return;
 entry.ui.status.textContent='Combat officiel : '+String(error?.message||error);
 entry.ui.status.dataset.error='true';
 entry.ui.status.dataset.commitPending=String(!!commitPending);
 entry.ui.retry.hidden=!commitPending;
 entry.ui.back.disabled=!!commitPending;
}

// The same original button can be tapped repeatedly while ESM and author
// data load. One owner-level active token serializes every asynchronous step.
export async function startCaptureOfficialWildEntryV1(creatureId){
 if(active)throw new Error('Un combat officiel Capture est déjà en cours.');
 const requested=text(creatureId);
 if(!requested)throw new TypeError('Créature sauvage manquante');
 const entry={closed:false,controller:null,session:null,ui:createDialog(),onPageHide:null,onBeforeUnload:null};
 active=entry;
 entry.ui.back.addEventListener('click',()=>{
  try{
   if(entry.controller?.status().phase==='running'){
    if(entry.session){entry.session.flee();return;}
    entry.controller.cancel();
   }
   close(entry);
  }catch(error){visibleFailure(entry,error,{commitPending:entry.controller?.status().phase==='commit-pending'});}
 });
 entry.ui.retry.addEventListener('click',()=>{
  try{entry.controller?.retryCommit();}
  catch(error){visibleFailure(entry,error,{commitPending:entry.controller?.status().phase==='commit-pending'});}
 });
 entry.onPageHide=()=>{
  if(active!==entry)return;
  try{if(entry.controller?.status().phase==='running')entry.controller.cancel();close(entry,{render:false});}
  catch(error){visibleFailure(entry,error,{commitPending:true});}
 };
 globalThis.addEventListener?.('pagehide',entry.onPageHide);
 entry.onBeforeUnload=event=>{
  if(entry.controller?.status().phase==='commit-pending'){
   event.preventDefault();
   event.returnValue='Une sauvegarde du combat est encore en attente.';
  }
 };
 globalThis.addEventListener?.('beforeunload',entry.onBeforeUnload);
 try{
  const owners=worldOwners(),world=owners.readWorldState();
  if(globalThis.gensCurrentCaptureBattle){
   throw new Error('Un autre combat Capture est toujours actif.');
  }
  const initialHero=owners.activeHeroId(),initialWorldKey=owners.worldStorageKey();
  const initialWorld=JSON.stringify(world),initialProfile=JSON.stringify(owners.loadHeroState(initialHero));
  if(world?.last?.type!=='wild'||text(world.last.creatureId)!==requested){
   throw new Error('Cette rencontre sauvage n’est plus active dans le monde.');
  }
  // The original World owner is the ONLY source of an actual two-wild event.
  // Never infer a second enemy from a two-member trainer or turn a legacy
  // single wild into an invented 2v2. Off-field reserves are preserved
  // in 2v2, but recall/substitution is not available yet.
  const declared=world.last.creatureIds;
  if(declared!==undefined&&(!Array.isArray(declared)||
     ![1,2].includes(declared.length)||
     declared.some(id=>!text(id)||text(id)!==id)||
     declared[0]!==requested)){
   throw new TypeError('Rencontre sauvage du World invalide : créatures déclarées incompatibles.');
  }
  const wildIds=declared===undefined?[requested]:[...declared];
  const activeCount=wildIds.length;
  const hero=owners.loadHeroState(owners.activeHeroId());
  if(!Array.isArray(hero?.creatureTeam)||
     hero.creatureTeam.length!==activeCount||
     (activeCount===1&&(hero?.creatureReserve?.length??0)!==0)){
   throw new Error('Le groupe sauvegardé ne correspond pas aux créatures actives de cette rencontre officielle'+
    (activeCount===1?' (sans réserve).':'.'));
  }
  const {contract,port}=await existingPort();
  if(active!==entry||entry.closed)return false;
  if(port.status().installed)throw new Error('Un autre combat officiel est déjà actif.');
  const mountBattle=(context,source,hp,resources)=>createCaptureNativeLabSceneV1({
   host:entry.ui.host,siteBaseUrl:new URL('./',globalThis.document.baseURI),resources
  })(context,source,hp);
  const controller=await createCaptureOfficialHubCompositionV1({
   siteBaseUrl:new URL('./',globalThis.document.baseURI),
   owners,combatPort:port,validateBattleResult:contract.result,
   createProvider:createCaptureNativeLabProviderV1,mountBattle,
   onReturn:event=>{
    if(active!==entry)return;
    entry.ui.status.textContent=event.cancelled?'Combat annulé.':({
     victory:'Victoire !',defeat:'Défaite.',flee:'Fuite réussie.'
    }[event.outcome]||'Combat terminé.');
    close(entry);
   },
   onError:event=>{
    if(active===entry)visibleFailure(entry,event.error,{commitPending:event.commitPending});
   }
  });
  if(active!==entry||entry.closed){
   controller.dispose();return false;
  }
  entry.controller=controller;
  if(owners.activeHeroId()!==initialHero||owners.worldStorageKey()!==initialWorldKey||
     JSON.stringify(owners.readWorldState())!==initialWorld||
     JSON.stringify(owners.loadHeroState(initialHero))!==initialProfile){
   throw new Error('Le profil ou la rencontre sauvage a changé pendant le chargement du Labo.');
  }
  for(const speciesId of wildIds){
   if(!controller.resources.publishedSpecies.includes(speciesId)){
    throw new Error('Cette espèce ne possède pas encore de transfert officiel : '+speciesId);
   }
  }
  // The historical consented V1 migration owns ONLY a single creature.
  // Applying it to a pair would silently alter or overwrite saved members.
  // A paired World encounter therefore requires two already-authored compatible
  // members; the canonical saved-profile bridge validates both BEFORE writing
  // any World identity. Future 2v2 migration must be separately versioned.
  if(activeCount===1){
   const migration=createCaptureSavedProfileLabMigrationV1({
    activeHeroId:owners.activeHeroId,
    loadHeroState:owners.loadHeroState,saveHeroState:owners.saveHeroState,
    readEncounter:()=>owners.readWorldState()?.last,
    worldStorageKey:owners.worldStorageKey,
    authoredSource:controller.resources.authoredSource,
    readBattleSettings:()=>controller.resources.settings,
    combatSha:controller.resources.source.combatSha
   });
   const saved=owners.loadHeroState(owners.activeHeroId());
   if(!saved?.captureLabProfileMigrationV1){
    const plan=migration.prepare();
    if(plan.status==='migration-required'){
     const granted=globalThis.confirm?.(plan.consentText+'\n\n'+plan.explanation)===true;
     if(!granted){
      entry.ui.status.textContent='Migration refusée. Les sauvegardes sont intactes.';
      entry.ui.status.dataset.consent='declined';
      return false;
     }
     if(active!==entry||entry.closed)return false;
     migration.commit(plan,{acknowledged:plan.consentText});
    }
   }
  }
  if(active!==entry||entry.closed)return false;
  if(typeof globalThis.captureCloseModal==='function'){
   globalThis.captureCloseModal('captureEncounterModal');
  }
  entry.ui.status.textContent='Combat officiel du Labo en cours.';
  entry.ui.status.dataset.phase='running';
  const result=controller.startWildBattle(requested);
  entry.session=result?.session??null;
  entry.ui.back.textContent='Fuir';
  return !!result?.ready;
 }catch(error){
  visibleFailure(entry,error,{commitPending:entry.controller?.status().phase==='commit-pending'});
  return false;
 }
}
