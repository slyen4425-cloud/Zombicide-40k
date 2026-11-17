// Narrow Capture Adventure Storage adapter, not a second serializer.
// Existing Monster InvoC keys remain byte-for-byte unchanged. For a new
// universe, the exact same Core + Adventure stores own disjoint keys.
import {MONSTER_INVOC_UNIVERSE_ID_V1} from './universe-project-store-v1.mjs';
const allowed=/^gensrpg\\.capture\\.v2\\.adventure\\.(?:save|slot|portfolio|rules-draft|creator-draft)/;
const universe=/^unv_[a-z0-9-]{8,80}$/;
export function createCaptureUniverseAdventureStorageV1(storage,universeId){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  typeof storage.key!=='function'||!Number.isSafeInteger(storage.length))
  throw new TypeError('Adaptateur Storage du Core requis');
 if(universeId===MONSTER_INVOC_UNIVERSE_ID_V1)return storage;
 if(!universe.test(universeId))
  throw new TypeError('Univers inconnu : aucune sauvegarde ouverte');
 const prefix='gensrpg.capture.v2.universe.scope.v1:'+universeId+':';
 const keyOf=key=>{
  if(typeof key!=='string'||!allowed.test(key))
   throw new Error('Ce stockage appartient à un autre propriétaire, accès refusé');
  return prefix+key;
 };
 const ours=()=>{
  const result=[];
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(typeof key==='string'&&key.startsWith(prefix))result.push(key.slice(prefix.length));
  }
  return result;
 };
 return Object.freeze({
  getItem:key=>storage.getItem(keyOf(key)),
  setItem:(key,value)=>storage.setItem(keyOf(key),String(value)),
  removeItem:key=>{
   if(typeof storage.removeItem!=='function')throw new Error('Suppression non disponible');
   storage.removeItem(keyOf(key));
  },
  key:index=>ours()[index]??null,
  get length(){return ours().length;}
 });
}
