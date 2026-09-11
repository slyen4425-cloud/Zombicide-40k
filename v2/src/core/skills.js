import { evaluateConditions } from './conditions.js';
import { applyEffect } from './effects.js';

export function canUseSkill(skill, actorState = {}, context = {}) {
  if (!skill || skill.enabled === false) return { ok: false, reason: 'disabled' };
  if (!evaluateConditions(skill.conditions || [], context, skill.conditionMode || 'all')) return { ok: false, reason: 'conditions' };
  if (Number(skill.cooldown || 0) > 0 && Number(actorState.cooldowns?.[skill.id] || 0) > 0) return { ok: false, reason: 'cooldown' };
  if (skill.maxCharges != null && Number(actorState.charges?.[skill.id] ?? skill.maxCharges) <= 0) return { ok: false, reason: 'charges' };
  if (skill.costResourceId) {
    const current = Number(actorState.resources?.[skill.costResourceId]?.current ?? actorState.resources?.[skill.costResourceId] ?? 0);
    if (current < Math.max(0, Number(skill.costValue) || 0)) return { ok: false, reason: 'resource' };
  }
  return { ok: true };
}

export function resolveSkillUse(skill, actorState, targetState, definitions = {}, context = {}) {
  const check = canUseSkill(skill, actorState, context);
  if (!check.ok) return { resolved: false, reason: check.reason, actorState, targetState, log: [] };

  const actor = structuredClone(actorState || {});
  let target = structuredClone(targetState || {});
  const log = [];

  if (skill.costResourceId && Number(skill.costValue || 0) > 0) {
    const id = skill.costResourceId;
    actor.resources = actor.resources || {};
    const old = actor.resources[id] || { current: 0 };
    const current = Number(old.current ?? old) || 0;
    actor.resources[id] = { ...((typeof old === 'object' && old) || {}), current: Math.max(0, current - Number(skill.costValue || 0)) };
    log.push({ kind: 'cost', resourceId: id, value: Number(skill.costValue || 0) });
  }

  actor.cooldowns = actor.cooldowns || {};
  if (Number(skill.cooldown || 0) > 0) actor.cooldowns[skill.id] = Number(skill.cooldown);

  if (skill.maxCharges != null) {
    actor.charges = actor.charges || {};
    const current = Number(actor.charges[skill.id] ?? skill.maxCharges);
    actor.charges[skill.id] = Math.max(0, current - 1);
  }

  const effects = (skill.effectIds || []).map(id => definitions.effects?.find?.(x => x.id === id)).filter(Boolean);
  for (const effect of effects) {
    const applied = applyEffect(effect, target, definitions, context);
    if (applied.applied) target = applied.state;
    log.push({ kind: 'effect', effectId: effect.id, applied: applied.applied, reason: applied.reason || null });
  }

  return { resolved: true, actorState: actor, targetState: target, log };
}

export function tickSkillCooldowns(actorState = {}) {
  const next = structuredClone(actorState);
  next.cooldowns = next.cooldowns || {};
  Object.keys(next.cooldowns).forEach(id => { next.cooldowns[id] = Math.max(0, Number(next.cooldowns[id]) - 1); });
  return next;
}

export function recoverSkillCharges(actorState = {}, skills = [], recovery = 'combat') {
  const next = structuredClone(actorState);
  next.charges = next.charges || {};
  skills.forEach(skill => {
    if (skill.maxCharges != null && String(skill.recovery || 'combat') === String(recovery)) next.charges[skill.id] = Number(skill.maxCharges);
  });
  return next;
}
