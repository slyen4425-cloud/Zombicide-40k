// Capture composition only: no second owner of creatures, HeroDefinition,
// WorldDocument, rule normalization, or saved Adventure sessions.
import {createCaptureUniverseProjectStoreV1} from './universe-project-store-v1.mjs';
import {createCaptureUniverseAdventureStorageV1} from './universe-adventure-storage-v1.mjs';
import {createCaptureUniverseProjectOrchestratorV1} from './universe-project-orchestrator-v1.mjs';
import {createAdventureRulesDraftStoreV1} from './adventure-rules-draft-v1.mjs';
import {DEFAULT_ADVENTURE_RULES_V1} from './adventure-contract-v1.mjs';

const official=new URL('../../../vendor/',import.meta.url);
export async function loadCaptureUniverseNativeBridgeV1({
 root=globalThis,imports=async uri=>import(uri),request=fetch
}={}){
 const coreStorage=root.GensStorageV1;
 const storage=root.localStorage;
 if(!coreStorage||!storage||typeof root.crypto?.randomUUID!=='function')
  throw new Error('Stockage et identifiants natifs GenSRPG requis');
 const [combatModule,worldModule,heroModule,heroStoreModule]=await Promise.all([
  imports(new URL('combat-lab/src/contracts/capture-universe-database-store-v1.js',official).href),
  imports(new URL('exploration-lab/src/builder/exploration-universe-world-projects-v1.js',official).href),
  imports(new URL('exploration-lab/src/storage/exploration-universe-hero-projects-v1.js',official).href),
  imports(new URL('exploration-lab/src/storage/user-hero-store-v1.js',official).href)
 ]);
 const combat=combatModule.createCaptureUniverseDatabaseStoreV1({storage});
 const worlds=worldModule.createExplorationUniverseWorldProjectsV1({
  storage,makeId:()=>root.crypto.randomUUID()
 });
 const heroes=heroModule.createExplorationUniverseHeroProjectsV1({
  storage,heroStore:heroStoreModule.createUserHeroStoreV1()
 });
 const projects=createCaptureUniverseProjectStoreV1({
  storage,coreStorage,makeId:()=>root.crypto.randomUUID()
 });
 const rulesFor=id=>createAdventureRulesDraftStoreV1({
  storage:createCaptureUniverseAdventureStorageV1(storage,id),coreStorage
 });
 let presets=null;
 async function blankCombat(){
  if(presets)return combatModule.createBlankCaptureUniverseDatabaseV1(presets);
  const paths=[
   new URL('combat-lab/data/capture/monster-capture-stat-registry.v1.json',official),
   new URL('combat-lab/data/capture/monster-capture-progression-rules.v1.json',official)
  ];
  const response=await Promise.all(paths.map(url=>request(url,{cache:'no-store'})));
  for(const r of response)if(!r.ok)throw new Error('Modèles de règles Combat natifs indisponibles ('+r.status+')');
  const [statRegistry,progressionRules]=await Promise.all(response.map(r=>r.json()));
  presets={statRegistry,progressionRules,metadata:{projectSource:'blank'}};
  return combatModule.createBlankCaptureUniverseDatabaseV1(presets);
 }
 const orchestrator=createCaptureUniverseProjectOrchestratorV1({
  projects,combat,worlds,heroes,rulesFor,
  blankCombat,defaultRules:DEFAULT_ADVENTURE_RULES_V1,
  generateHeroId:()=>root.crypto.randomUUID()
 });
 return Object.freeze({projects,combat,worlds,heroes,rulesFor,
  createBlank:async name=>orchestrator.create(name),
  createCopy:async(name,fromId,{fromWorldId=null,confirmed=false}={})=>{
   if(confirmed!==true)throw new Error('Copie indépendante : confirme explicitement');
   return orchestrator.create(name,{copyFrom:fromId,fromWorldId,confirmed:true});
  },
  resume:async id=>orchestrator.provision(id)
 });
}
