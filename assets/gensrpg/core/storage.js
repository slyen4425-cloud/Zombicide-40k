/* GenSrpG Core storage — pure storage/migration contract.
   No global localStorage/IndexedDB access. Callers inject the storage owner explicitly.
   Existing data keys and JSON shapes remain unchanged unless an explicit migration owns them.
*/
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgCoreStorage=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.0.0";
  const str=v=>String(v??"");
  const int=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

  function validStorage(storage){
    return !!storage&&typeof storage.getItem==="function"&&typeof storage.setItem==="function"&&typeof storage.removeItem==="function";
  }

  function validKey(key){return str(key).trim()}

  function cloneJson(value){
    if(value===undefined)return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function readText(storage,key,{fallback=null}={}){
    const k=validKey(key);
    if(!validStorage(storage)||!k)return {ok:false,exists:false,key:k,value:fallback,raw:null,error:"invalid-storage-or-key"};
    try{
      const raw=storage.getItem(k);
      if(raw===null)return {ok:true,exists:false,key:k,value:fallback,raw:null,error:null};
      return {ok:true,exists:true,key:k,value:String(raw),raw:String(raw),error:null};
    }catch(error){return {ok:false,exists:false,key:k,value:fallback,raw:null,error};}
  }

  function writeText(storage,key,value){
    const k=validKey(key);
    if(!validStorage(storage)||!k)return {ok:false,key:k,error:"invalid-storage-or-key"};
    try{storage.setItem(k,str(value));return {ok:true,key:k,error:null};}
    catch(error){return {ok:false,key:k,error};}
  }

  function remove(storage,key){
    const k=validKey(key);
    if(!validStorage(storage)||!k)return {ok:false,key:k,error:"invalid-storage-or-key"};
    try{storage.removeItem(k);return {ok:true,key:k,error:null};}
    catch(error){return {ok:false,key:k,error};}
  }

  function readJson(storage,key,{fallback=null,validate=null}={}){
    const text=readText(storage,key,{fallback:null});
    if(!text.ok)return {...text,value:cloneJson(fallback)};
    if(!text.exists)return {...text,value:cloneJson(fallback),parsed:false};
    try{
      const parsed=JSON.parse(text.raw);
      if(typeof validate==="function"&&!validate(parsed))return {...text,ok:false,value:cloneJson(fallback),parsed:false,error:"validation-failed"};
      return {...text,value:parsed,parsed:true,error:null};
    }catch(error){return {...text,ok:false,value:cloneJson(fallback),parsed:false,error};}
  }

  function serializeJson(value){
    try{return {ok:true,raw:JSON.stringify(value),error:null};}
    catch(error){return {ok:false,raw:null,error};}
  }

  function writeJson(storage,key,value){
    const serialized=serializeJson(value);
    if(!serialized.ok)return {ok:false,key:validKey(key),error:serialized.error};
    const out=writeText(storage,key,serialized.raw);
    return {...out,raw:serialized.raw};
  }

  function normalizeMigrations(migrations=[]){
    const source=Array.isArray(migrations)?migrations:Object.entries(migrations||{}).map(([version,migrate])=>({version:Number(version),migrate}));
    const out=[];
    for(const entry of source){
      const version=Math.max(1,int(entry?.version,0)),migrate=entry?.migrate;
      if(!version||typeof migrate!=="function")continue;
      out.push({version,migrate});
    }
    out.sort((a,b)=>a.version-b.version);
    return out;
  }

  function migrationPlan({fromVersion=0,toVersion=0,migrations=[]}={}){
    const from=Math.max(0,int(fromVersion,0)),to=Math.max(0,int(toVersion,0));
    if(to<from)return {ok:false,fromVersion:from,toVersion:to,steps:[],error:"target-before-current"};
    if(to===from)return {ok:true,fromVersion:from,toVersion:to,steps:[],error:null};
    const byVersion=new Map(normalizeMigrations(migrations).map(x=>[x.version,x]));
    const steps=[];
    for(let version=from+1;version<=to;version++){
      const step=byVersion.get(version);
      if(!step)return {ok:false,fromVersion:from,toVersion:to,steps,error:`missing-migration-${version}`};
      steps.push(step);
    }
    return {ok:true,fromVersion:from,toVersion:to,steps,error:null};
  }

  function migrateValue(value,{fromVersion=0,toVersion=0,migrations=[],validate=null}={}){
    const plan=migrationPlan({fromVersion,toVersion,migrations});
    if(!plan.ok)return {...plan,value:cloneJson(value),changed:false,applied:[]};
    let current=cloneJson(value);const applied=[];
    try{
      for(const step of plan.steps){
        const next=step.migrate(cloneJson(current),{fromVersion:step.version-1,toVersion:step.version});
        if(next===undefined)throw new Error(`migration-${step.version}-returned-undefined`);
        current=next;applied.push(step.version);
      }
      if(typeof validate==="function"&&!validate(current))throw new Error("validation-failed");
      return {ok:true,fromVersion:plan.fromVersion,toVersion:plan.toVersion,value:current,changed:applied.length>0,applied,error:null};
    }catch(error){
      return {ok:false,fromVersion:plan.fromVersion,toVersion:plan.toVersion,value:cloneJson(value),changed:false,applied:[],error};
    }
  }

  function readVersion(storage,versionKey,{fallback=0}={}){
    const out=readText(storage,versionKey,{fallback:String(Math.max(0,int(fallback,0)))});
    const value=Math.max(0,int(out.value,fallback));
    return {...out,value};
  }

  function migrateStoredJson({storage,key,versionKey,fallback=null,targetVersion=0,migrations=[],validate=null}={}){
    const dataKey=validKey(key),schemaKey=validKey(versionKey),target=Math.max(0,int(targetVersion,0));
    if(!validStorage(storage)||!dataKey||!schemaKey)return {ok:false,changed:false,key:dataKey,versionKey:schemaKey,error:"invalid-storage-or-key"};

    const data=readJson(storage,dataKey,{fallback,validate:null});
    if(!data.ok&&data.exists)return {ok:false,changed:false,key:dataKey,versionKey:schemaKey,error:data.error};
    const version=readVersion(storage,schemaKey,{fallback:0});
    if(!version.ok)return {ok:false,changed:false,key:dataKey,versionKey:schemaKey,error:version.error};

    const migrated=migrateValue(data.value,{fromVersion:version.value,toVersion:target,migrations,validate});
    if(!migrated.ok)return {...migrated,key:dataKey,versionKey:schemaKey,storedVersion:version.value};
    if(!migrated.changed){
      return {...migrated,key:dataKey,versionKey:schemaKey,storedVersion:version.value,written:false};
    }

    const serialized=serializeJson(migrated.value);
    if(!serialized.ok)return {...migrated,ok:false,changed:false,key:dataKey,versionKey:schemaKey,error:serialized.error,written:false};

    // Commit only after every migration and validation succeeded. Data shape is preserved as plain JSON;
    // schema ownership lives in the separate, explicitly supplied version key.
    try{
      storage.setItem(dataKey,serialized.raw);
      storage.setItem(schemaKey,String(target));
      return {...migrated,key:dataKey,versionKey:schemaKey,storedVersion:target,written:true,error:null};
    }catch(error){
      return {...migrated,ok:false,key:dataKey,versionKey:schemaKey,error,written:false};
    }
  }

  return {
    VERSION,
    validStorage,
    validKey,
    cloneJson,
    readText,
    writeText,
    remove,
    readJson,
    serializeJson,
    writeJson,
    normalizeMigrations,
    migrationPlan,
    migrateValue,
    readVersion,
    migrateStoredJson,
  };
});
