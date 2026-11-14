// Capture V2 multiplayer lobby: presentation guidance ONLY.
// The online server owns membership and world binding; AdventureSession owns
// the save; Exploration owns WorldDocument and actual game entry validation.
// No fallback room, no save copy, no duplicated gameplay authority.
import {captureGuestSessionMatchesHostSetupV1}
 from './adventure-multiplayer-host-setup-v1.mjs';
export function captureRoomEntryPresentationV1({
 connection,room,session,selectedWorldId='',localWorldFingerprint=null,hostSetup=null
}={}){
 if(!connection)return Object.freeze({visible:false,enabled:false,action:'none',label:'Entrer dans le monde',hint:''});
 if(!room?.open||!room.members?.some(member=>member.id===connection.userId))
  return Object.freeze({visible:true,enabled:false,action:'none',label:'Salon indisponible',
   hint:'Le salon est fermé ou ta connexion a expiré. Rejoins un nouveau salon.'});
 if(connection.role==='host'){
  if(!session||session.sessionId!==room.sessionId)
   return Object.freeze({visible:true,enabled:false,action:'none',label:'Sauvegarde différente',
    hint:'Ce salon est lié à une autre partie. Quitte le salon, charge la bonne sauvegarde puis héberge-la.'});
  return Object.freeze({visible:true,enabled:true,action:'enter',label:'Entrer dans mon monde',
   hint:'Salon prêt. Entre dans le monde avec cette sauvegarde avant les invités.'});
 }
 if(connection.role!=='guest')
  return Object.freeze({visible:true,enabled:false,action:'none',label:'Connexion invalide',
   hint:'Rôle de salon inconnu.'});
 if(!hostSetup||hostSetup.sessionId!==room.sessionId)
  return Object.freeze({visible:true,enabled:false,action:'none',label:'Règles du créateur indisponibles',
   hint:'La configuration de l’hôte n’est pas encore partagée. Demande-lui de recréer le salon avec la nouvelle version.'});
 if(!room.worldId||!room.worldFingerprint)
  return Object.freeze({visible:true,enabled:false,action:'none',label:'En attente du monde',
   hint:'Tes règles sont celles de l’hôte ('+hostSetup.starterCount+' créatures de départ). Il doit entrer en jeu pour partager sa carte.'});
 if(localWorldFingerprint!==room.worldFingerprint)
  return Object.freeze({visible:true,enabled:true,action:'import',label:'Recevoir le monde du créateur',
   hint:'Le créateur partage sa carte officielle avec les membres du salon. Touche ce bouton pour l’importer sans écraser tes autres mondes.'});
 if(!captureGuestSessionMatchesHostSetupV1({session,setup:hostSetup,room}))
  return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Préparer mon héros pour ce salon',
   hint:'La partie et les règles de l’hôte sont imposées. Choisis seulement ton héros et '+hostSetup.starterCount+' créature(s) de départ.'});
 return Object.freeze({visible:true,enabled:true,action:'enter',label:'Rejoindre le monde',
  hint:'Le créateur est entré dans le monde. L’empreinte exacte du WorldDocument officiel a été vérifiée sur ton appareil.'});
}
