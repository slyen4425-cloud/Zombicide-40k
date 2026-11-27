// Capture composition only. WorldDocument storage, serializer, allocation and
// transactions belong exclusively to Exploration. The immutable release
// selects one contract; failure never triggers a second writer or fallback.
const official=new URL('../../../vendor/exploration-lab/src/',import.meta.url);
// The current certified pin predates the release access module.
// Remove the legacy compatibility branch when #561 is certified and pinned.
export const CAPTURE_WORLD_ACCESS_CONTRACT_V1='legacy';
export async function loadCaptureNativeWorldAccessV1({
 root=globalThis,imports=uri=>import(uri),universeId=null,
 contract=CAPTURE_WORLD_ACCESS_CONTRACT_V1
}={}){
 const storage=root.localStorage,sessionStorage=root.sessionStorage;
 const makeId=()=>root.crypto.randomUUID();
 if(!storage||!sessionStorage)throw Error('Stockage Exploration requis');
 const load=path=>imports(new URL(path,official).href);
 if(contract==='release'){
  const native=await load('storage/world-document-release-access-v1.js');
  return native.openWorldDocumentReleaseAccessV1({storage,sessionStorage,universeId,makeId});
 }
 if(contract!=='legacy')throw Error('Contrat WorldDocument non certifié');
 const [worlds,library,handoff,workspace]=await Promise.all([
  load('builder/exploration-universe-world-projects-v1.js'),
  load('builder/exploration-world-document-library-v1.js'),
  load('builder/world-assembler-handoff.js'),
  load('storage/exploration-universe-workspace-storage-v1.js')
 ]);
 const projects=worlds.createExplorationUniverseWorldProjectsV1({storage,makeId});
 const archive=library.createExplorationWorldDocumentLibraryV1({storage});
 const scoped=universeId===null?storage:workspace.createExplorationUniverseWorkspaceStorageV1(storage,universeId);
 const readDraft=async()=>{
  const result=handoff.readWorldAssemblerDraft(scoped);
  if(!result&&scoped.getItem(handoff.WORLD_ASSEMBLER_DRAFT_KEY)!==null)
   throw Error('WorldDocument actif illisible : aucune récupération destructive');
  if(result&&universeId!==null)projects.load(universeId,result.id);
  return result;
 };
 return Object.freeze({durable:false,...(universeId===null?{projects}:{}),readDraft,
  async list(){return universeId===null?archive.list():projects.list(universeId);},
  async load(id){return universeId===null?archive.load(id):projects.load(universeId,id);},
  async activate(id){return universeId===null?archive.activate(id):projects.activate(universeId,id);},
  async importShared(document,{confirmed=false}={}){
   if(confirmed!==true)throw Error('Import du salon non confirmé');
   if(universeId!==null)throw Error('Import de salon par univers : raccord Exploration durable requis');
   return archive.save(document,{replace:false});
  }
 });
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
