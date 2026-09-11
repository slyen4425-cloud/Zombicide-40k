export function rollDie(sides = 100, random = Math.random) {
  const n = Math.max(2, Math.floor(Number(sides) || 100));
  const value = Math.max(0, Math.min(0.999999999, Number(random())));
  return Math.floor(value * n) + 1;
}

export function normalizeCheckSpec(spec = {}) {
  const mode = spec.mode === 'roll-over' ? 'roll-over' : 'roll-under';
  return {
    die: Math.max(2, Math.floor(Number(spec.die) || 100)),
    statId: spec.statId == null ? null : String(spec.statId),
    statValue: Number(spec.statValue) || 0,
    difficulty: Number(spec.difficulty) || 0,
    modifier: Number(spec.modifier) || 0,
    mode,
  };
}

export function resolveCheck({ die = 100, roll = null, statValue = 0, difficulty = 50, modifier = 0, mode = 'roll-under', random = Math.random } = {}) {
  const spec = normalizeCheckSpec({ die, statValue, difficulty, modifier, mode });
  const rolled = roll == null ? rollDie(spec.die, random) : Number(roll);
  const threshold = spec.mode === 'roll-over'
    ? spec.difficulty - spec.statValue - spec.modifier
    : spec.difficulty + spec.statValue + spec.modifier;
  const success = spec.mode === 'roll-over' ? rolled >= threshold : rolled <= threshold;
  return {
    roll: rolled,
    success,
    threshold,
    die: spec.die,
    mode: spec.mode,
    statValue: spec.statValue,
    difficulty: spec.difficulty,
    modifier: spec.modifier,
  };
}

export function resolveActorCheck(spec = {}, actor = {}, { random = Math.random, roll = null } = {}) {
  const normalized = normalizeCheckSpec(spec);
  const stats = actor?.state?.stats || actor?.stats || {};
  const statValue = normalized.statId ? Number(stats?.[normalized.statId] ?? 0) || 0 : normalized.statValue;
  return resolveCheck({
    ...normalized,
    roll: roll ?? spec.roll ?? null,
    statValue,
    random,
  });
}

export function findCheckDefinition(definitions = {}, checkId = null) {
  if (checkId == null || checkId === '') return null;
  const id = String(checkId);
  const checks = definitions?.checks || [];
  if (Array.isArray(checks)) return checks.find(check => String(check?.id) === id) || null;
  return checks?.[id] || null;
}

export function resolveDefinedActorCheck({ checkId = null, fallback = null, definitions = {}, actor = {}, random = Math.random, roll = null } = {}) {
  const defined = findCheckDefinition(definitions, checkId);
  if (defined?.enabled === false) return { ok: false, reason: 'check-disabled', check: null, definition: defined };
  const spec = defined || fallback;
  if (!spec) return { ok: true, check: { success: true, roll: null, threshold: null }, definition: null };
  return { ok: true, check: resolveActorCheck(spec, actor, { random, roll }), definition: defined || null };
}
