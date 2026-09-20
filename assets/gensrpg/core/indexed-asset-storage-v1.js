/* GenSrpG Phase 4 — canonical IndexedDB asset storage primitives.
   Pure storage service: no legacy migration, UI bootstrap, timers or gameplay. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const DB_NAME="GenSrpG_Assets";
const DB_VERSION=1;
const STORE="assets";
const PREFIX="idbasset:";
const cache=new Map();

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=ROOT.indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("IndexedDB indisponible"));
  });
}

async function put(ref,data){
  if(!ref||!data)return;
  cache.set(ref,data);
  const db=await openDb();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite");
    tx.objectStore(STORE).put(data,ref);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error("Écriture IndexedDB impossible"));
  });
  db.close();
}

async function get(ref){
  if(!ref)return "";
  if(cache.has(ref))return cache.get(ref)||"";
  const db=await openDb();
  const val=await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readonly");
    const req=tx.objectStore(STORE).get(ref);
    req.onsuccess=()=>resolve(req.result||"");
    req.onerror=()=>reject(req.error||new Error("Lecture IndexedDB impossible"));
  });
  db.close();
  cache.set(ref,val||"");
  return val||"";
}

async function loadAllCache(){
  try{
    const db=await openDb();
    const pairs=await new Promise((resolve,reject)=>{
      const out=[];
      const tx=db.transaction(STORE,"readonly"),st=tx.objectStore(STORE);
      const req=st.openCursor();
      req.onsuccess=e=>{
        const c=e.target.result;
        if(c){out.push([c.key,c.value]);c.continue()}
        else resolve(out);
      };
      req.onerror=()=>reject(req.error||new Error("Lecture IndexedDB impossible"));
    });
    db.close();
    pairs.forEach(([k,v])=>cache.set(k,v));
    return pairs.length;
  }catch(e){
    console.warn("IndexedDB cache",e);
    return 0;
  }
}

function assetRef(){
  return PREFIX+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9);
}

function externalizeSync(value){
  if(Array.isArray(value))return value.map(externalizeSync);
  if(value&&typeof value==="object"){
    const out={};
    Object.entries(value).forEach(([k,v])=>out[k]=externalizeSync(v));
    return out;
  }
  if(typeof value==="string"&&/^data:image\//i.test(value)){
    const ref=assetRef();
    cache.set(ref,value);
    put(ref,value).catch(e=>console.warn("Asset IndexedDB",e));
    return ref;
  }
  return value;
}

function hydrate(value){
  if(Array.isArray(value))return value.map(hydrate);
  if(value&&typeof value==="object"){
    const out={};
    Object.entries(value).forEach(([k,v])=>out[k]=hydrate(v));
    return out;
  }
  if(typeof value==="string"&&value.startsWith(PREFIX))return cache.has(value)?(cache.get(value)||""):value;
  return value;
}

async function externalizeAwait(value){
  if(Array.isArray(value)){
    const out=[];
    for(const v of value)out.push(await externalizeAwait(v));
    return out;
  }
  if(value&&typeof value==="object"){
    const out={};
    for(const [k,v] of Object.entries(value))out[k]=await externalizeAwait(v);
    return out;
  }
  if(typeof value==="string"&&/^data:image\//i.test(value)){
    const ref=assetRef();
    await put(ref,value);
    return ref;
  }
  return value;
}

async function exportAll(){
  await loadAllCache();
  const out={};
  cache.forEach((v,k)=>out[k]=v);
  return out;
}

async function importAll(assets){
  if(!assets||typeof assets!=="object")return;
  for(const [k,v] of Object.entries(assets))if(k&&typeof v==="string")await put(k,v);
}

ROOT.GensIndexedAssetStorageV1=Object.freeze({
  VERSION,
  DB_NAME,
  DB_VERSION,
  STORE,
  PREFIX,
  cache,
  openDb,
  put,
  get,
  loadAllCache,
  assetRef,
  externalizeSync,
  hydrate,
  externalizeAwait,
  exportAll,
  importAll
});
})(typeof window!=="undefined"?window:globalThis);
