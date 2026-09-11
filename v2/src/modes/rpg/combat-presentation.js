function clone(value) { return structuredClone(value); }

export function createPresentationState() {
  return {
    consumedSeq: 0,
    queue: [],
    current: null,
  };
}

function labelForEvent(event = {}) {
  switch (event.type) {
    case 'action-queued': return { kind: 'action', text: 'Action préparée' };
    case 'action-resolved': {
      const success = event.check?.success !== false;
      const roll = event.check?.roll;
      return { kind: success ? 'success' : 'failure', text: `${success ? 'Réussite' : 'Échec'}${roll != null ? ` · jet ${roll}` : ''}` };
    }
    case 'combatant-ko': return { kind: 'ko', text: 'Combattant hors combat' };
    case 'ko-skipped': return { kind: 'system', text: 'Combattant KO ignoré dans la timeline' };
    case 'turn-begin': return { kind: 'turn', text: 'Début du tour' };
    case 'turn-end': return { kind: 'turn', text: 'Fin du tour' };
    case 'combat-ended': return { kind: 'end', text: event.winner ? `Combat terminé · ${event.winner} gagne` : 'Combat terminé' };
    default: return { kind: 'system', text: event.type || 'Événement de combat' };
  }
}

export function syncPresentationFromCombat(presentation, combat) {
  const next = clone(presentation || createPresentationState());
  const log = Array.isArray(combat?.log) ? combat.log : [];
  const fresh = log.filter(event => Number(event.seq || 0) > Number(next.consumedSeq || 0));
  for (const event of fresh) {
    const display = labelForEvent(event);
    next.queue.push({
      id: `event-${event.seq || `${event.type}-${next.queue.length}`}`,
      seq: Number(event.seq || 0),
      type: event.type,
      kind: display.kind,
      text: display.text,
      actorId: event.actorId ?? null,
      targetId: event.targetId ?? null,
      payload: clone(event),
    });
    next.consumedSeq = Math.max(Number(next.consumedSeq || 0), Number(event.seq || 0));
  }
  return next;
}

export function takeNextPresentation(presentation) {
  const next = clone(presentation || createPresentationState());
  if (next.current) return { presentation: next, item: next.current };
  next.current = next.queue.shift() || null;
  return { presentation: next, item: next.current };
}

export function acknowledgePresentation(presentation) {
  const next = clone(presentation || createPresentationState());
  next.current = null;
  return next;
}

export function drainPresentation(presentation) {
  const next = clone(presentation || createPresentationState());
  const items = [];
  if (next.current) items.push(next.current);
  items.push(...next.queue);
  next.current = null;
  next.queue = [];
  return { presentation: next, items };
}
