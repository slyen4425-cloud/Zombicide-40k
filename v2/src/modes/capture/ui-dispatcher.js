const clone=value=>structuredClone(value);

export const CAPTURE_UI_DISPATCHER_CONTRACT=Object.freeze({
  presentationOnly:true,
  blocking:false,
  pausesBattle:false,
  mutatesGameplayState:false,
  consumesUiEvents:true,
  isolatedFromRpg:true,
});

function textForEvent(event){
  switch(String(event?.type||'')){
    case 'reaction_triggered':
      return event.reactionType==='dodge'?'Esquive déclenchée.':'Réaction déclenchée.';
    case 'status_applied':
      return `Statut appliqué : ${String(event.statusId||'inconnu')}.`;
    case 'status_periodic_effect':
      return `${event.effectType==='heal'?'Soin':'Effet'} périodique${event.statusId?` (${String(event.statusId)})`:''} : ${Number(event.amount)||0}.`;
    case 'status_expired':
      return `Statut terminé : ${String(event.statusId||'inconnu')}.`;
    case 'ko':
      return `${event.side==='player'?'Créature du joueur':'Adversaire'} K.O.`;
    case 'forced_switch':
      return 'Remplacement forcé de la créature active.';
    case 'team_unavailable':
      return 'Aucune créature disponible dans l’équipe.';
    default:
      return null;
  }
}

export function captureUiNoticeFromEvent(event){
  const message=textForEvent(event);
  if(!message) return null;
  return {
    type:String(event.type),
    message,
    side:event.side==null?null:String(event.side),
    blocking:false,
    source:clone(event),
  };
}

export function dispatchCaptureUiEvents(events=[],sink=null){
  const notices=[];
  for(const sourceEvent of events||[]){
    const notice=captureUiNoticeFromEvent(sourceEvent);
    if(!notice) continue;
    notices.push(notice);
    if(typeof sink==='function') sink(clone(notice));
  }
  return notices;
}
