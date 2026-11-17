// One Capture-owned composition transaction. Each Lab owns its own database;
// this only asks their public native APIs to allocate distinct project data.
// Partial failures stay pending and recoverable, NEVER delete user data.
import {MONSTER_INVOC_UNIVERSE_ID_V1} from './universe-project-store-v1.mjs';

export function createCaptureUniverseProjectOrchestratorV1({
 projects,combat,worlds,heroes,rulesFor,blankCombat,defaultRules,
 generateHeroId=()=>crypto.randomUUID(),now=()=>new Date().toISOString()
}={}){
 for(const [name,owner] of Object.entries({projects,combat,worlds,heroes})){
  if(!owner||typeof owner!=='object')throw new TypeError(name+' native owner required');
 }
 if(typeof rulesFor!=='function'||typeof blankCombat!=='function'||!defaultRules)
  throw new TypeError('Capture Rules and native Combat presets required');
 const ready=id=>({
  combatProjectId:id,heroProjectId:id,worldProjectId:id,rulesProjectId:id
 });
 const verify={
  combatProjectId:(id,project)=>id===project&&combat.load(id)?.projectId===id,
  heroProjectId:(id,project)=>id===project&&heroes.requireReady(id)?.id===id,
  worldProjectId:(id,project)=>id===project&&worlds.list(id).length>0,
  rulesProjectId:(id,project)=>id===project&&rulesFor(id).load()!==null
 };
 async function provision(id,{copyFrom=null,fromWorldId=null,confirmed=false}={}){
  const project=projects.get(id);
  if(project.legacy)throw new Error('Monster InvoC conserve ses contenus historiques : aucune migration');
  if(project.status==='ready')return projects.requireReady(id);
  if(copyFrom!==null&&confirmed!==true)
   throw new Error('Copier un univers exige une confirmation explicite');
  if(copyFrom===id)throw new Error('Un univers ne se copie pas lui-même');
  if(!combat.load(id)){
   if(copyFrom===null)combat.create(id,blankCombat());
   else if(copyFrom===MONSTER_INVOC_UNIVERSE_ID_V1)
    throw new Error('Copie du catalogue Monster InvoC : export officiel Combat non raccordé');
   else combat.copy({fromId:copyFrom,toId:id,confirmed:true});
  }
  if(!worlds.list(id).length){
   if(copyFrom===null)worlds.createBlank(id);
   else {
    const source=fromWorldId??(copyFrom===MONSTER_INVOC_UNIVERSE_ID_V1
     ?null:worlds.list(copyFrom)[0]?.id);
    if(!source)throw new Error('Sélectionne un WorldDocument source archivé pour la copie');
    worlds.copy({fromWorldId:source,toProjectId:id,confirmed:true});
   }
  }
  let heroReady=false;
  try{heroes.requireReady(id);heroReady=true;}catch{heroReady=false;}
  if(!heroReady)heroes.createEmpty(id);
  if(copyFrom&&copyFrom!==MONSTER_INVOC_UNIVERSE_ID_V1){
   const sourceHeroes=await heroes.list(copyFrom);
   const targetHeroes=await heroes.list(id);
   if(sourceHeroes.length&&targetHeroes.length===0){
    for(const hero of sourceHeroes){
     await heroes.copy({sourceHeroId:hero.id,toProjectId:id,
      confirmed:true,makeId:generateHeroId,now:now()});
    }
   }
  }
  const drafts=rulesFor(id);
  if(drafts.load()===null){
   const src=copyFrom===null?null:rulesFor(copyFrom).load();
   drafts.save(src??defaultRules);
  }
  return projects.provision(id,ready(id),verify);
 }
 async function create(name,config={}){
  const p=projects.create(name);
  return provision(p.id,config);
 }
 return Object.freeze({create,provision});
}
