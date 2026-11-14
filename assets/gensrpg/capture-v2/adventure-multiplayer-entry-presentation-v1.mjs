// Capture V2 multiplayer lobby: presentation guidance ONLY.
// The online server owns membership and world binding; AdventureSession owns
// the save; Exploration owns WorldDocument and actual game entry validation.
// No fallback room, no save copy, no duplicated gameplay authority.
export function captureRoomEntryPresentationV1({
 connection,room,session,selectedWorldId='',localWorldFingerprint=null
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
 if(!room.worldId||!room.worldFingerprint){
  if(!session)
   return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Créer mon personnage',
    hint:'Salon rejoint. Tu peux préparer ton héros ; le monde du créateur sera proposé ensuite.'});
  return Object.freeze({visible:true,enabled:false,action:'none',label:'En attente du créateur',
   hint:'Le créateur doit entrer dans son monde avant les invités.'});
 }
 if(localWorldFingerprint!==room.worldFingerprint)
  return Object.freeze({visible:true,enabled:true,action:'import',label:'Recevoir le monde du créateur',
   hint:'Le créateur partage sa carte officielle avec les membres du salon. Touche ce bouton pour l’importer sans écraser tes autres mondes.'});
 if(!session)
  return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Créer mon personnage',
   hint:'Monde reçu. Choisis ton héros et ta créature, puis crée une nouvelle aventure personnelle.'});
 const localWorldId=session.world?.mapRef||selectedWorldId;
 if(localWorldId!==room.worldId)
  return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Créer une partie pour ce monde',
   hint:'Ta sauvegarde actuelle utilise un autre monde. Crée une nouvelle aventure personnelle pour rejoindre ce salon.'});
 if(session.status==='finished')
  return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Créer une nouvelle partie',
   hint:'La sauvegarde sélectionnée est terminée. Crée une aventure personnelle pour ce salon.'});
 return Object.freeze({visible:true,enabled:true,action:'enter',label:'Rejoindre le monde',
  hint:'Le créateur est entré dans le monde. Le même WorldDocument officiel est disponible sur ton appareil.'});
}
