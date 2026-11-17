// Capture's ONLY universe/project index. Not a second WorldDocument, Combat
// database, HeroDefinition, rules engine or AdventureSave serializer.
// Existing Monster InvoC data is a read-through legacy project: untouched.
export const CAPTURE_UNIVERSE_INDEX_KEY_V1='gensrpg.capture.v2.universes.index.v1';
export const MONSTER_INVOC_UNIVERSE_ID_V1='monster-invoc';
const SCHEMA='gensrpg.capture.v2.universes.index.v1';
const idPattern=/^unv_[a-z0-9-]{8,80}$/;
const nameValue=value=>{
 const name=typeof value==='string'?value.trim():'';
 if(!name||name.length>80||[...name].some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===127))
  throw new TypeError('Nom d’univers invalide (1 à 80 caractères)');
 return name;
};
const projectShape=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 (Object.keys(p).sort().join(',')==='content,id,name,status'||
  Object.keys(p).sort().join(',')==='content,id,name,sourceId,sourceWorldId,status')&&
 idPattern.test(p.id)&&nameValue(p.name)===p.name&&
 (p.status==='pending'||p.status==='ready')&&
 (!Object.hasOwn(p,'sourceId')||
  ((p.sourceId===null||idPattern.test(p.sourceId))&&
   (p.sourceWorldId===null||
    (typeof p.sourceWorldId==='string'&&/^world-[a-z0-9-]{8,80}$/.test(p.sourceWorldId)))))&&
 (p.status==='pending'?p.content===null:contentShape(p.content));
const contentShape=c=>c&&typeof c==='object'&&!Array.isArray(c)&&
 Object.keys(c).sort().join(',')==='combatProjectId,heroProjectId,rulesProjectId,worldProjectId'&&
 Object.values(c).every(v=>typeof v==='string'&&idPattern.test(v));
const emptyIndex=()=>({
 schema:SCHEMA,version:1,legacyName:'Monster InvoC',
 selectedId:MONSTER_INVOC_UNIVERSE_ID_V1,projects:[]
});
function validateIndex(doc){
 if(!doc||typeof doc!=='object'||Array.isArray(doc)||
  Object.keys(doc).sort().join(',')!=='legacyName,projects,schema,selectedId,version'||
  doc.schema!==SCHEMA||doc.version!==1||nameValue(doc.legacyName)!==doc.legacyName||
  !Array.isArray(doc.projects)||doc.projects.length>100||
  !doc.projects.every(projectShape)||
  new Set(doc.projects.map(p=>p.id)).size!==doc.projects.length||
  (doc.selectedId!==MONSTER_INVOC_UNIVERSE_ID_V1&&
   !doc.projects.some(p=>p.id===doc.selectedId)))
  throw new Error('Bibliothèque des univers corrompue : aucune réinitialisation automatique');
 return doc;
}
export function createCaptureUniverseProjectStoreV1({storage,coreStorage,makeId}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  !coreStorage||typeof coreStorage.readJson!=='function'||
  typeof coreStorage.writeJson!=='function'||typeof makeId!=='function')
  throw new TypeError('Core Storage et générateur d’identifiants officiels requis');
 function read(){
  if(storage.getItem(CAPTURE_UNIVERSE_INDEX_KEY_V1)===null)return emptyIndex();
  return validateIndex(coreStorage.readJson(storage,CAPTURE_UNIVERSE_INDEX_KEY_V1,null));
 }
 function write(doc){
  const checked=validateIndex(doc);
  coreStorage.writeJson(storage,CAPTURE_UNIVERSE_INDEX_KEY_V1,checked);
  return checked;
 }
 function byId(id,doc=read()){
  if(id===MONSTER_INVOC_UNIVERSE_ID_V1)
   return Object.freeze({id,name:doc.legacyName,status:'ready',
    content:null,legacy:true});
  const p=doc.projects.find(p=>p.id===id);
  if(!p)throw new Error('Univers introuvable : aucune sauvegarde modifiée');
  return Object.freeze({...p,legacy:false});
 }
 function list(){
  const doc=read();
  return Object.freeze([byId(MONSTER_INVOC_UNIVERSE_ID_V1,doc),
   ...doc.projects.map(p=>byId(p.id,doc))]);
 }
 function create(name,{sourceId=null,sourceWorldId=null}={}){
  const validName=nameValue(name),doc=read();
  if(sourceId!==null){
   if(!idPattern.test(sourceId)||sourceId===MONSTER_INVOC_UNIVERSE_ID_V1||
      !doc.projects.some(p=>p.id===sourceId&&p.status==='ready'))
    throw new Error('Univers à copier absent ou non initialisé : aucun clone global');
  }
  if(sourceWorldId!==null&&
     (sourceId===null||typeof sourceWorldId!=='string'||
      !/^world-[a-z0-9-]{8,80}$/.test(sourceWorldId)))
   throw new Error('Une carte de référence exige un univers source valide');
  const id='unv_'+String(makeId()).toLowerCase();
  if(!idPattern.test(id)||doc.projects.some(p=>p.id===id))
   throw new Error('Identifiant d’univers généré invalide ou déjà utilisé');
  if(doc.projects.some(p=>p.name.toLocaleLowerCase('fr')===
    validName.toLocaleLowerCase('fr'))||
    doc.legacyName.toLocaleLowerCase('fr')===validName.toLocaleLowerCase('fr'))
   throw new Error('Un univers porte déjà ce nom');
  // Persist intent before any cross-owner write. Retrying a partial copy
  // must never silently create blank Combat or World files.
  const project={id,name:validName,status:'pending',content:null,
   sourceId,sourceWorldId};
  write({...doc,projects:[...doc.projects,project],selectedId:id});
  return byId(id);
 }
 function rename(id,name){
  const validName=nameValue(name),doc=read();
  byId(id,doc);
  if([doc.legacyName,...doc.projects.map(p=>p.name)]
    .some((v,i)=>v.toLocaleLowerCase('fr')===validName.toLocaleLowerCase('fr')&&
    (i===0?MONSTER_INVOC_UNIVERSE_ID_V1:doc.projects[i-1].id)!==id))
   throw new Error('Ce nom appartient à un autre univers');
  const next=id===MONSTER_INVOC_UNIVERSE_ID_V1?
   {...doc,legacyName:validName}:
   {...doc,projects:doc.projects.map(p=>p.id===id?{...p,name:validName}:p)};
  write(next);return byId(id);
 }
 function select(id){
  const doc=read();byId(id,doc);
  if(doc.selectedId!==id)write({...doc,selectedId:id});
  return byId(id);
 }
 // A game/editor cannot enter a new universe until its THREE native Lab
 // owners and Capture Rules owner have provisioned independent data refs.
 // Never claim isolation by changing a title or pointing to shared data.
 function provision(id,content,verifyOwners){
  const doc=read(),existing=byId(id,doc);
  if(existing.legacy||existing.status!=='pending'||!contentShape(content))
   throw new Error('Provisionnement officiel des quatre propriétaires requis');
  // The same generated universe ID is used by each distinct native owner,
  // but a reference may NEVER be reused by another universe for the SAME
  // owner. Prefixing by role avoids inventing four competing project IDs.
  const refsByOwner=entries=>Object.entries(entries).map(([role,ref])=>role+':'+ref);
  const used=new Set(doc.projects.filter(p=>p.status==='ready')
   .flatMap(p=>refsByOwner(p.content)));
  const refs=refsByOwner(content);
  const roles=['combatProjectId','heroProjectId','rulesProjectId','worldProjectId'];
  if(!verifyOwners||roles.some(role=>typeof verifyOwners[role]!=='function')||
     roles.some(role=>verifyOwners[role](content[role],id)!==true))
   throw new Error('Validation officielle des contenus Combat/Exploration/Rules obligatoire');
  if(refs.some(ref=>used.has(ref)))
   throw new Error('Référence de contenu déjà utilisée par un autre univers');
  write({...doc,projects:doc.projects.map(p=>p.id===id?
   {...p,status:'ready',content:{...content}}:p)});
  return byId(id);
 }
 function requireReady(id){
  const project=byId(id);
  if(project.status!=='ready')
   throw new Error('Univers non initialisé : raccorde les éditeurs officiels sans partager leur contenu');
  return project;
 }
 return Object.freeze({key:CAPTURE_UNIVERSE_INDEX_KEY_V1,list,
  get:byId,selected:()=>byId(read().selectedId),create,rename,select,provision,requireReady});
}
