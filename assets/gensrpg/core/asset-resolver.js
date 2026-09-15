/* GenSrpG Core asset resolver — pure, side-effect-free target implementation.
   Assets are resolved inside one explicit module. No hidden cross-module fallback.
   Runtime/editor configuration may override every default mapping.
*/
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgCoreAssets=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.0.0";
  const MODULES=Object.freeze(["common","survival","dungeon","capture","pvp"]);

  const DEFAULT_CATALOG=Object.freeze({
    dungeon:Object.freeze({
      hero:Object.freeze({
        dungeon_aldren:"assets/dungeon/creatures/dng_aldren.png",
        dungeon_lyra:"assets/dungeon/creatures/dng_lyra.png",
        dungeon_brom:"assets/dungeon/creatures/dng_brom.png",
      }),
      tile:Object.freeze({
        wall:"assets/dungeon/creatures/dng_wall_block.jpg",
        floor:"assets/dungeon/creatures/dng_floor_stone_01.png",
      }),
      item:Object.freeze({
        dloot_old_coin:"assets/dungeon/creatures/dloot_old_coin.png",
        dloot_silver_idol:"assets/dungeon/creatures/dloot_silver_idol.png",
        dloot_beast_fang:"assets/dungeon/creatures/dloot_beast_fang.png",
        dloot_runic_shard:"assets/dungeon/creatures/dloot_runic_shard.png",
        dloot_black_pearl:"assets/dungeon/creatures/dloot_black_pearl.png",
        dloot_dragon_scale:"assets/dungeon/creatures/dloot_dragon_scale.png",
        dloot_royal_relic:"assets/dungeon/creatures/dloot_royal_relic.png",
        dloot_void_gem:"assets/dungeon/creatures/dloot_void_gem.png",
      }),
    }),
  });

  const str=v=>String(v??"").trim();
  function normalizeModule(v){const x=str(v).toLowerCase();return MODULES.includes(x)?x:""}
  function normalizeKind(v){return str(v).toLowerCase().replace(/[^a-z0-9_-]+/g,"")}
  function normalizeId(v){return str(v).replace(/[^A-Za-z0-9_.:-]+/g,"_")}

  function validPath(value){
    const p=str(value);if(!p)return "";
    if(/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(p))return p;
    if(/^blob:/i.test(p))return p;
    if(/^https:\/\//i.test(p))return p;
    if(/^(?:javascript|vbscript):/i.test(p))return "";
    if(p.includes("\\")||/(^|\/)\.\.(?:\/|$)/.test(p))return "";
    return p;
  }

  function entryFrom(catalog,module,kind,id){
    if(!catalog||typeof catalog!=="object")return "";
    const scoped=catalog?.[module]?.[kind];
    if(!scoped||typeof scoped!=="object")return "";
    const raw=scoped[id];
    if(typeof raw==="string")return validPath(raw);
    if(raw&&typeof raw==="object")return validPath(raw.path??raw.src??raw.image_data??raw.art);
    return "";
  }

  function conventionPath(module,kind,id){
    if(module==="dungeon"&&kind==="creature"&&/^dng_[a-z0-9_]+$/i.test(id)){
      return `assets/dungeon/creatures/${id}.png`;
    }
    return "";
  }

  function resolveAsset({module,kind,id="",artId="",explicitPath="",overrides=null,catalog=null,allowConvention=true}={}){
    const m=normalizeModule(module),k=normalizeKind(kind),baseId=normalizeId(id),preferredId=normalizeId(artId)||baseId;
    const detail={module:m,kind:k,id:baseId,artId:normalizeId(artId),resolvedId:preferredId,path:"",source:"none"};
    if(!m||!k||!preferredId)return detail;

    const explicit=validPath(explicitPath);
    if(explicit)return {...detail,path:explicit,source:"explicit"};

    const override=entryFrom(overrides,m,k,preferredId)||((preferredId!==baseId&&baseId)?entryFrom(overrides,m,k,baseId):"");
    if(override)return {...detail,path:override,source:"override"};

    const custom=entryFrom(catalog,m,k,preferredId)||((preferredId!==baseId&&baseId)?entryFrom(catalog,m,k,baseId):"");
    if(custom)return {...detail,path:custom,source:"catalog"};

    const builtin=entryFrom(DEFAULT_CATALOG,m,k,preferredId)||((preferredId!==baseId&&baseId)?entryFrom(DEFAULT_CATALOG,m,k,baseId):"");
    if(builtin)return {...detail,path:builtin,source:"default-catalog"};

    if(allowConvention){
      const conventional=validPath(conventionPath(m,k,preferredId));
      if(conventional)return {...detail,path:conventional,source:"module-convention"};
    }
    return detail;
  }

  function resolvePath(input={}){return resolveAsset(input).path}

  return {
    VERSION,
    MODULES,
    DEFAULT_CATALOG,
    normalizeModule,
    normalizeKind,
    normalizeId,
    validPath,
    conventionPath,
    resolveAsset,
    resolvePath,
  };
});
