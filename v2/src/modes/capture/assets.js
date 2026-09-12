function clone(value){return structuredClone(value);}

export function buildCaptureAssetIndex(registry={}){
  const bySpecies={};
  const aliasToSpecies={};
  for(const entry of registry.speciesAssets||[]){
    const speciesId=String(entry.speciesId||'');
    if(!speciesId) continue;
    bySpecies[speciesId]=clone(entry);
    aliasToSpecies[speciesId]=speciesId;
    for(const alias of entry.legacyAliases||[]) aliasToSpecies[String(alias)]=speciesId;
  }
  return {bySpecies,aliasToSpecies};
}

export function resolveCaptureSpeciesAsset(speciesId,registry={}){
  const {bySpecies,aliasToSpecies}=buildCaptureAssetIndex(registry);
  const requestedId=String(speciesId||'');
  const canonicalId=aliasToSpecies[requestedId]||requestedId;
  const record=bySpecies[canonicalId]||null;
  if(!record){
    return {
      found:false,
      speciesId:canonicalId||null,
      displayName:null,
      mainArt:null,
      iconArt:null,
      fallback:'capture-placeholder',
    };
  }
  return {
    found:true,
    speciesId:canonicalId,
    displayName:record.displayName||canonicalId,
    mainArt:clone(record.mainArt||null),
    iconArt:clone(record.iconArt||null),
    fallback:(record.mainArt?.path||record.iconArt?.path)?null:'capture-placeholder',
  };
}

export function resolveOwnedCreatureAsset(creature={},registry={}){
  return resolveCaptureSpeciesAsset(creature.speciesId||creature.legacySpeciesId,registry);
}

export function captureAssetPathAllowed(path,registry={}){
  if(path==null||path==='') return true;
  const value=String(path);
  const root=String(registry.assetRoot||'v2/assets/capture/creatures/');
  return value.startsWith(root)
    && !value.includes('/rpg/')
    && !value.includes('/dungeon/')
    && !value.includes('assets/dungeon/');
}
