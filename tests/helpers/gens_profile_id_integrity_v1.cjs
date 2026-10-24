"use strict";
/* GenSrpG profile ID integrity — pure, non-persistent planning only.
 * No global installation, no DOM, no storage, no canonical profile ownership.
 * The legacy saveGameProfiles owner remains responsible for any actual save.
 */
(function(root){
  function canonical(value){
    if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
    if(value&&typeof value==="object"){
      const keys=Object.keys(value).sort();
      return "{"+keys.map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
    }
    return JSON.stringify(value);
  }
  function inspect(list){
    if(!Array.isArray(list))return {status:"invalid",duplicateIds:[],conflictingIds:[],proposed:null};
    const seen=new Map(),out=[],duplicateIds=[],conflictingIds=[];
    for(let i=0;i<list.length;i++){
      const profile=list[i],id=typeof profile?.id==="string"?profile.id:String(profile?.id??"");
      if(!id){out.push(profile);continue}
      const signature=canonical(profile);
      if(!seen.has(id)){seen.set(id,{signature,index:i});out.push(profile);continue}
      if(!duplicateIds.includes(id))duplicateIds.push(id);
      if(seen.get(id).signature!==signature&&!conflictingIds.includes(id))conflictingIds.push(id);
    }
    if(conflictingIds.length)return {status:"conflict",duplicateIds,conflictingIds,proposed:null};
    return {status:duplicateIds.length?"exact-duplicates":"unique",duplicateIds,conflictingIds,proposed:out};
  }
  const api=Object.freeze({inspect});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.GensProfileIdIntegrityV1=api;
})(typeof window!=="undefined"?window:globalThis);
