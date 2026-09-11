import { advanceCombatTurn } from './combat-engine.js';
import { evaluateDefeatRule, processActorTurnStart, processActorTurnEnd } from './combat-rules.js';
import { tickSkillCooldowns } from './skill-runtime.js';

function clone(value) { return structuredClone(value); }

function livingSides(combat) {
  return new Set(Object.values(combat.actors || {}).filter(actor => !actor.ko).map(actor => actor.side));
}

export function appendCombatEvent(combat, type, payload = {}) {
  const next = clone(combat);
  next.log = Array.isArray(next.log) ? next.log : [];
  next.eventSequence = Number(next.eventSequence) || 0;
  next.eventSequence += 1;
  next.log.push({
    seq: next.eventSequence,
    type,
    round: next.round ?? 0,
    actorId: next.activeActorId ?? null,
    ...clone(payload),
  });
  return next;
}

export function reconcileCombatState(combat, { defeatRule = null } = {}) {
  let next = clone(combat);
  for (const actor of Object.values(next.actors || {})) {
    if (!actor.ko && evaluateDefeatRule(actor, defeatRule)) {
      actor.ko = true;
      next = appendCombatEvent(next, 'combatant-ko', { actorId: actor.id, side: actor.side, reason: 'defeat-rule' });
    }
  }

  const sides = livingSides(next);
  if (sides.size <= 1 && Object.keys(next.actors || {}).length) {
    next.phase = 'ended';
    next.winner = [...sides][0] || null;
    next.activeActorId = null;
    if (!next.log?.some(event => event.type === 'combat-ended')) {
      next = appendCombatEvent(next, 'combat-ended', { winner: next.winner });
    }
    return next;
  }

  if (next.phase === 'turn' && next.activeActorId && next.actors?.[next.activeActorId]?.ko) {
    const previous = next.activeActorId;
    next = advanceCombatTurn(next);
    if (next.activeActorId !== previous) {
      next = appendCombatEvent(next, 'ko-skipped', { skippedActorId: previous, nextActorId: next.activeActorId });
    }
  }
  return next;
}

export function beginActiveTurn(combat, options = {}) {
  let next = reconcileCombatState(combat, options);
  if (next.phase !== 'turn' || !next.activeActorId) return { combat: next, statusEvents: [], defeated: false };

  const id = next.activeActorId;
  const actor = next.actors[id];
  const processed = processActorTurnStart(actor, options);
  next.actors[id] = processed.actor;
  next = appendCombatEvent(next, 'turn-begin', { actorId: id, statusEvents: processed.statusEvents });
  next = reconcileCombatState(next, options);
  return { combat: next, statusEvents: processed.statusEvents, defeated: processed.defeated };
}

export function endActiveTurn(combat, options = {}) {
  let next = reconcileCombatState(combat, options);
  if (next.phase !== 'turn' || !next.activeActorId) return { combat: next, statusEvents: [], defeated: false };

  const id = next.activeActorId;
  const actor = next.actors[id];
  const processed = processActorTurnEnd(actor, options);
  processed.actor.state = tickSkillCooldowns(processed.actor.state, 1);
  next.actors[id] = processed.actor;
  next = appendCombatEvent(next, 'turn-end', { actorId: id, statusEvents: processed.statusEvents });
  next = reconcileCombatState(next, options);

  if (next.phase === 'turn' && next.activeActorId === id) {
    next = advanceCombatTurn(next);
    next = reconcileCombatState(next, options);
  }
  return { combat: next, statusEvents: processed.statusEvents, defeated: processed.defeated };
}

export function markCombatantDefeated(combat, actorId, reason = 'manual') {
  let next = clone(combat);
  const actor = next.actors?.[String(actorId)];
  if (!actor || actor.ko) return next;
  actor.ko = true;
  next = appendCombatEvent(next, 'combatant-ko', { actorId: actor.id, side: actor.side, reason });
  return reconcileCombatState(next);
}
