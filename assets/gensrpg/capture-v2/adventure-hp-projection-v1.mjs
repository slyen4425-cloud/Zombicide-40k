// Read-only Adventure sheet adapter. Every stat and HP rule stays inside
// the ORIGINAL Combat owner's exported projectors; do not implement HP
// percentage or stat effects in GenSRPG. Never mutate author transfers,
// the AdventureSession, or historical saved HP.
export function createAdventureHpProjectorV1({
 creatureTransfers,statRegistry,
 projectOwnedStats,projectStatEffects,projectMaxHp
}={}){
 if(!Array.isArray(creatureTransfers)||statRegistry?.schema!=='capture-stat-registry-v1'||
  typeof projectOwnedStats!=='function'||typeof projectStatEffects!=='function'||
  typeof projectMaxHp!=='function')
  throw new TypeError('Official Combat HP/stat projectors and published records required');
 const bySpecies=new Map(creatureTransfers.map(transfer=>[transfer.draft?.id,transfer]));
 return Object.freeze(function projectAdventureCombatVitals({actor,hpMultiplier}={}){
  const record=bySpecies.get(actor?.speciesId);
  if(!record)throw new Error('Creature absent from official Combat author transfers');
  // The exact Combat owner applies spent stat points to the real authored
  // values. This is not a persisted copy or a replacement stat registry.
  const projected=projectOwnedStats({
   configuredCreatures:new Map([[actor.speciesId,record]]),
   statRegistry,speciesId:actor.speciesId,statAllocations:actor.statAllocations
  });
  const effects=projectStatEffects({
   registry:statRegistry,statValues:projected.get(actor.speciesId)?.statValues
  });
  if(!effects.hasMaxHpProjection)
   throw new Error('Official Combat HP registry has no health stat projection');
  const baseMaxHp=effects.maxHp;
  const maxHp=projectMaxHp(baseMaxHp,hpMultiplier);
  const savedHp=actor.hp;
  if(savedHp!==null&&(typeof savedHp!=='number'||!Number.isFinite(savedHp)||savedHp<0))
   throw new RangeError('Invalid saved current creature HP');
  return Object.freeze({
   baseMaxHp,maxHp,currentHp:savedHp===null?maxHp:Math.min(savedHp,maxHp),
   hpPercent:100*hpMultiplier,
   storedHp:savedHp
  });
 });
}
