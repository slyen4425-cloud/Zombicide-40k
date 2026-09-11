import { chooseCreatureAction } from './bestiary-engine.js';
import { chooseAiTarget } from './targeting-engine.js';

export function chooseEnemyTurn({
  runtime,
  universe = {},
  combat,
  actorId,
  spatial = null,
  source = null,
  config = {},
  memory = {},
  random = Math.random,
} = {}) {
  if (!runtime) return { ok: false, reason: 'missing-runtime', memory: { ...memory } };
  const action = chooseCreatureAction(runtime, universe, { random });
  if (!action.ok) return { ok: false, reason: action.reason, memory: { ...memory } };

  const ai = { ...(runtime.ai || {}), targetRule: runtime.ai?.targetRule || action.targetRule || 'varied' };
  const target = chooseAiTarget({
    combat,
    actorId: actorId ?? runtime.instanceId,
    spatial,
    source,
    config,
    ai,
    memory,
    random,
  });
  if (!target.ok) return { ok: false, reason: target.reason, skillId: action.skillId, memory: target.memory };

  return {
    ok: true,
    skillId: action.skillId,
    targetId: target.targetId,
    targetRule: target.rule,
    memory: target.memory,
  };
}
