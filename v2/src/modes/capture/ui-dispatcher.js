const clone=value=>structuredClone(value);

export const CAPTURE_UI_DISPATCHER_CONTRACT=Object.freeze({
  presentationOnly:true,
  blocking:false,
  pausesBattle:false,
  mutatesGameplayState:false,
  consumesUiEvents:true,
  captureAttemptNotices:true,
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
    case 'capture_success':
      return 'Capture réussie ! La créature rejoint votre collection.';
    case 'capture_failed':
      return 'Capture ratée. Le combat continue.';
    case 'capture_unavailable':
      switch(String(event.reason||'')){
        case 'missing_species_capture_rate': return 'Capture indisponible : taux de capture de cette espèce non configuré.';
        case 'pending_orb_coefficient': return 'Capture indisponible : coefficient de cette orbe non configuré.';
        case 'pending_low_hp_multiplier': return 'Capture indisponible : bonus de capture sous 30 % PV non configuré.';
        case 'insufficient_capture_item': return 'Capture impossible : vous ne possédez pas cette orbe.';
        case 'invalid_hp': return 'Capture indisponible : PV adverses invalides.';
        default: return 'Capture indisponible pour le moment.';
      }
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
