"use strict";
/* Capture session and view integration; official Combat provider is injected, never cloned. */
(function(root){
 function mount({host,provider,resolveEncounter,encounterAt,width=9,height=7,onBattleReturn=()=>{}}){
  if(!root.GensCaptureLabOwnershipPortV1||!root.GensCaptureBattleBridgeContractV1||!root.GensCaptureManualBattleTriggerV1||!root.GensCaptureTemporaryZoneSessionV1||!root.GensCaptureTemporaryZoneViewV1)throw new Error("Capture gameplay dependencies missing");
  const port=root.GensCaptureLabOwnershipPortV1;
  if(!port.status().installed&&provider)port.install(provider);
  if(!port.compatible(["battle-trigger"]))throw new Error("Official Labo Combat provider unavailable");
  const trigger=root.GensCaptureManualBattleTriggerV1.create(port,root.GensCaptureBattleBridgeContractV1);
  let view=null,disposed=false;
  const session=root.GensCaptureTemporaryZoneSessionV1.create({trigger,resolveEncounter,encounterAt,width,height,onBattleReturn:event=>{view?.refresh();onBattleReturn(event);}});
  try{view=root.GensCaptureTemporaryZoneViewV1.mount({host,session,encounterAt,width,height});}
  catch(error){session.stop();throw error;}
  return Object.freeze({
   move(dx,dy){if(disposed)throw new Error("Play session disposed");return view.step(dx,dy);},
   complete(result){if(disposed)throw new Error("Play session disposed");return session.complete(result);},
   state:()=>session.state(),
   dispose(){if(disposed)return false;disposed=true;session.stop();view.dispose();return true;}
  });
 }
 root.GensCaptureTemporaryZonePlayV1=Object.freeze({mount});
})(typeof window!=="undefined"?window:globalThis);
