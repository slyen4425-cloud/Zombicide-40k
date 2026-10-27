"use strict";
/* Capture-owned contract boundary for a future external battle engine.
 * This is preparation only: no lab import, no runtime installation, no save mutation.
 */
(function(root){
  const VERSION="0.1.0";
  const TYPES=Object.freeze(["victory","defeat","flee","cancelled"]);
  function plain(value){return value!==null&&typeof value==="object"&&!Array.isArray(value)}
  function snapshot(input){
    if(!plain(input))throw new TypeError("Capture battle snapshot must be an object");
    if(!Array.isArray(input.sides)||input.sides.length!==2)throw new TypeError("Capture battle requires two sides");
    const sides=input.sides.map((side,index)=>{
      if(!plain(side)||!Array.isArray(side.creatures)||!side.creatures.length)throw new TypeError("Capture side "+index+" must contain creatures");
      const seen=new Set();
      const creatures=side.creatures.map(creature=>{
        if(!plain(creature)||typeof creature.instanceId!=="string"||!creature.instanceId)throw new TypeError("Creature instanceId required");
        if(seen.has(creature.instanceId))throw new TypeError("Duplicate creature instanceId");
        seen.add(creature.instanceId);
        if(!Number.isFinite(creature.hp)||!Number.isFinite(creature.maxHp)||creature.maxHp<=0||creature.hp<0||creature.hp>creature.maxHp)throw new TypeError("Invalid creature HP");
        return {instanceId:creature.instanceId,creatureId:String(creature.creatureId||""),hp:creature.hp,maxHp:creature.maxHp,abilityIds:Array.isArray(creature.abilityIds)?creature.abilityIds.map(String):[]};
      });
      const active=Array.isArray(side.active)?side.active.slice():[];
      if(active.some(id=>!seen.has(id)))throw new TypeError("Active creature must belong to side");
      return {name:String(side.name||""),creatures,active};
    });
    const ids=sides.flatMap(side=>side.creatures.map(c=>c.instanceId));
    if(new Set(ids).size!==ids.length)throw new TypeError("Creature instanceIds must be unique across sides");
    return {version:1,sides};
  }
  function result(input,original){
    if(!plain(input)||!TYPES.includes(input.outcome))throw new TypeError("Unknown battle outcome");
    const source=snapshot(original);
    if(!Array.isArray(input.creatures))throw new TypeError("Battle result creatures required");
    const expected=new Set(source.sides.flatMap(side=>side.creatures.map(c=>c.instanceId)));
    const seen=new Set();
    const creatures=input.creatures.map(c=>{
      if(!plain(c)||!expected.has(c.instanceId)||seen.has(c.instanceId))throw new TypeError("Unknown or repeated result creature");
      seen.add(c.instanceId);
      const base=source.sides.flatMap(side=>side.creatures).find(x=>x.instanceId===c.instanceId);
      if(!Number.isFinite(c.hp)||c.hp<0||c.hp>base.maxHp)throw new TypeError("Invalid result HP");
      return {instanceId:c.instanceId,hp:c.hp,ko:c.hp===0};
    });
    if(seen.size!==expected.size)throw new TypeError("Incomplete battle result");
    return {version:1,outcome:input.outcome,creatures};
  }
  root.GensCaptureBattleBridgeContractV1=Object.freeze({VERSION,snapshot,result});
})(typeof window!=="undefined"?window:globalThis);
