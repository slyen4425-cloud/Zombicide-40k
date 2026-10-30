"use strict";
// Generic GenSrpg profile builder extracted from retired Capture code.
// The old function was mis-owned by Capture but used to create Survival and Dungeon
// profiles. Its original data fields are preserved exactly (Phase12 R10 source).
// Core owns this ONE factory; no Capture creature/skill/world runtime is imported.
function gensBuildGameProfileBaseV1(name,id,builtIn=false){
  const waveId=activeWavePresetId();
  const wavePreset=loadWavePresets().find(p=>p.id===waveId);
  return {
    id:id||gameProfileId(),
    name:name||"Profil de partie",
    builtIn:!!builtIn,
    gameStyle:"custom",
    modules:{rules:true,objects:true,heroes:true,enemies:true,waves:true},
    rules:{...loadGameCustomization()},
    deck:{...loadDeckConfig()},
    heroPool:currentAllHeroIds(),
    objectPool:ITEMS.map(it=>String(it.id)),
    wavePresetId:waveId||ZOMBICIDE_BASE_PRESET_ID,
    enemyConfig:{...loadZombieConfig()},
    enemyReserve:{...(wavePreset?.reserve||loadZombieConfig())},
    enemyLoot:{enabled:false,multiplier:0.1},
    createdAt:Date.now()
  };
}
