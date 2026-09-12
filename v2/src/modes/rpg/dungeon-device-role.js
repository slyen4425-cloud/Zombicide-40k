export const DUNGEON_DEVICE_ROLE_STORAGE_KEY='gensrpg.v2.dungeon.deviceRole';

function storageOrNull(storage){
  if(storage) return storage;
  try{return globalThis?.localStorage||null;}catch{return null;}
}

export function normalizeDungeonDeviceRole(value){
  return String(value||'player')==='gm'?'gm':'player';
}

export function loadDungeonDeviceRole(storage=null){
  const target=storageOrNull(storage);
  if(!target?.getItem) return 'player';
  try{return normalizeDungeonDeviceRole(target.getItem(DUNGEON_DEVICE_ROLE_STORAGE_KEY));}
  catch{return 'player';}
}

export function saveDungeonDeviceRole(role,storage=null){
  const normalized=normalizeDungeonDeviceRole(role);
  const target=storageOrNull(storage);
  if(target?.setItem){
    try{target.setItem(DUNGEON_DEVICE_ROLE_STORAGE_KEY,normalized);}catch{}
  }
  return normalized;
}

export function isDungeonGameMasterDevice(storage=null){
  return loadDungeonDeviceRole(storage)==='gm';
}

export function setDungeonGameMasterDeviceRole(isGameMaster,storage=null){
  return saveDungeonDeviceRole(isGameMaster?'gm':'player',storage)==='gm';
}
