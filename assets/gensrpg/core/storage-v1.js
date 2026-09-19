/* GenSrpG Phase 4 — generic JSON storage service.
   Jalon A: pure explicit API only; intentionally outside the production load graph. */
(function(ROOT){
"use strict";
const VERSION="1.0.0";

function assertStorage(storage){
  if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function"){
    throw new TypeError("A storage adapter with getItem/setItem is required");
  }
  return storage;
}

function readJson(storage,key,fallback){
  const target=assertStorage(storage);
  try{
    const raw=target.getItem(String(key));
    if(raw==null||raw==="")return fallback;
    const value=JSON.parse(raw);
    return value==null?fallback:value;
  }catch(_){
    return fallback;
  }
}

function writeJson(storage,key,value){
  const target=assertStorage(storage);
  const serialized=JSON.stringify(value);
  target.setItem(String(key),serialized);
  return value;
}

function create(storage){
  const target=assertStorage(storage);
  return Object.freeze({
    readJson:(key,fallback)=>readJson(target,key,fallback),
    writeJson:(key,value)=>writeJson(target,key,value)
  });
}

ROOT.GensStorageV1=Object.freeze({
  VERSION,
  create,
  readJson,
  writeJson
});
})(typeof window!=="undefined"?window:globalThis);
