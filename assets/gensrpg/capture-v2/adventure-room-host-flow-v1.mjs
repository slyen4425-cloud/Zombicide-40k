// Capture V2 UI flow: the existing AdventureSession is the ONLY owner of
// creator policy. Opening a lobby is itself the user action that authorizes
// guests; avoid a hidden prerequisite in an unrelated MJ settings accordion.
import {updateAdventureSessionControlV1} from './adventure-contract-v1.mjs';
export function prepareCaptureHostSessionV1({session,now}={}){
 if(!session?.sessionControl)
  throw new TypeError('Crée une partie Monster Capture avant de créer un salon.');
 if(session.sessionControl.joinEnabled===true)return session;
 return updateAdventureSessionControlV1({session,now,settings:{
  hostIsGameMaster:session.sessionControl.hostIsGameMaster,
  joinEnabled:true,
  guestPermissions:session.sessionControl.guestPermissions
 }});
}
