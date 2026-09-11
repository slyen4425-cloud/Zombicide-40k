export function resolveFormula(formula = {}, state = {}, definitions = {}) {
  const kind = formula?.kind || 'fixed';
  if (kind === 'fixed') return Number(formula.value) || 0;
  if (kind === 'stat') {
    const id = formula.statId;
    const def = definitions.stats?.find?.(x => String(x.id) === String(id)) || definitions.stats?.[id] || {};
    const value = Number(state.stats?.[id] ?? def.baseValue ?? 0) || 0;
    const multiplier = Number(formula.multiplier ?? 1) || 0;
    const add = Number(formula.add ?? formula.value ?? 0) || 0;
    return value * multiplier + add;
  }
  if (kind === 'resource') {
    const id = formula.resourceId;
    const resource = state.resources?.[id];
    const source = formula.source === 'max' ? Number(resource?.max ?? 0) : Number(resource?.current ?? resource ?? 0);
    return (source || 0) * (Number(formula.multiplier ?? 1) || 0) + (Number(formula.add ?? formula.value ?? 0) || 0);
  }
  return Number(formula.value) || 0;
}

export function resolveResourceMax(resourceDef = {}, state = {}, definitions = {}) {
  const max = resolveFormula(resourceDef.maxFormula || { kind:'fixed', value:0 }, state, definitions);
  return Math.max(Number(resourceDef.min ?? 0) || 0, max);
}

export function normalizeResourceState(resourceDef = {}, state = {}, definitions = {}) {
  const max = resolveResourceMax(resourceDef, state, definitions);
  const existing = state.resources?.[resourceDef.id];
  const current = Number(existing?.current ?? existing ?? max) || 0;
  return { current: Math.max(Number(resourceDef.min ?? 0) || 0, Math.min(max, current)), max };
}
