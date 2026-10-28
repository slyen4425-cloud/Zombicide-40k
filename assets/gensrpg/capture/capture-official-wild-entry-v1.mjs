// Single opt-in ESM implementation INVOKED BY the original Capture World
// captureStartWildBattle declaration. Never installs a replacement window
// function, a second combat simulation, a duplicate storage writer or a timer.
import {createCaptureOfficialHubCompositionV1} from './capture-official-hub-composition-v1.mjs';
import {createCaptureOfficialBattleViewV1} from './capture-official-battle-view-v1.mjs';
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
 const back=doc.createElement('button');back.type='button';back.textContent='Retour au monde';
 const retry=doc.createElement('button');retry.type='button';
 retry.textContent='Réessayer la sauvegarde';retry.hidden=true;
 for(const button of [back,retry]){
  button.style.minHeight='44px';button.style.minWidth='160px';
  button.style.background='#386848';button.style.color='#fff';
  button.style.border='1px solid #b4d5bc';button.style.borderRadius='8px';
  row.appendChild(button);
 }
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
 const entry={closed:false,controller:null,ui:createDialog(),onPageHide:null};
 active=entry;
 entry.ui.back.addEventListener('click',()=>{
  try{
   if(entry.controller?.status().phase==='running')entry.controller.cancel();
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
 try{
  const owners=worldOwners(),world=owners.readWorldState();
  if(world?.last?.type!=='wild'||text(world.last.creatureId)!==requested){
   throw new Error('Cette rencontre sauvage n’est plus active dans le monde.');
  }
  const hero=owners.loadHeroState(owners.activeHeroId());
  if(hero?.creatureTeam?.length!==1||(hero?.creatureReserve?.length??0)!==0){
   throw new Error('Le moteur officiel ne prend pas encore en charge cette équipe ou ses réserves (1v1 uniquement).');
  }
  const {contract,port}=await existingPort();
  if(active!==entry||entry.closed)return false;
  if(port.status().installed)throw new Error('Un autre combat officiel est déjà actif.');
  const mountBattle=createCaptureOfficialBattleViewV1({
   host:entry.ui.host,assetResolver:globalThis.GensAssetResolverV1
  });
  const controller=await createCaptureOfficialHubCompositionV1({
   siteBaseUrl:new URL('./',globalThis.document.baseURI),
   owners,combatPort:port,validateBattleResult:contract.result,
   mountBattle,
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
  const migration=createCaptureSavedProfileLabMigrationV1({
   activeHeroId:owners.activeHeroId,
   loadHeroState:owners.loadHeroState,saveHeroState:owners.saveHeroState,
   readEncounter:()=>owners.readWorldState()?.last,
   worldStorageKey:owners.worldStorageKey,
   authoredSource:controller.resources.authoredSource,
   readBattleSettings:()=>controller.resources.settings,
   combatSha:controller.resources.source.combatSha
  });
  // Existing versioned migration stays the sole historical archive. Never
  // overwrite it, and let the same strict Battle Bridge validate the result.
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
  if(active!==entry||entry.closed)return false;
  if(typeof globalThis.captureCloseModal==='function'){
   globalThis.captureCloseModal('captureEncounterModal');
  }
  entry.ui.status.textContent='Combat officiel du Labo en cours.';
  entry.ui.status.dataset.phase='running';
  const result=controller.startWildBattle(requested);
  return !!result?.ready;
 }catch(error){
  visibleFailure(entry,error,{commitPending:entry.controller?.status().phase==='commit-pending'});
  return false;
 }
}
