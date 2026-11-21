// Read-only adapter to the already-shipped, SHA-pinned Combat/Exploration audio.
// Never copy MP3s, change their owner, or write a second audio catalogue.
const COMBAT=new URL('../../../vendor/exploration-lab/combat-preview/',import.meta.url);
const EXPLORATION=new URL('../../../vendor/exploration-lab/',import.meta.url);
const MUSIC_PREFIX='gensrpg:music:';
const SOUND_PREFIX='gensrpg:sound:';
const absolute=(base,relative)=>new URL(relative,base).href;

export function createCaptureShellOfficialAudioChoicesV1({
 soundEntries,resolveEffect,musicAssets,resolveMusic,explorationIds,explorationTracks
}={}){
 if(!Array.isArray(soundEntries)||!Array.isArray(musicAssets)||
    !Array.isArray(explorationIds)||!Array.isArray(explorationTracks)||
    explorationIds.length!==explorationTracks.length||
    typeof resolveEffect!=='function'||typeof resolveMusic!=='function')
  throw new TypeError('Catalogue audio officiel incomplet');
 const seen=new Set();
 const insert=(assetId,label,kind,url,roles=[])=>{
  if(typeof assetId!=='string'||!assetId.startsWith(
    kind==='music'?MUSIC_PREFIX:SOUND_PREFIX)||
    seen.has(assetId)||typeof label!=='string'||!label.trim()||
    typeof url!=='string'||!url.startsWith('file:')&&!url.startsWith('https:'))
   throw new TypeError('Entrée audio officielle invalide ou doublonnée');
  seen.add(assetId);
  return Object.freeze({assetId,label:label.trim(),kind,url,
   roles:Object.freeze([...roles])});
 };
 const effects=soundEntries.map(entry=>{
  const resolved=resolveEffect(entry.assetId);
  if(!resolved||resolved.assetId!==entry.assetId||
     typeof entry.runtimeFile!=='string'||
     !/^private-v1\/[a-z0-9_-]+\.mp3$/.test(entry.runtimeFile)||
     resolved.url!==absolute(COMBAT,'assets/runtime/audio/'+entry.runtimeFile))
   throw new TypeError('Résolution sonore Combat non officielle');
  return insert(entry.assetId,entry.label,'effect',resolved.url,entry.roles??[]);
 }).sort((a,b)=>Number(b.roles.includes('ui'))-Number(a.roles.includes('ui'))||
   a.label.localeCompare(b.label,'fr'));
 const music=[];
 for(const entry of musicAssets.filter(x=>x.kind==='music')){
  const resolved=resolveMusic(entry.assetId);
  if(!resolved)continue; // Exploration has its own certified native owner below.
  if(resolved.assetId!==entry.assetId||
     !resolved.url.startsWith(absolute(COMBAT,'assets/runtime/audio/music-v1/')))
   throw new TypeError('Piste musicale Combat non officielle');
  music.push(insert(entry.assetId,entry.title,'music',resolved.url));
 }
 for(let i=0;i<explorationIds.length;i++){
  const id=explorationIds[i],file=explorationTracks[i]?.file;
  if(id!==(MUSIC_PREFIX+'exploration:0'+(i+1))||
     file!=='exploration-0'+(i+1)+'.mp3')
   throw new TypeError('Piste Exploration hors catalogue officiel');
  music.push(insert(id,'Exploration '+(i+1),'music',
   absolute(EXPLORATION,'assets/runtime/audio/exploration-v1/'+file)));
 }
 const byId=new Map([...effects,...music].map(x=>[x.assetId,x]));
 return Object.freeze({effects:Object.freeze(effects),music:Object.freeze(music),
  get:assetId=>byId.get(assetId)??null});
}

export async function loadCaptureShellOfficialAudioCatalogV1({
 fetcher=globalThis.fetch,importer=specifier=>import(specifier)
}={}){
 if(typeof fetcher!=='function'||typeof importer!=='function')
  throw new TypeError('Chargeur du catalogue audio manquant');
 const [response,effects,music,starter,exploration]=await Promise.all([
  fetcher(absolute(COMBAT,'data/presentation/audio/private-audio-runtime.v1.json')),
  importer(absolute(COMBAT,'src/assets/private-audio-runtime-library-v1.js')),
  importer(absolute(COMBAT,'src/assets/soundtrack-runtime-library-v1.js')),
  importer(absolute(COMBAT,'src/assets/soundtrack-starter-catalog-v1.js')),
  importer(absolute(EXPLORATION,'src/audio/exploration-soundtrack-v1.js'))
 ]);
 if(!response?.ok)throw new Error('Catalogue sonore officiel non disponible');
 const metadata=await response.json();
 if(metadata?.schema!=='gensrpg-private-audio-runtime-v1'||
    !Array.isArray(metadata.entries)||metadata.entries.length!==metadata.count||
    metadata.entries.length<1)
  throw new TypeError('Métadonnées audio officielles invalides');
 return createCaptureShellOfficialAudioChoicesV1({
  soundEntries:metadata.entries,
  resolveEffect:effects.privateAudioRuntimeAssetV1,
  musicAssets:starter.SOUNDTRACK_STARTER_CATALOG_V1.assets,
  resolveMusic:music.soundtrackRuntimeAssetV1,
  explorationIds:starter.SOUNDTRACK_STARTER_EXPLORATION_IDS_V1,
  explorationTracks:exploration.EXPLORATION_TRACKS_V1
 });
}
