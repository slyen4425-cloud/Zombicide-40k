// Shell-only presentation authoring for ONE Capture universe.
// No Combat, AdventureRules, WorldDocument, saved game or soundtrack engine.
// Media Blobs stay in IndexedDB, never in localStorage/base64 or published JS.
import {
 createAdventureLoadingArtLibraryV1,captureArtUniverseIdV1,
 CAPTURE_LOADING_SCENES_V1
} from './adventure-loading-art-v1.mjs';

export const CAPTURE_SHELL_CREATOR_SETTINGS_PREFIX_V1=
 'gensrpg.capture.shell.creator.settings.v1:';
export const CAPTURE_SHELL_MEDIA_SLOTS_V1=Object.freeze([
 'background','ambience','click','confirm','back','error'
]);
const STORE='assets',DB='gensrpg.capture.shell-media.v1';
const MIME_IMAGE=new Set(['image/png','image/jpeg','image/webp']);
const MIME_SOUND=new Set(['audio/mpeg','audio/mp3','audio/wav',
 'audio/x-wav','audio/ogg','audio/mp4','audio/aac']);
const IMAGE_MAX=8*1024*1024,SOUND_MAX=12*1024*1024;
const DEFAULT=Object.freeze({
 menuVolume:35,interfaceVolume:55,ambienceEnabled:false,backgroundShade:55
});
const bounded=(n,low,high)=>Number.isSafeInteger(n)&&n>=low&&n<=high;
export function normalizeCaptureShellCreatorSettingsV1(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
    Object.keys(raw).some(k=>!Object.hasOwn(DEFAULT,k)))
  throw new TypeError('Réglages d’habillage invalides');
 const value={...DEFAULT,...raw};
 if(!bounded(value.menuVolume,0,100)||
    !bounded(value.interfaceVolume,0,100)||
    !bounded(value.backgroundShade,0,85)||
    typeof value.ambienceEnabled!=='boolean')
  throw new RangeError('Volume ou contraste d’habillage invalide');
 return Object.freeze(value);
}
export function captureShellCreatorSettingsKeyV1(universeId){
 return CAPTURE_SHELL_CREATOR_SETTINGS_PREFIX_V1+
  captureArtUniverseIdV1(universeId);
}
export function validateCaptureShellMediaV1(slot,file){
 if(!CAPTURE_SHELL_MEDIA_SLOTS_V1.includes(slot)||
    !file||typeof file!=='object'||typeof file.type!=='string')
  throw new TypeError('Média d’interface inconnu');
 const image=slot==='background';
 if(!(image?MIME_IMAGE:MIME_SOUND).has(file.type)||
    !Number.isFinite(file.size)||file.size<=0||
    file.size>(image?IMAGE_MAX:SOUND_MAX))
  throw new RangeError(image
   ?'Fond : PNG/JPEG/WebP, 8 Mio maximum'
   :'Son : MP3/WAV/OGG/AAC, 12 Mio maximum');
 return true;
}
const requestDone=request=>new Promise((resolve,reject)=>{
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error??new Error('Médiathèque indisponible'));
});
export async function createCaptureShellMediaLibraryV1({
 indexedDB=globalThis.indexedDB
}={}){
 if(!indexedDB?.open)throw new Error('Médiathèque du créateur indisponible');
 const req=indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{
  if(!req.result.objectStoreNames.contains(STORE))
   req.result.createObjectStore(STORE,{keyPath:'key'});
 };
 const db=await requestDone(req);
 const key=(universeId,slot)=>{
  if(!CAPTURE_SHELL_MEDIA_SLOTS_V1.includes(slot))
   throw new RangeError('Emplacement média inconnu');
  return captureArtUniverseIdV1(universeId)+'/'+slot;
 };
 return Object.freeze({
  async get(universeId,slot){
   return (await requestDone(db.transaction(STORE,'readonly')
    .objectStore(STORE).get(key(universeId,slot))))??null;
  },
  async put(universeId,slot,file){
   validateCaptureShellMediaV1(slot,file);
   const record={key:key(universeId,slot),name:String(file.name??slot).slice(0,100),
    blob:file,type:file.type,updatedAt:new Date().toISOString()};
   await requestDone(db.transaction(STORE,'readwrite')
    .objectStore(STORE).put(record));
   return Object.freeze(record);
  },
  async remove(universeId,slot){
   await requestDone(db.transaction(STORE,'readwrite')
    .objectStore(STORE).delete(key(universeId,slot)));
  },
  close(){db.close();}
 });
}

const make=(doc,tag,text,className)=>{
 const node=doc.createElement(tag);
 if(text!==undefined)node.textContent=text;
 if(className)node.className=className;
 return node;
};
// One coordinator for Shell-only media + reuse of the existing loading gallery.
// The native game never receives the UI event sounds or its ambient loop.
export function createCaptureShellCreatorV1({
 root,host,container,notice
}={}){
 if(!root?.document||!container||!host)
  throw new TypeError('Hôte Capture requis');
 const doc=root.document;
 let universe='monster-invoc',name='Monster InvoC';
 let settings=DEFAULT,media=null,loading=null,disposed=false;
 let epoch=0,active=false,mediaUrls=new Map(),soundPlayers=new Map();
 const previews=new Set();
 const effectSlots=['click','confirm','back','error'];
 let statusLine=null,backgroundUrl=null;
 const report=(value,error=false)=>{
  if(statusLine){statusLine.textContent=value;statusLine.dataset.error=String(error);}
  if(error&&notice){notice.textContent=value;notice.dataset.error='true';}
 };
 const readSettings=()=>{
  const raw=root.localStorage?.getItem(captureShellCreatorSettingsKeyV1(universe));
  if(!raw)return DEFAULT;
  try{return normalizeCaptureShellCreatorSettingsV1(JSON.parse(raw));}
  catch(error){report('Réglages non reconnus : valeurs par défaut en lecture, rien effacé.',true);
   return DEFAULT;}
 };
 const persist=()=>{
  root.localStorage?.setItem(captureShellCreatorSettingsKeyV1(universe),
   JSON.stringify(settings));
 };
 function revokeUrls(){
  for(const url of previews)root.URL.revokeObjectURL(url);
  previews.clear();
  for(const value of soundPlayers.values()){value.pause?.();value.src='';}
  soundPlayers.clear();
  for(const url of mediaUrls.values())root.URL.revokeObjectURL(url);
  mediaUrls.clear();backgroundUrl=null;
 }
 function applyBackground(){
  if(disposed)return;
  const shown=host.dataset.view==='home';
  host.style?.setProperty('--capture-home-shade',
   String(settings.backgroundShade/100));
  if(shown&&backgroundUrl){
   host.style?.setProperty('--capture-home-art','url("'+backgroundUrl+'")');
   host.dataset.creatorWallpaper='true';
  }else{
   host.style?.removeProperty('--capture-home-art');
   delete host.dataset.creatorWallpaper;
  }
 }
 const audioFor=(url,loop=false)=>{
  if(typeof root.Audio!=='function')return null;
  const player=new root.Audio(url);
  player.loop=loop;
  player.preload='auto';
  return player;
 };
 function stopAmbient(){
  const p=soundPlayers.get('ambience');
  if(p){p.pause();p.currentTime=0;}
 }
 function enterHome(){
  active=true;applyBackground();
  if(settings.ambienceEnabled){
   const p=soundPlayers.get('ambience');
   if(p){p.volume=settings.menuVolume/100;
    void p.play().catch(()=>{/* browser requires an active user gesture */});}
  }
 }
 function leaveHome(){
  active=false;stopAmbient();applyBackground();
 }
 function play(slot){
  if(!effectSlots.includes(slot)||!active)return false;
  const audio=soundPlayers.get(slot);
  if(!audio)return false;
  audio.pause();audio.currentTime=0;
  audio.volume=settings.interfaceVolume/100;
  void audio.play().catch(()=>{/* silent default if mobile blocks playback */});
  return true;
 }
 async function loadUniverse(nextUniverse,nextName='Monster InvoC'){
  universe=captureArtUniverseIdV1(nextUniverse);
  name=String(nextName??universe);
  const current=++epoch;
  stopAmbient();revokeUrls();settings=readSettings();applyBackground();
  try{
   if(!media)media=await createCaptureShellMediaLibraryV1({indexedDB:root.indexedDB});
   if(current!==epoch||disposed)return;
   const results=await Promise.all(CAPTURE_SHELL_MEDIA_SLOTS_V1.map(slot=>
    media.get(universe,slot)));
   if(current!==epoch||disposed)return;
   for(let i=0;i<results.length;i++){
    const record=results[i],slot=CAPTURE_SHELL_MEDIA_SLOTS_V1[i];
    if(!record)continue;
    const url=root.URL.createObjectURL(record.blob);
    mediaUrls.set(slot,url);
    if(slot==='background')backgroundUrl=url;
    else{
     const player=audioFor(url,slot==='ambience');
     if(player)soundPlayers.set(slot,player);
    }
   }
   applyBackground();
   if(container.dataset.active==='true')await render();
  }catch(error){report('Médias du créateur indisponibles : '+error.message,true);}
 }
 async function render(){
  if(disposed||container.dataset.active!=='true')return;
  for(const url of previews)root.URL.revokeObjectURL(url);
  previews.clear();container.replaceChildren();
  const heading=make(doc,'h2','Créateur · '+name);
  const help=make(doc,'p',
   'Personnalise l’accueil et les transitions de cet univers, sans modifier les sons ni les règles en jeu.');
  statusLine=make(doc,'output','Choisis un réglage ; les changements sont conservés localement.');
  statusLine.className='captureCreatorStatus';
  const back=make(doc,'button','← Retour au menu');
  back.type='button';back.className='gensCaptureV2MenuBack';
  back.addEventListener('click',()=>root.GensCaptureV2?.home?.());
  container.append(back,heading,help,statusLine);

  const bg=make(doc,'details',undefined,'captureCreatorGroup');
  bg.append(make(doc,'summary','🖼 Fond de l’application et lisibilité'));
  const preview=make(doc,'div',undefined,'captureCreatorBgPreview');
  preview.style.backgroundImage=backgroundUrl?'url("'+backgroundUrl+'")':'';
  preview.textContent=backgroundUrl?'Aperçu du fond actuel':'Fond standard de Monster InvoC';
  const shadeLabel=make(doc,'label','Contraste du fond · '+settings.backgroundShade+' %');
  const shade=make(doc,'input');shade.type='range';shade.min='0';shade.max='85';
  shade.step='5';shade.value=String(settings.backgroundShade);
  shade.addEventListener('input',()=>{
   settings=normalizeCaptureShellCreatorSettingsV1({
    ...settings,backgroundShade:Number(shade.value)});
   shadeLabel.firstChild.textContent='Contraste du fond · '+shade.value+' %';
   persist();applyBackground();
  });
  shadeLabel.append(shade);
  const bgInput=make(doc,'input');bgInput.type='file';
  bgInput.accept='image/png,image/jpeg,image/webp';
  bgInput.setAttribute('aria-label','Importer le fond d’accueil');
  bgInput.addEventListener('change',async()=>{
   if(!bgInput.files?.[0])return;
   try{
    if(!media)throw Error('Médiathèque indisponible');
    await media.put(universe,'background',bgInput.files[0]);
    await loadUniverse(universe,name);
    report('Fond de cet univers enregistré.');
   }catch(error){report(error.message,true);}
  });
  const bgRemove=make(doc,'button','Réinitialiser le fond');bgRemove.type='button';
  bgRemove.addEventListener('click',async()=>{
   try{await media.remove(universe,'background');await loadUniverse(universe,name);
    report('Fond standard restauré pour cet univers.');}
   catch(error){report(error.message,true);}
  });
  bg.append(preview,shadeLabel,bgInput,bgRemove);container.append(bg);

  const sound=make(doc,'details',undefined,'captureCreatorGroup');
  sound.append(make(doc,'summary','🔊 Sons d’interface et musique du menu'));
  const tip=make(doc,'p',
   'Ces sons ne jouent que dans les menus de Monster Capture, jamais pendant l’exploration ou le combat.');
  sound.append(tip);
  function settingSlider(label,key){
   const line=make(doc,'label',label+' · '+settings[key]+' %');
   const control=make(doc,'input');control.type='range';control.min='0';
   control.max='100';control.step='5';control.value=String(settings[key]);
   control.addEventListener('input',()=>{
    settings=normalizeCaptureShellCreatorSettingsV1({...settings,[key]:Number(control.value)});
    line.firstChild.textContent=label+' · '+settings[key]+' %';
    persist();
    const p=soundPlayers.get('ambience');
    if(p)p.volume=settings.menuVolume/100;
   });
   line.append(control);sound.append(line);
  }
  const checked=make(doc,'label');
  const toggle=make(doc,'input');toggle.type='checkbox';
  toggle.checked=settings.ambienceEnabled;
  toggle.addEventListener('change',()=>{
   settings=normalizeCaptureShellCreatorSettingsV1({
    ...settings,ambienceEnabled:toggle.checked});
   persist();
   if(toggle.checked&&active)enterHome();
   else stopAmbient();
  });
  checked.append(toggle,doc.createTextNode(' Activer la musique d’ambiance du menu'));
  sound.append(checked);
  settingSlider('Volume musique','menuVolume');
  settingSlider('Volume boutons','interfaceVolume');
  for(const [slot,label] of [
   ['ambience','Musique du menu (boucle)'],['click','Bouton / clic'],
   ['confirm','Validation'],['back','Retour / navigation'],
   ['error','Erreur / refus']]){
   const group=make(doc,'div',undefined,'captureCreatorSoundSlot');
   const title=make(doc,'strong',label);
   const file=make(doc,'input');file.type='file';
   file.accept='audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a';
   file.setAttribute('aria-label','Importer '+label);
   file.addEventListener('change',async()=>{
    if(!file.files?.[0])return;
    try{await media.put(universe,slot,file.files[0]);
     await loadUniverse(universe,name);
     report(label+' enregistré pour cet univers.');}
    catch(error){report(error.message,true);}
   });
   const test=make(doc,'button','▶ Écouter');test.type='button';
   test.addEventListener('click',()=>{
    const p=soundPlayers.get(slot);
    if(!p){report('Aucun son enregistré pour '+label,true);return;}
    p.pause();p.currentTime=0;
    p.volume=(slot==='ambience'?settings.menuVolume:settings.interfaceVolume)/100;
    void p.play().catch(()=>report('Lecture bloquée sur ce navigateur.',true));
   });
   const reset=make(doc,'button','Retirer');reset.type='button';
   reset.addEventListener('click',async()=>{
    try{await media.remove(universe,slot);await loadUniverse(universe,name);
     report('Son retiré : '+label);}
    catch(error){report(error.message,true);}
   });
   group.append(title,file,test,reset);sound.append(group);
  }
  container.append(sound);

  const art=make(doc,'details',undefined,'captureCreatorGroup');
  art.append(make(doc,'summary','🌄 Illustrations de chargement (fondu et rotation)'));
  art.append(make(doc,'p',
   'Cette galerie est celle utilisée par Jouer et par les transitions. Maximum de 12 images par univers ; aucune image de Donjon n’est modifiée.'));
  const scene=make(doc,'select');
  for(const [value,label] of [['launch','Démarrage'],['zone','Passage de zone'],
    ['combat','Combat']]){
   const option=make(doc,'option',label);option.value=value;scene.append(option);
  }
  scene.setAttribute('aria-label','Scène de chargement');
  const artInput=make(doc,'input');artInput.type='file';artInput.multiple=true;
  artInput.accept='image/png,image/jpeg,image/webp,image/gif';
  artInput.setAttribute('aria-label','Ajouter plusieurs illustrations de chargement');
  const artList=make(doc,'div',undefined,'captureCreatorArtGallery');
  async function showArt(){
   for(const url of previews)root.URL.revokeObjectURL(url);
   previews.clear();artList.replaceChildren();
   if(!loading)loading=await createAdventureLoadingArtLibraryV1({
    indexedDB:root.indexedDB,universeId:universe,uuid:()=>root.crypto.randomUUID(),url:root.URL
   });
   const images=await loading.list();
   if(!images.length)artList.append(make(doc,'p','Illustration officielle utilisée par défaut.'));
   for(const image of images){
    const row=make(doc,'div',undefined,'captureCreatorArtItem');
    const url=root.URL.createObjectURL(image.blob);previews.add(url);
    const thumbnail=make(doc,'img');thumbnail.src=url;thumbnail.alt=image.name;
    const text=make(doc,'span',image.name+' · '+image.scene);
    const remove=make(doc,'button','Retirer');remove.type='button';
    remove.addEventListener('click',async()=>{
     try{await loading.remove(image.id);await showArt();}
     catch(error){report(error.message,true);}
    });
    row.append(thumbnail,text,remove);artList.append(row);
   }
  }
  artInput.addEventListener('change',async()=>{
   if(!artInput.files?.length)return;
   try{await loading.add(scene.value,artInput.files);await showArt();
    artInput.value='';report('Illustrations enregistrées pour cet univers.');}
   catch(error){report(error.message,true);}
  });
  art.append(scene,artInput,artList);container.append(art);
  try{loading?.close();loading=null;await showArt();}
  catch(error){report('Galerie de chargement indisponible : '+error.message,true);}
 }
 return Object.freeze({
  selectUniverse:loadUniverse,
  async show(){
   container.dataset.active='true';await render();enterHome();
  },
  hide(){container.dataset.active='false';},
  enterHome,leaveHome,play,stopAmbient,
  async reload(){await loadUniverse(universe,name);},
  stop(){
   disposed=true;++epoch;active=false;stopAmbient();revokeUrls();
   loading?.close();loading=null;container.replaceChildren();
   host.style?.removeProperty('--capture-home-art');
   delete host.dataset.creatorWallpaper;
  }
 });
}
