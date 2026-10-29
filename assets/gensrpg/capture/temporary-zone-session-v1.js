"use strict";
/* One temporary gameplay session: movement, encounter and return share one owner. */
(function(root){
 function create({trigger,resolveEncounter,encounterAt,width=9,height=7,onMove=()=>{},onBattleReturn=()=>{}}){
  if(!root.GensCaptureTemporaryEncounterSourceV1||!root.GensCaptureTemporaryZoneControllerV1)throw new Error("Temporary zone dependencies unavailable");
  let zone=null,disposed=false;
  const source=root.GensCaptureTemporaryEncounterSourceV1.create({
   trigger,resolveEncounter,
   onReturn:event=>{zone?.resume();onBattleReturn(event);}
  });
  zone=root.GensCaptureTemporaryZoneControllerV1.create({width,height,encounterSource:source,encounterAt,onMove});
  function complete(result){if(disposed)throw new Error("Session disposed");return source.complete(result);}
  function move(dx,dy){if(disposed)throw new Error("Session disposed");return zone.move(dx,dy);}
  function stop(){if(disposed)return false;disposed=true;zone.leave();return true;}
  function state(){return Object.freeze({disposed,zone:zone.state(),encounter:source.status()});}
  return Object.freeze({move,complete,stop,state});
 }
 root.GensCaptureTemporaryZoneSessionV1=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);
