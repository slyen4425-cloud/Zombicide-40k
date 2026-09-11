import { evaluateConditions } from './conditions.js';
import { applyEffect } from './effects.js';

function findById(list = [], id) {
  return list.find(x => String(x.id) === String(id));
}

export function canActivateHeroForm(form, heroState = {}, definitions = {}, context = {}) {
  if (!form || form.enabled === false) return { ok: false, reason: 'disabled' };
  const conditions = (form.conditionIds || []).map(id => findById(definitions.conditions || [], id)).filter(Boolean);
  if (!evaluateConditions(conditions, context, form.conditionMode || 'all')) return { ok: false, reason: 'conditions' };
  if (form.costResourceId) {
    const current = Number(heroState.resources?.[form.costResourceId]?.current ?? heroState.resources?.[form.costResourceId] ?? 0);
    if (current < Math.max(0, Number(form.costValue) || 0)) return { ok: false, reason: 'resource' };
  }
  return { ok: true };
}

export function activateHeroForm(form, heroState = {}, definitions = {}, context = {}) {
  const check = canActivateHeroForm(form, heroState, definitions, context);
  if (!check.ok) return { activated: false, reason: check.reason, state: heroState };

  let next = structuredClone(heroState);
  if (form.costResourceId && Number(form.costValue || 0) > 0) {
    const id = form.costResourceId;
    next.resources = next.resources || {};
    const old = next.resources[id] || { current: 0 };
    const current = Number(old.current ?? old) || 0;
    next.resources[id] = { ...((typeof old === 'object' && old) || {}), current: Math.max(0, current - Number(form.costValue || 0)) };
  }

  const effectLog = [];
  for (const effectId of form.effectIds || []) {
    const effect = findById(definitions.effects || [], effectId);
    if (!effect) continue;
    const out = applyEffect(effect, next, definitions, context);
    if (out.applied) next = out.state;
    effectLog.push({ effectId, applied: out.applied, reason: out.reason || null });
  }

  next.activeForms = Array.isArray(next.activeForms) ? [...next.activeForms] : [];
  if (!next.activeForms.some(x => String(x.id) === String(form.id))) {
    next.activeForms.push({
      id: form.id,
      type: form.type || 'temporary',
      remaining: form.type === 'permanent' || form.duration?.kind === 'permanent' ? null : Math.max(0, Number(form.duration?.value) || 0),
      durationKind: form.duration?.kind || (form.type === 'permanent' ? 'permanent' : 'turns'),
      addedSkillIds: [...(form.addedSkillIds || [])],
    });
  }
  if (form.type === 'permanent') next.currentPermanentFormId = form.id;

  return { activated: true, state: next, effectLog };
}

export function tickHeroForms(heroState = {}, definitions = {}, context = {}) {
  const next = structuredClone(heroState);
  const kept = [];
  for (const active of next.activeForms || []) {
    const form = findById(definitions.forms || [], active.id);
    if (!form) continue;
    if (active.durationKind === 'permanent' || form.type === 'permanent') { kept.push(active); continue; }
    if (active.durationKind === 'while-condition') {
      const conditions = (form.returnConditionIds || []).map(id => findById(definitions.conditions || [], id)).filter(Boolean);
      const shouldEnd = conditions.length ? evaluateConditions(conditions, context, form.returnConditionMode || 'any') : false;
      if (!shouldEnd) kept.push(active);
      continue;
    }
    const remaining = Math.max(0, Number(active.remaining) - 1);
    if (remaining > 0) kept.push({ ...active, remaining });
  }
  next.activeForms = kept;
  return next;
}

export function activeFormSkillIds(heroState = {}) {
  return [...new Set((heroState.activeForms || []).flatMap(x => x.addedSkillIds || []))];
}
