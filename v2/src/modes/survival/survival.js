import { readJson, writeJson, cloneData } from '../../core/storage.js';

const SURVIVAL_KEY='survival_universe';
const SURVIVAL_ID='starter';

export function createDefaultSurvivalUniverse(){
  return {
    schemaVersion:1,
    id:SURVIVAL_ID,
    name:'Mon univers Survie',
    mode:'survival',
    rules:{
      threatTiers:['BLUE','YELLOW','ORANGE','RED'],
      waveProgression:true,
      sharedEnemyPhase:true,
      tacticalBoard:true,
    },
    heroes:[],factions:[],scenarios:[],maps:[],enemies:[],spawnTables:[],skills:[],items:[],audioBindings:[],
    updatedAt:new Date().toISOString(),
  };
}

export function loadSurvivalUniverse(){
  return readJson(SURVIVAL_KEY,SURVIVAL_ID,null)||createDefaultSurvivalUniverse();
}

export function saveSurvivalUniverse(universe){
  const next=cloneData(universe||createDefaultSurvivalUniverse());
  next.mode='survival';
  next.updatedAt=new Date().toISOString();
  return writeJson(SURVIVAL_KEY,SURVIVAL_ID,next);
}

export function survivalStorageIdentity(){
  return {key:SURVIVAL_KEY,id:SURVIVAL_ID,mode:'survival'};
}
