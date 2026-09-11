import { evaluateConditions } from './conditions.js';
import { resolveResourceMax } from './formulas.js';

function clamp(value, min = null, max = null) {
  let out = Number(value) || 0;
  if (min != null) out = Math.max(Number(min), out);
  if (max != null) out = Math.min(Number(max), out);
  return out;
}

export function applyNumericOperation(current, operation, value) {
  const a = Number(current) || 0;
  const b = Number(value) || 0;
  if (operation === 'set') return b;
  if (operation === 'multiply') return a * b;
  if (operation === 'percent') return a + a * (b / 100);
  if (operation === 'subtract') return a - b;
  return a + b;
}

export function applyEffect(effect, state, definitions = {}, context = {}) {
  if (!effect || effect.enabled === false) return { applied: false, reason: 'disabled', state };
  if (!evaluateConditions(effect.conditions || [], context, effect.conditionMode || 'all')) {
    return { applied: false, reason: 'conditions', state };
  }
  const chance = Math.max(0, Math.min(100, Number(effect.chance ?? 100)));
  const roll = Number(context.randomPercent?.() ?? Math.random() * 100);
  if (roll >= chance) return { applied: false, reason: 'chance', state };

  const next = structuredClone(state);
  if (effect.kind === 'stat-modifier') {
    const id = effect.statId;
    if (!id) return { applied: false, reason: 'missing-stat', state };
    const def = definitions.stats?.find?.(x => x.id === id) || definitions.stats?.[id] || {};
    const current = Number(next.stats?.[id] ?? def.baseValue ?? 0);
    next.stats = next.stats || {};
    next.stats[id] = clamp(applyNumericOperation(current, effect.operation, effect.value), def.min, def.max);
    return { applied: true, state: next };
  }

  if (effect.kind === 'resource-modifier') {
    const id = effect.resourceId;
    if (!id) return { applied: false, reason: 'missing-resource', state };
    const def = definitions.resources?.find?.(x => x.id === id) || definitions.resources?.[id] || {};
    next.resources = next.resources || {};
    const computedMax = resolveResourceMax(def, next, definitions);
    const old = next.resources[id] || { current: 0, max: computedMax };
    const current = Number(old.current ?? old) || 0;
    const max = computedMax || Number(old.max ?? 0) || null;
    next.resources[id] = {
      ...((typeof old === 'object' && old) || {}),
      current: clamp(applyNumericOperation(current, effect.operation, effect.value), def.min ?? 0, max),
      max,
    };
    return { applied: true, state: next };
  }

  return { applied: false, reason: 'unsupported-kind', state };
}
