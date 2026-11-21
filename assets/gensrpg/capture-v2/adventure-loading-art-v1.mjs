// Single Capture presentation-only store for creator-uploaded loading art.
// The authoritative adventure, WorldDocument, audio and Combat result are untouched.
export const CAPTURE_LOADING_SCENES_V1=Object.freeze(['launch','zone','combat']);
const DB_NAME='gensrpg.capture.loading-art.v1';
const STORE='images';
const MAX_BYTES=8*1024*1024;
const MAX_PER_SCENE=12;
const types=new Set(['image/png','image/jpeg','image/webp','image/gif']);
const isScene=scene=>CAPTURE_LOADING_SCENES_V1.includes(scene);
export const LEGACY_CAPTURE_ART_UNIVERSE_ID_V1='monster-invoc';
export function captureArtUniverseIdV1(value=LEGACY_CAPTURE_ART_UNIVERSE_ID_V1){
 if(value===LEGACY_CAPTURE_ART_UNIVERSE_ID_V1||
    (typeof value==='string'&&/^unv_[a-z0-9-]{8,80}$/.test(value)))
  return value;
 throw new RangeError('Univers invalide pour la galerie de chargement');
}
const requestDone=request=>new Promise((resolve,reject)=>{
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error??new Error('IndexedDB indisponible'));
});
export async function createAdventureLoadingArtLibraryV1({
 indexedDB=globalThis.indexedDB,
 uuid=()=>globalThis.crypto.randomUUID(),
 url=globalThis.URL,
 universeId=LEGACY_CAPTURE_ART_UNIVERSE_ID_V1
}={}){
 if(!indexedDB?.open)throw new Error('Stockage des illustrations indisponible');
 const universe=captureArtUniverseIdV1(universeId);
 const req=indexedDB.open(DB_NAME,1);
 req.onupgradeneeded=()=>{
  if(!req.result.objectStoreNames.contains(STORE))
   req.result.createObjectStore(STORE,{keyPath:'id'});
 };
 const db=await requestDone(req);
 const readAll=()=>requestDone(db.transaction(STORE,'readonly').objectStore(STORE).getAll());
 const library=Object.freeze({
  async list(scene=null){
   if(scene!==null&&!isScene(scene))throw new RangeError('Type de chargement inconnu');
   const all=await readAll();
   return Object.freeze(all.filter(r=>
    (r.universeId??LEGACY_CAPTURE_ART_UNIVERSE_ID_V1)===universe&&
    (scene===null||r.scene===scene))
    .sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(Object.freeze));
  },
  async add(scene,files){
   if(!isScene(scene))throw new RangeError('Type de chargement inconnu');
   const selected=Array.from(files??[]);
   if(!selected.length)return Object.freeze([]);
   if(selected.some(f=>!types.has(f.type)||f.size<=0||f.size>MAX_BYTES))
    throw new TypeError('Images PNG, JPEG, WebP ou GIF de 8 Mio maximum');
   if((await library.list()).length+selected.length>MAX_PER_SCENE)
    throw new RangeError('Maximum de 12 illustrations dans la galerie');
   const inserted=[];
   // Store real Blobs without base64, archives or copies in the published site.
   for(const file of selected){
    const record={id:uuid(),universeId:universe,scene,name:file.name,blob:file,
     createdAt:new Date().toISOString()};
    await requestDone(db.transaction(STORE,'readwrite').objectStore(STORE).put(record));
    inserted.push(record.id);
   }
   return Object.freeze(inserted);
  },
  async remove(id){
   if(typeof id!=='string'||!id)throw new TypeError('Illustration inconnue');
   const record=await requestDone(db.transaction(STORE,'readonly').objectStore(STORE).get(id));
   if(!record||(record.universeId??LEGACY_CAPTURE_ART_UNIVERSE_ID_V1)!==universe)
    throw new Error('Illustration absente de cet univers : aucun autre contenu modifié');
   await requestDone(db.transaction(STORE,'readwrite').objectStore(STORE).delete(id));
  },
  // Each launch supplies scoped blob URLs, revocable by the owning Capture UI.
  async urls(scene){
   const entries=await library.list(scene);
   return Object.freeze(entries.map(item=>url.createObjectURL(item.blob)));
  },
  close(){db.close();}
 });
 return library;
}
export function captureLoadingArtSequenceV1(urls,cursor=0){
 if(!Array.isArray(urls)||!Number.isSafeInteger(cursor)||cursor<0)
  throw new TypeError('Rotation des illustrations invalide');
 if(!urls.every(value=>typeof value==='string'&&value.startsWith('blob:')))
  throw new TypeError('Les visuels personnalisés doivent être locaux');
 if(!urls.length)return Object.freeze([]);
 const start=cursor%urls.length;
 return Object.freeze([...urls.slice(start),...urls.slice(0,start)]);
}
