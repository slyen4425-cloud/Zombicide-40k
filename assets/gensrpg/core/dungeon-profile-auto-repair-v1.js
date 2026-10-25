/* GenS RPG: one-time safe profile reconciliation before application startup. */
(function(root){'use strict';
  var KEY='gensrpg_game_profiles_v1';
  var BACKUP=KEY+'_auto_dungeon_reconcile_backup_20261025_v1';
  var ID='game_profile_dungeon_demo';
  function repair(storage){
    try{
      var raw=storage.getItem(KEY);
      if(!raw)return {status:'empty'};
      var entries=JSON.parse(raw);
      if(!Array.isArray(entries))return {status:'invalid'};
      var duplicates=entries.filter(function(p){return p&&p.id===ID;});
      if(duplicates.length<2)return {status:'clean'};
      // Never overwrite an earlier backup or mutate profiles when a backup cannot be verified.
      var previous=storage.getItem(BACKUP);
      if(previous!==null&&previous!==raw)return {status:'backup-conflict'};
      if(previous===null)storage.setItem(BACKUP,raw);
      if(storage.getItem(BACKUP)!==raw)return {status:'backup-failed'};
      var first=false;
      var clean=entries.filter(function(p){if(!p||p.id!==ID)return true;if(first)return false;first=true;return true;});
      // Re-read before writing to avoid overwriting a newer local edit.
      if(storage.getItem(KEY)!==raw)return {status:'changed'};
      storage.setItem(KEY,JSON.stringify(clean));
      return {status:'repaired',removed:duplicates.length-1};
    }catch(error){return {status:'error',message:String(error&&error.message||error)};}
  }
  root.GensDungeonProfileAutoRepair=Object.freeze({repair:repair});
  try{if(root.localStorage)repair(root.localStorage);}catch(_){/* non-blocking */}
})(typeof window!=='undefined'?window:globalThis);
