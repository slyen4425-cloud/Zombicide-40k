import { applyEffect } from '../../core/effects.js';

function clone(value) {
  return structuredClone(value);
}

export function addTimedStatus(actor, status) {
  const next = clone(actor || {});
  next.statuses = Array.isArray(next.statuses) ? next.statuses : [];
  const incoming = {
    id: String(status.id),
    label: status.label || status.name || 'Effet temporaire',
    effectId: status.effectId || null,
    remaining: Math.max(1, Number(status.remaining ?? status.duration ?? 1) || 1),
    timing: status.timing || 'turn-start',
    stackable: Boolean(status.stackable),
    maxStacks: Math.max(1, Number(status.maxStacks) || 1),
    stacks: Math.max(1, Number(status.stacks) || 1),
  };

  const existing = next.statuses.find(x => x.id === incoming.id);
  if (!existing) next.statuses.push(incoming);
  else if (incoming.stackable) {
    existing.stacks = Math.min(incoming.maxStacks, (Number(existing.stacks) || 1) + incoming.stacks);
    existing.remaining = Math.max(existing.remaining, incoming.remaining);
  } else {
    existing.remaining = Math.max(existing.remaining, incoming.remaining);
  }
  return next;
}

export function processStatuses(actor, timing, { definitions = {}, context = {} } = {}) {
  const next = clone(actor || {});
  next.statuses = Array.isArray(next.statuses) ? next.statuses : [];
  const events = [];

  for (const status of next.statuses) {
    if (status.timing !== timing || !status.effectId) continue;
    const effect = definitions.effects?.find?.(x => String(x.id) === String(status.effectId));
    if (!effect) {
      events.push({ statusId: status.id, applied: false, reason: 'missing-effect' });
      continue;
    }
    const runs = Math.max(1, Number(status.stacks) || 1);
    let state = next.state || {};
    let appliedCount = 0;
    for (let i = 0; i < runs; i += 1) {
      const out = applyEffect(effect, state, definitions, context);
      if (out.applied) {
        state = out.state;
        appliedCount += 1;
      }
    }
    next.state = state;
    events.push({ statusId: status.id, applied: appliedCount > 0, appliedCount });
  }
  return { actor: next, events };
}

export function decayStatuses(actor, amount = 1) {
  const next = clone(actor || {});
  const step = Math.max(0, Number(amount) || 0);
  next.statuses = (Array.isArray(next.statuses) ? next.statuses : [])
    .map(status => ({ ...status, remaining: Math.max(0, (Number(status.remaining) || 0) - step) }))
    .filter(status => status.remaining > 0);
  return next;
}
