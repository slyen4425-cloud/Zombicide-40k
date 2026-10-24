/* GenSrpG Phase 4 — pure shared asset resolver.
   Jalon A: explicit API only; this file is not production-loaded yet. */
(function(ROOT){
"use strict";
const VERSION="1.0.0";

const ROOTS=Object.freeze({
  dungeon:Object.freeze({
    creatures:"assets/dungeon/creatures/"
  })
});

const DUNGEON_HERO_FILES=Object.freeze({
  dungeon_aldren:"dng_aldren.png",
  dungeon_lyra:"dng_lyra.png",
  dungeon_brom:"dng_brom.png"
});

const DUNGEON_ITEM_FILES=Object.freeze({
  dng_longsword:"dng_longsword.png",
  dng_bow:"dng_bow.png",
  dng_staff:"dng_staff.png",
  dng_shield:"dng_shield.png",
  dng_leather:"dng_leather.png",
  dng_chain:"dng_chain.png",
  dng_heal_potion:"dungeon_potion_hp.png",
  dng_mana_potion:"dungeon_potion_mp.png",
  dng_fire_scroll:"dungeon_scroll.png",
  dng_torch:"dungeon_torch.png",
  dng_amulet:"dungeon_relic.png",
  dng_lockpick:"dungeon_key.png",
  dng_arrows:"dungeon_arrows.png",
  dloot_old_coin:"dloot_old_coin.png",
  dloot_silver_idol:"dloot_silver_idol.png",
  dloot_beast_fang:"dloot_beast_fang.png",
  dloot_runic_shard:"dloot_runic_shard.png",
  dloot_black_pearl:"dloot_black_pearl.png",
  dloot_dragon_scale:"dloot_dragon_scale.png",
  dloot_royal_relic:"dloot_royal_relic.png",
  dloot_void_gem:"dloot_void_gem.png"
});

function clean(value){return typeof value==="string"?value.trim():""}

function dungeonCreaturePath(id){
  const value=clean(id);
  return /^dng_[a-z0-9_]+$/i.test(value)?ROOTS.dungeon.creatures+value+".png":"";
}

function dungeonHeroPath(id){
  const file=DUNGEON_HERO_FILES[clean(id)];
  return file?ROOTS.dungeon.creatures+file:"";
}

function dungeonItemPath(id){
  const file=DUNGEON_ITEM_FILES[clean(id)];
  return file?ROOTS.dungeon.creatures+file:"";
}

function resolve(options){
  const o=options&&typeof options==="object"?options:{};
  const override=clean(o.override);
  if(override)return override;

  const moduleId=clean(o.module);
  const kind=clean(o.kind);
  const id=clean(o.id);
  let path="";

  if(moduleId==="dungeon"){
    if(kind==="creature")path=dungeonCreaturePath(id);
    else if(kind==="hero")path=dungeonHeroPath(id);
    else if(kind==="item")path=dungeonItemPath(id);
  }

  return path||clean(o.fallback);
}

ROOT.GensAssetResolverV1=Object.freeze({
  VERSION,
  ROOTS,
  DUNGEON_HERO_FILES,
  DUNGEON_ITEM_FILES,
  dungeonCreaturePath,
  dungeonHeroPath,
  dungeonItemPath,
  resolve
});
})(typeof window!=="undefined"?window:globalThis);
