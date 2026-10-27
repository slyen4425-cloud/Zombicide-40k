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

// Opt-in Capture visual resolution lives here, in the already-authoritative
// shared Core asset resolver, never in the Combat engine or a duplicate
// Capture-specific registry. The caller supplies the single approved release
// repository/SHA; the Lab catalog supplies the exact assetId -> file binding.
// A moving source branch, missing asset, invalid path or unsupported media
// fails closed. No fallback or implicit network request is performed.
function resolveCaptureLabAsset(options){
  const o=options&&typeof options==="object"?options:{};
  const assetId=clean(o.assetId),commit=clean(o.commit);
  const approvedCommit=clean(o.approvedCommit),approvedRepository=clean(o.approvedRepository);
  const usage=clean(o.usage)||"capture";
  if(!/^[0-9a-f]{40}$/.test(commit)||commit!==approvedCommit){
    throw new TypeError("Capture Lab asset commit must match the approved immutable SHA");
  }
  if(!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(approvedRepository)||
      approvedRepository.includes("..")){
    throw new TypeError("Capture Lab asset repository is not approved");
  }
  if(usage!=="capture")throw new TypeError("Only Capture-compatible assets can be resolved here");
  const catalog=o.catalog;
  if(!catalog||!Array.isArray(catalog.assets)||!catalog.storage||
     catalog.storage.repository!==approvedRepository||
     catalog.storage.kind!=="github-branch"||
     catalog.storage.libraryRoot!=="assets/library/"){
    throw new TypeError("Unapproved official Capture Lab asset repository or catalog");
  }
  if(!assetId)throw new TypeError("Capture assetId is required");
  const found=catalog.assets.filter(entry=>entry?.id===assetId);
  if(found.length!==1){
    throw new RangeError(found.length>1?"duplicate official Capture asset ID: "+assetId:
      "unknown official Capture asset ID: "+assetId);
  }
  const asset=found[0];
  if(!Array.isArray(asset.compatibility?.uses)||!asset.compatibility.uses.includes(usage)||
     asset.mediaType!=="image"){
    throw new TypeError("Asset is not compatible with Capture image rendering");
  }
  const file=clean(asset.resource?.file),mime=clean(asset.resource?.mime);
  const components=file.split("/");
  if(!file||file.startsWith("/")||file.includes("\\")||file.includes("?")||
     file.includes("#")||components.some(x=>!x||x==="."||x===".."||
       !/^[a-zA-Z0-9_. -]+$/.test(x))){
    throw new TypeError("Unsafe official Capture Lab asset file path");
  }
  const suffix=file.slice(file.lastIndexOf(".")+1).toLowerCase();
  const types={webp:"image/webp",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg"};
  if(!Object.prototype.hasOwnProperty.call(types,suffix)||types[suffix]!==mime){
    throw new TypeError("Official Capture Lab asset mime/extension mismatch");
  }
  const resource=asset.resource;
  const format=resource.format??null,frameCount=resource.frameCount??null,frameMs=resource.frameMs??null;
  if(format!==null&&format!=="sprite-strip")throw new TypeError("Unsupported Capture Lab image format");
  if(format==="sprite-strip"&&(!Number.isSafeInteger(frameCount)||frameCount<1||
      !Number.isFinite(frameMs)||frameMs<=0)){
    throw new TypeError("Official sprite-strip frame metadata invalid");
  }
  const url="https://raw.githubusercontent.com/"+approvedRepository+"/"+approvedCommit+
    "/assets/library/"+components.map(encodeURIComponent).join("/");
  return Object.freeze({
    assetId,url,mime,format,frameCount,frameMs,
    playbackMode:resource.playbackMode??null,
    assetType:asset.assetType
  });
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
  resolve,
  resolveCaptureLabAsset
});
})(typeof window!=="undefined"?window:globalThis);
