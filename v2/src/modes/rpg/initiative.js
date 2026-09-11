import { rollDie } from './combat-engine.js';

function valueFromPath(state = {}, source = {}) {
  if (source.kind === 'stat') return Number(state.stats?.[source.id] ?? 0) || 0;
  if (source.kind === 'resource') return Number(state.resources?.[source.id]?.current ?? state.resources?.[source.id] ?? 0) || 0;
  if (source.kind === 'fixed') return Number(source.value) || 0;
  return 0;
}

export function calculateInitiative(combatant, rule = {}, random = Math.random) {
  const mode = rule.mode || 'stat';
  const state = combatant?.state || {};
  const base = Number(rule.base) || 0;
  const source = valueFromPath(state, rule.source || {});
  const globalModifier = Number(rule.modifier) || 0;
  const actorModifier = Number(combatant?.initiativeModifier) || 0;
  const modifier = globalModifier + actorModifier;
  let roll = null;
  let total = base + source + modifier;

  if (mode === 'roll') {
    roll = rollDie(rule.die || 20, random);
    total += roll;
  } else if (mode === 'fixed') {
    total = base + modifier;
  }

  return { total, roll, base, source, modifier, globalModifier, actorModifier };
}

export function buildInitiativeOrder(combatants = [], rule = {}, random = Math.random) {
  return combatants.map((combatant, index) => {
    const result = calculateInitiative(combatant, rule, random);
    return {
      id: String(combatant.id),
      side: combatant.side || 'neutral',
      orderIndex: index,
      initiative: result.total,
      initiativeRoll: result.roll,
      initiativeBreakdown: result,
    };
  }).sort((a, b) => b.initiative - a.initiative || a.orderIndex - b.orderIndex);
}
