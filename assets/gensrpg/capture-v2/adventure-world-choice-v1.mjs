// GenSRPG Capture only chooses an official Exploration WorldDocument ID.
// The entire WorldDocument and its active author draft belong to Exploration.
const identifier=value=>typeof value==='string'&&value.length>0&&value.length<=130&&
 !/[\u0000-\u001f\u007f]/.test(value);
export function withSelectedAdventureWorldV1(session,worldId){
 if(!session||typeof session!=='object'||!session.world||
   !identifier(worldId))
  throw new TypeError('Identifiant de monde Exploration officiel requis');
 if(session.world.mapRef!==null&&session.world.mapRef!==worldId)
  throw new Error('Le monde de cette partie est déjà fixé : utilise une autre sauvegarde');
 return Object.freeze({...session,
  world:Object.freeze({...session.world,mapRef:worldId,position:null})});
}
export function resolveSelectedAdventureWorldV1({session,worldLibrary,selectedWorldId}={}){
 if(!session||!identifier(selectedWorldId))
  throw new TypeError('Choisis un WorldDocument enregistré');
 if(session.world?.mapRef!==null&&session.world?.mapRef!==selectedWorldId)
  throw new Error('Cette partie utilise un autre monde. Sélectionne le monde de sa sauvegarde.');
 if(!worldLibrary||typeof worldLibrary.list!=='function'||
   typeof worldLibrary.load!=='function'||typeof worldLibrary.activate!=='function')
  throw new Error('Bibliothèque de mondes Exploration officielle indisponible');
 const allowed=worldLibrary.list();
 if(!allowed.some(entry=>entry.id===selectedWorldId))
  throw new Error('Monde de partie introuvable dans la bibliothèque Exploration');
 // The official Exploration owner refuses replacing an unsaved/corrupted
 // active WorldDocument. GenSrpg never bypasses that protection.
 return worldLibrary.activate(selectedWorldId);
}
