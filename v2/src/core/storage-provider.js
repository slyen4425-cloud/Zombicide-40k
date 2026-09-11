import { cloneData, readJson, removeJson, writeJson } from './storage.js';

export function createLocalStorageProvider(){
  return {
    kind:'local',
    async read(scope,id='default',fallback=null){return cloneData(readJson(scope,id,fallback));},
    async write(scope,id='default',value){writeJson(scope,id,value);return cloneData(value);},
    async remove(scope,id='default'){removeJson(scope,id);return true;},
  };
}

export function createMemoryStorageProvider(seed={}){
  const data=new Map(Object.entries(seed||{}));
  const key=(scope,id='default')=>`${String(scope)}::${String(id)}`;
  return {
    kind:'memory',
    async read(scope,id='default',fallback=null){return data.has(key(scope,id))?cloneData(data.get(key(scope,id))):cloneData(fallback);},
    async write(scope,id='default',value){data.set(key(scope,id),cloneData(value));return cloneData(value);},
    async remove(scope,id='default'){return data.delete(key(scope,id));},
    snapshot(){return Object.fromEntries([...data.entries()].map(([k,v])=>[k,cloneData(v)]));},
  };
}

export function createRemoteStorageProvider({read,write,remove,name='remote'}={}){
  if(typeof read!=='function'||typeof write!=='function') throw new TypeError('remote storage requires read and write functions');
  return {
    kind:String(name||'remote'),
    async read(scope,id='default',fallback=null){
      const value=await read(String(scope),String(id));
      return value==null?cloneData(fallback):cloneData(value);
    },
    async write(scope,id='default',value){
      const saved=await write(String(scope),String(id),cloneData(value));
      return cloneData(saved==null?value:saved);
    },
    async remove(scope,id='default'){
      if(typeof remove!=='function') return false;
      return Boolean(await remove(String(scope),String(id)));
    },
  };
}

export function createStorageRouter({local=createLocalStorageProvider(),remote=null,mode='local'}={}){
  let currentMode=mode==='remote'&&remote?'remote':'local';
  return {
    get mode(){return currentMode;},
    setMode(next){currentMode=next==='remote'&&remote?'remote':'local';return currentMode;},
    async read(scope,id='default',fallback=null){return (currentMode==='remote'?remote:local).read(scope,id,fallback);},
    async write(scope,id='default',value){return (currentMode==='remote'?remote:local).write(scope,id,value);},
    async remove(scope,id='default'){return (currentMode==='remote'?remote:local).remove(scope,id);},
    async copyLocalToRemote(scope,id='default'){
      if(!remote) return {ok:false,reason:'remote-unavailable'};
      const value=await local.read(scope,id,null);
      if(value==null) return {ok:false,reason:'local-missing'};
      const saved=await remote.write(scope,id,value);
      return {ok:true,value:saved};
    },
    async copyRemoteToLocal(scope,id='default'){
      if(!remote) return {ok:false,reason:'remote-unavailable'};
      const value=await remote.read(scope,id,null);
      if(value==null) return {ok:false,reason:'remote-missing'};
      const saved=await local.write(scope,id,value);
      return {ok:true,value:saved};
    },
  };
}
