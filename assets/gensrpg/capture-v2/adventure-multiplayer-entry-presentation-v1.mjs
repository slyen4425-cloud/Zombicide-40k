// Capture V2 multiplayer lobby: presentation guidance ONLY.
// The online server owns membership and world binding; AdventureSession owns
// the save; Exploration owns WorldDocument and actual game entry validation.
// No fallback room, no save copy, no duplicated gameplay authority.
export function captureRoomEntryPresentationV1({
 connection,room,session,selectedWorldId=''
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
 if(!session)
  return Object.freeze({visible:true,enabled:true,action:'prepare',label:'Créer mon personnage',
   hint:'Salon rejoint ! Crée ta propre aventure et choisis le même monde officiel que le créateur. Ta sauvegarde reste personnelle.'});
 if(!room.worldId||!room.worldFingerprint)
  return Object.freeze({visible:true,enabled:false,action:'none',label:'En attente du créateur',
   hint:'Ton salon est rejoint. Le créateur doit d’abord entrer dans le monde pour autoriser l’arrivée des invités.'});
 const localWorldId=session.world?.mapRef||selectedWorldId;
 if(localWorldId!==room.worldId)
  return Object.freeze({visible:true,enabled:false,action:'none',label:'Monde différent',
   hint:'Le salon utilise une autre carte. Importe le même WorldDocument officiel dans Exploration puis crée ou choisis une sauvegarde liée à ce monde.'});
 return Object.freeze({visible:true,enabled:true,action:'enter',label:'Rejoindre le monde',
  hint:'Le créateur est entré dans le monde. Rejoins avec ta propre sauvegarde. Le contrôle officiel vérifie aussi l’empreinte exacte de la carte.'});
}
