export function compareValues(left, operator, right) {
  switch (operator) {
    case 'eq': return left === right;
    case 'neq': return left !== right;
    case 'gt': return Number(left) > Number(right);
    case 'gte': return Number(left) >= Number(right);
    case 'lt': return Number(left) < Number(right);
    case 'lte': return Number(left) <= Number(right);
    case 'truthy': return Boolean(left);
    case 'falsy': return !left;
    default: return false;
  }
}

export function resolveConditionValue(condition, context = {}) {
  const kind = condition?.sourceKind;
  const id = condition?.sourceId;
  if (kind === 'stat') return context.stats?.[id] ?? 0;
  if (kind === 'resource') return context.resources?.[id]?.current ?? context.resources?.[id] ?? 0;
  if (kind === 'level') return context.level ?? 1;
  if (kind === 'xp') return context.xp ?? 0;
  if (kind === 'quest') return Boolean(context.quests?.[id]);
  if (kind === 'item') return Number(context.items?.[id] ?? 0);
  if (kind === 'flag') return context.flags?.[id];
  return undefined;
}

export function evaluateCondition(condition, context = {}) {
  if (!condition || condition.enabled === false) return true;
  const actual = resolveConditionValue(condition, context);
  const result = compareValues(actual, condition.operator || 'gte', condition.value);
  return condition.invert ? !result : result;
}

export function evaluateConditions(conditions = [], context = {}, mode = 'all') {
  const enabled = conditions.filter(c => c?.enabled !== false);
  if (!enabled.length) return true;
  if (mode === 'any') return enabled.some(c => evaluateCondition(c, context));
  return enabled.every(c => evaluateCondition(c, context));
}
