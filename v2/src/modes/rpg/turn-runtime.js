import { queueCombatAction, resolveQueuedAction, advanceCombatTurn } from './combat-engine.js';
import { skillAvailability, consumeSkillUse, tickSkillCooldowns } from '../../core/skills.js';
import { validatePlayerTarget } from './targeting-engine.js';

function clone(value) { return structuredClone(value); }

export function prepareSkillAction(combat, skill, targetId, definitions = {}, context = {}) {
  if (!combat || combat.phase !== 'turn') return { ok:false, reason:'not-in-turn', combat };
  const actor = combat.actors?.[combat.activeActorId];
  if (!actor) return { ok:false, reason:'missing-actor', combat };

  const selectedTargetId = targetId || nextDefaultTarget(skill, combat.activeActorId);
  if (String(skill?.target || 'enemy') === 'enemy') {
    const targeting = context.targeting || {};
    const targetCheck = validatePlayerTarget({
      combat,
      actorId: combat.activeActorId,
      targetId: selectedTargetId,
      spatial: targeting.spatial || null,
      source: targeting.source || null,
      config: targeting.config || {},
    });
    if (!targetCheck.ok) return { ok:false, reason:targetCheck.reason, combat, targetCheck };
  }

  const conditions = (skill.conditionIds || [])
    .map(id => definitions.conditions?.find?.(x => String(x.id) === String(id)))
    .filter(Boolean);
  const availability = skillAvailability(skill, actor.state, { ...context, conditions });
  if (!availability.ok) return { ok:false, reason:availability.reason, combat };

  const next = clone(combat);
  next.actors[next.activeActorId].state = consumeSkillUse(skill, availability.actorState);
  const statValue = skill.roll?.statId
    ? Number(next.actors[next.activeActorId].state.stats?.[skill.roll.statId] ?? 0)
    : 0;
  const action = {
    id: context.actionId || globalThis.crypto?.randomUUID?.() || `act_${Date.now()}_${Math.random()}`,
    actorId: next.activeActorId,
    turnSequence: Number(next.turnSequence) || 0,
    targetId: selectedTargetId,
    skillId: skill.id,
    effectIds: [...(skill.effectIds || [])],
    check: skill.roll?.enabled === false ? null : {
      die: Number(skill.roll?.die) || 100,
      statValue,
      difficulty: Number(skill.roll?.difficulty) || 0,
      modifier: Number(context.rollModifier) || 0,
      mode: skill.roll?.mode || 'roll-under',
    },
    context: context.effectContext || {},
  };
  const queued = queueCombatAction(next, action);
  if (!queued.accepted) return { ok:false, reason:queued.reason, combat };
  return { ok:true, combat:queued.combat, action };
}

function nextDefaultTarget(skill, actorId) {
  return String(skill?.target || 'enemy') === 'self' ? String(actorId) : null;
}

export function resolveAndAdvance(combat, options = {}) {
  const result = resolveQueuedAction(combat, options);
  if (!result.resolved) return result;
  let next = result.combat;
  const actorId = next.activeActorId;
  if (actorId && next.actors?.[actorId]) {
    next.actors[actorId].state = tickSkillCooldowns(next.actors[actorId].state, 1);
  }
  next = advanceCombatTurn(next);
  return { ...result, combat:next };
}
