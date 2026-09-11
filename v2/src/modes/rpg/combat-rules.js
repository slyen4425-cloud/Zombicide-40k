import { processStatuses, decayStatuses } from './status-engine.js';

function numericResource(actor, id) {
  const value = actor?.state?.resources?.[id];
  return Number(value?.current ?? value ?? 0) || 0;
}

function numericStat(actor, id) {
  return Number(actor?.state?.stats?.[id] ?? 0) || 0;
}

export function evaluateDefeatRule(actor, rule = {}) {
  if (!rule || rule.enabled === false || rule.kind === 'none') return false;
  const threshold = Number(rule.threshold ?? 0) || 0;
  let value = 0;
  if (rule.kind === 'resource') value = numericResource(actor, rule.sourceId);
  else if (rule.kind === 'stat') value = numericStat(actor, rule.sourceId);
  else return false;

  switch (rule.operator || 'lte') {
    case 'lt': return value < threshold;
    case 'eq': return value === threshold;
    case 'gte': return value >= threshold;
    case 'gt': return value > threshold;
    default: return value <= threshold;
  }
}

export function processActorTurnStart(actor, { definitions = {}, defeatRule = null, context = {} } = {}) {
  const processed = processStatuses(actor, 'turn-start', { definitions, context });
  let next = decayStatuses(processed.actor, 1);
  const defeated = evaluateDefeatRule(next, defeatRule);
  if (defeated) next.ko = true;
  return { actor: next, statusEvents: processed.events, defeated };
}

export function processActorTurnEnd(actor, { definitions = {}, defeatRule = null, context = {} } = {}) {
  const processed = processStatuses(actor, 'turn-end', { definitions, context });
  const next = processed.actor;
  const defeated = evaluateDefeatRule(next, defeatRule);
  if (defeated) next.ko = true;
  return { actor: next, statusEvents: processed.events, defeated };
}
