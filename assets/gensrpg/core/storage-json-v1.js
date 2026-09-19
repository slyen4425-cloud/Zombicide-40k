/* GenSrpG Phase 4 — generic JSON storage service.
   Jalon A: pure adapter only; intentionally outside the production load graph. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

function requireStore(store){
  if(!store||typeof store.getItem!=="function"||typeof store.setItem!=="function"||typeof store.removeItem!=="function"){
    throw new TypeError("A storage adapter with getItem/setItem/removeItem is required");
  }
  return store;
}

function create(store){
  const target=requireStore(store);

  function readJson(key,fallback){
    try{
      const raw=target.getItem(key);
      if(raw==null||raw==="")return fallback;
      const value=JSON.parse(raw);
      return value==null?fallback:value;
    }catch(_){
      return fallback;
    }
  }

  function writeJson(key,value){
    const encoded=JSON.stringify(value);
    target.setItem(key,encoded);
    return value;
  }

  function remove(key){
    target.removeItem(key);
  }

  return Object.freeze({
    readJson,
    writeJson,
    remove
  });
}

ROOT.GensStorageJsonV1=Object.freeze({
  VERSION,
  create
});
})(typeof window!=="undefined"?window:globalThis);
