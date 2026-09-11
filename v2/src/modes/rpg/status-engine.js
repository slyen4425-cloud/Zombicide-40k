import { applyEffect } from '../../core/effects.js';

function clone(value) {
  return structuredClone(value);
}

function effectById(definitions, effectId) {
  return definitions?.effects?.find?.(x => String(x.id) === String(effectId)) || definitions?.effects?.[effectId] || null;
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

export function addPersistentStatus(actor, status, { definitions = {}, context = {} } = {}) {
  const next = clone(actor || {});
  next.statuses = Array.isArray(next.statuses) ? next.statuses : [];
  const id = String(status?.id || '');
  if (!id) return { ok: false, reason: 'missing-status-id', actor: next };

  const existing = next.statuses.find(x => x.id === id);
  if (existing) {
    existing.remaining = Math.max(Number(existing.remaining) || 0, Math.max(1, Number(status.remaining ?? status.duration ?? 1) || 1));
    return { ok: true, refreshed: true, actor: next, status: clone(existing) };
  }

  const effect = effectById(definitions, status?.effectId);
  if (!effect) return { ok: false, reason: 'missing-effect', actor: next };
  if (effect.kind !== 'stat-modifier' || !effect.statId) return { ok: false, reason: 'unsupported-persistent-effect', actor: next };

  const statId = String(effect.statId);
  const previousValue = Number(next.state?.stats?.[statId] ?? definitions?.stats?.find?.(x => String(x.id) === statId)?.baseValue ?? 0) || 0;
  const applied = applyEffect(effect, next.state || {}, definitions, context);
  if (!applied.applied) return { ok: false, reason: applied.reason || 'not-applied', actor: next };

  next.state = applied.state;
  const appliedValue = Number(next.state?.stats?.[statId] ?? previousValue) || 0;
  const appliedDelta = appliedValue - previousValue;
  const sourceId = String(status.sourceId || status.source || id);
  const incoming = {
    id,
    sourceId,
    label: status.label || status.name || 'Effet temporaire',
    effectId: String(status.effectId),
    remaining: Math.max(1, Number(status.remaining ?? status.duration ?? 1) || 1),
    timing: 'persistent',
    stackable: false,
    maxStacks: 1,
    stacks: 1,
    persistent: true,
    modifier: {
      kind: 'stat',
      id: statId,
      sourceId,
      operation: effect.operation || 'add',
      value: Number(effect.value) || 0,
      appliedDelta,
    },
    // Kept only so old serialized actors can still be read during the V2 transition.
    revert: { kind: 'stat-delta', id: statId, delta: appliedDelta, sourceId },
  };
  next.statuses.push(incoming);
  return { ok: true, refreshed: false, actor: next, status: clone(incoming) };
}

export function processStatuses(actor, timing, { definitions = {}, context = {} } = {}) {
  const next = clone(actor || {});
  next.statuses = Array.isArray(next.statuses) ? next.statuses : [];
  const events = [];

  for (const status of next.statuses) {
    if (status.persistent || status.timing === 'persistent') continue;
    if (status.timing !== timing || !status.effectId) continue;
    const effect = effectById(definitions, status.effectId);
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
  const kept = [];
  for (const rawStatus of Array.isArray(next.statuses) ? next.statuses : []) {
    const status = { ...rawStatus, remaining: Math.max(0, (Number(rawStatus.remaining) || 0) - step) };
    if (status.remaining > 0) {
      kept.push(status);
      continue;
    }
    if (status.persistent && status.revert?.kind === 'stat-delta' && status.revert.id) {
      next.state = next.state || {};
      next.state.stats = next.state.stats || {};
      const statId = String(status.revert.id);
      const current = Number(next.state.stats[statId]) || 0;
      next.state.stats[statId] = current - (Number(status.revert.delta) || 0);
      continue;
    }
    // Legacy V2 saves created before source-layered modifiers used an absolute rollback.
    if (status.persistent && status.revert?.kind === 'stat' && status.revert.id) {
      next.state = next.state || {};
      next.state.stats = next.state.stats || {};
      next.state.stats[String(status.revert.id)] = Number(status.revert.previousValue) || 0;
    }
  }
  next.statuses = kept;
  return next;
}
