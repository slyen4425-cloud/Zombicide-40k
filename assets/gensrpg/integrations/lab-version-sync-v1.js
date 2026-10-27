"use strict";
/* Pure, inert compatibility gate. No network, runtime switch, or save writes. */
(function(root){
  const SHA=/^[a-f0-9]{40}$/i;
  const SEMVER=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
  const SOURCES=Object.freeze({
    combat:"slyen4425-cloud/GenSrpg_labo_combat_dynamique",
    exploration:"slyen4425-cloud/laboratoire_dynamique_exploration-"
  });
  function validate(entry,kind){
    if(!entry||typeof entry!=="object"||Array.isArray(entry))throw new TypeError(kind+" entry required");
    if(entry.repository!==SOURCES[kind])throw new TypeError(kind+" repository mismatch");
    if(!SHA.test(entry.sha||""))throw new TypeError(kind+" immutable commit SHA required");
    if(!SEMVER.test(entry.version||""))throw new TypeError(kind+" semantic version required");
    if(!Number.isInteger(entry.protocol)||entry.protocol<1)throw new TypeError(kind+" protocol required");
    if(!Array.isArray(entry.capabilities)||new Set(entry.capabilities).size!==entry.capabilities.length||
      entry.capabilities.some(x=>typeof x!=="string"||!x.trim()))throw new TypeError(kind+" capabilities invalid");
    return Object.freeze({repository:entry.repository,sha:entry.sha.toLowerCase(),version:entry.version,
      protocol:entry.protocol,capabilities:Object.freeze([...entry.capabilities])});
  }
  function verify(manifest,requirements){
    if(!manifest||manifest.schema!==1)throw new TypeError("Unsupported sync manifest");
    const combat=validate(manifest.combat,"combat");
    const exploration=validate(manifest.exploration,"exploration");
    if(!requirements||typeof requirements!=="object")throw new TypeError("Consumer requirements required");
    for(const kind of ["combat","exploration"]){
      const req=requirements[kind];
      if(!req||req.protocol!==({combat,exploration})[kind].protocol)throw new TypeError(kind+" incompatible protocol");
      if(!Array.isArray(req.capabilities)||!req.capabilities.every(x=>({combat,exploration})[kind].capabilities.includes(x)))
        throw new TypeError(kind+" missing required capability");
    }
    return Object.freeze({schema:1,combat,exploration});
  }
  function changed(current,next){return ["combat","exploration"].filter(kind=>current[kind].sha!==next[kind].sha);}
  root.GensLabVersionSyncV1=Object.freeze({SOURCES,verify,changed});
})(typeof window!=="undefined"?window:globalThis);
