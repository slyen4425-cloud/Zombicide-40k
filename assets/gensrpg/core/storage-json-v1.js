/* GenSrpG Phase 4 — generic JSON storage service.
   Jalon A: explicit API only; this file is intentionally not production-loaded yet. */
(function(ROOT){
"use strict";
const VERSION="1.0.0";

function storageOf(candidate){
  const store=candidate||ROOT?.localStorage;
  if(!store||typeof store.getItem!=="function"||typeof store.setItem!=="function"||typeof store.removeItem!=="function"){
    throw new Error("GenSrpG JSON storage adapter unavailable");
  }
  return store;
}

function keyOf(value){
  const key=String(value==null?"":value).trim();
  if(!key)throw new Error("GenSrpG JSON storage key required");
  return key;
}

function readJson(key,fallback,storage){
  const store=storageOf(storage);
  const raw=store.getItem(keyOf(key));
  if(raw==null||raw==="")return fallback;
  try{
    const value=JSON.parse(raw);
    return value==null?fallback:value;
  }catch(_){
    return fallback;
  }
}

function writeJson(key,value,storage){
  const store=storageOf(storage);
  store.setItem(keyOf(key),JSON.stringify(value));
  return value;
}

function remove(key,storage){
  const store=storageOf(storage);
  store.removeItem(keyOf(key));
}

ROOT.GensStorageJsonV1=Object.freeze({
  VERSION,
  readJson,
  writeJson,
  remove
});
})(typeof window!=="undefined"?window:globalThis);
