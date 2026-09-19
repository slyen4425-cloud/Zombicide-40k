/* GenSrpG Phase 4 — shared JSON storage mechanics.
   Jalon A: generic service only; no business keys, schemas or migrations. */
(function(ROOT){
"use strict";
const VERSION="1.0.0";

function target(backend){
  const value=backend||ROOT.localStorage;
  if(!value||typeof value.getItem!=="function"||typeof value.setItem!=="function"||typeof value.removeItem!=="function"){
    throw new TypeError("Storage backend unavailable");
  }
  return value;
}

function readJson(key,fallback,backend){
  try{
    const raw=target(backend).getItem(String(key));
    if(raw==null)return fallback;
    const value=JSON.parse(raw);
    return value==null?fallback:value;
  }catch(_){
    return fallback;
  }
}

function writeJson(key,value,backend){
  const store=target(backend);
  store.setItem(String(key),JSON.stringify(value));
  return value;
}

function remove(key,backend){
  target(backend).removeItem(String(key));
}

ROOT.GensStorageV1=Object.freeze({
  VERSION,
  readJson,
  writeJson,
  remove
});
})(typeof window!=="undefined"?window:globalThis);
