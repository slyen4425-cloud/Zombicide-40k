import { applyEffect } from '../../core/effects.js';
import { rollDie, resolveCheck } from '../../core/checks.js';
export { rollDie, resolveCheck } from '../../core/checks.js';

function clone(value) {
  return structuredClone(value);
}

export function createCombatState({ combatants = [], round = 1 } = {}) {
  const normalized = combatants.map((c, index) => ({
    id: String(c.id),
    side: c.side || 'neutral',
    initiative: Number(c.initiative) || 0,
    orderIndex: index,
    state: clone(c.state || {}),
    ko: Boolean(c.ko),
    allyKind: c.allyKind == null ? null : String(c.allyKind),
    controlMode: c.controlMode == null ? null : String(c.controlMode),
    ownerActorId: c.ownerActorId == null ? null : String(c.ownerActorId),
    sourceKind: c.sourceKind == null ? null : String(c.sourceKind),
    metadata: clone(c.metadata || {}),
  }));
  normalized.sort((a, b) => b.initiative - a.initiative || a.orderIndex - b.orderIndex);
  return {
    phase: normalized.length ? 'turn' : 'idle',
    round,
    order: normalized.map(c => c.id),
    actors: Object.fromEntries(normalized.map(c => [c.id, c])),
    turnIndex: 0,
    turnSequence: normalized.length ? 1 : 0,
    activeActorId: normalized[0]?.id || null,
    pendingAction: null,
    processedActionIds: [],
    log: [],
    winner: null,
  };
}

export function queueCombatAction(combat, action) {
  if (!combat || combat.phase !== 'turn') return { accepted: false, reason: 'not-in-turn', combat };
  if (combat.pendingAction) return { accepted: false, reason: 'action-pending', combat };
  if (!action?.id) return { accepted: false, reason: 'missing-action-id', combat };
  if (combat.processedActionIds.includes(String(action.id))) return { accepted: false, reason: 'duplicate-action', combat };
  if (String(action.actorId) !== String(combat.activeActorId)) return { accepted: false, reason: 'wrong-actor', combat };
  if (action.turnSequence != null && Number(action.turnSequence) !== Number(combat.turnSequence)) {
    return { accepted: false, reason: 'stale-turn', combat };
  }
  const next = clone(combat);
  next.pendingAction = clone({
    ...action,
    id: String(action.id),
    actorId: String(action.actorId),
    turnSequence: Number(action.turnSequence ?? combat.turnSequence),
  });
  next.log.push({ type: 'action-queued', actionId: String(action.id), actorId: String(action.actorId), turnSequence: next.pendingAction.turnSequence });
  return { accepted: true, combat: next };
}

export function resolveQueuedAction(combat, { definitions = {}, checkResult = null, randomPercent = null } = {}) {
  if (!combat?.pendingAction) return { resolved: false, reason: 'no-pending-action', combat };
  const action = combat.pendingAction;
  if (combat.processedActionIds.includes(String(action.id))) {
    const safe = clone(combat);
    safe.pendingAction = null;
    return { resolved: false, reason: 'duplicate-action', combat: safe };
  }
  if (Number(action.turnSequence) !== Number(combat.turnSequence) || String(action.actorId) !== String(combat.activeActorId)) {
    const safe = clone(combat);
    safe.pendingAction = null;
    safe.log.push({ type: 'action-rejected', actionId: String(action.id), actorId: String(action.actorId), reason: 'stale-turn' });
    return { resolved: false, reason: 'stale-turn', combat: safe };
  }

  const next = clone(combat);
  const actor = next.actors[action.actorId];
  const target = next.actors[String(action.targetId || action.actorId)];
  if (!actor || !target) {
    next.pendingAction = null;
    return { resolved: false, reason: 'missing-combatant', combat: next };
  }

  const check = action.check ? (checkResult || resolveCheck(action.check)) : { success: true, roll: null, threshold: null };
  const applied = [];
  if (check.success) {
    for (const effectId of action.effectIds || []) {
      const effect = definitions.effects?.find?.(x => String(x.id) === String(effectId));
      if (!effect) { applied.push({ effectId, applied: false, reason: 'missing-effect' }); continue; }
      const out = applyEffect(effect, target.state, definitions, { ...(action.context || {}), randomPercent: randomPercent || (() => 0) });
      if (out.applied) target.state = out.state;
      applied.push({ effectId, applied: out.applied, reason: out.reason || null });
    }
  }

  next.processedActionIds.push(String(action.id));
  next.pendingAction = null;
  next.log.push({ type: 'action-resolved', actionId: String(action.id), actorId: action.actorId, targetId: target.id, turnSequence: action.turnSequence, check, effects: applied });
  return { resolved: true, combat: next, check, effects: applied };
}

export function advanceCombatTurn(combat) {
  if (!combat || combat.phase !== 'turn' || combat.pendingAction) return combat;
  const next = clone(combat);
  const livingOrder = next.order.filter(id => !next.actors[id]?.ko);
  if (!livingOrder.length) { next.phase = 'ended'; next.activeActorId = null; return next; }
  const currentPos = livingOrder.indexOf(next.activeActorId);
  const nextPos = currentPos < 0 ? 0 : (currentPos + 1) % livingOrder.length;
  if (currentPos >= 0 && nextPos === 0) next.round += 1;
  next.activeActorId = livingOrder[nextPos];
  next.turnIndex += 1;
  next.turnSequence = (Number(next.turnSequence) || 0) + 1;
  next.log.push({ type: 'turn-start', round: next.round, actorId: next.activeActorId, turnSequence: next.turnSequence });
  return next;
}

export function markCombatantKo(combat, actorId, ko = true) {
  const next = clone(combat);
  if (next.actors[String(actorId)]) next.actors[String(actorId)].ko = Boolean(ko);
  const sidesAlive = new Set(Object.values(next.actors).filter(x => !x.ko).map(x => x.side));
  if (sidesAlive.size <= 1) {
    next.phase = 'ended';
    next.winner = [...sidesAlive][0] || null;
    next.activeActorId = null;
  }
  return next;
}
