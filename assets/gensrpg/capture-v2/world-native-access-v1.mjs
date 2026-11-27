// Capture composition only. The certified Exploration release owns every
// WorldDocument read, transaction and migration. No legacy writer or fallback.
const official=new URL('../../../vendor/exploration-lab/src/',import.meta.url);
export const CAPTURE_WORLD_ACCESS_CONTRACT_V1='release';
export async function loadCaptureNativeWorldAccessV1({
 root=globalThis,imports=uri=>import(uri),universeId=null
}={}){
 const storage=root.localStorage,sessionStorage=root.sessionStorage;
 const makeId=()=>root.crypto.randomUUID();
 if(!storage||!sessionStorage)throw Error('Stockage Exploration requis');
 const native=await imports(new URL('storage/world-document-release-access-v1.js',official).href);
 const access=await native.openWorldDocumentReleaseAccessV1({storage,sessionStorage,universeId,makeId});
 if(access?.durable!==true)throw Error('Propriétaire WorldDocument durable requis');
 return access;
}
// Guest transfer uses an additive native command only. Never repurpose the
// author's replace/archive command or write the WorldDocument in Capture.
export function captureWorldLibraryForAccessV1(access){
 if(!access||typeof access.importShared!=='function')throw Error('Accès WorldDocument officiel indisponible');
 return Object.freeze({list:()=>access.list(),load:id=>access.load(id),activate:id=>access.activate(id),
  save:(document,{replace=false}={})=>{
   if(replace!==false)throw Error('Écrasement de monde de salon interdit');
   return access.importShared(document,{confirmed:true});
  }});
}
