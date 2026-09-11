function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function id() {
  return globalThis.crypto?.randomUUID?.() || `v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function ensureAdvancedRpgCollections(universe) {
  universe.conditions = Array.isArray(universe.conditions) ? universe.conditions : [];
  universe.effects = Array.isArray(universe.effects) ? universe.effects : [];
  universe.skills = Array.isArray(universe.skills) ? universe.skills : [];
  universe.forms = Array.isArray(universe.forms) ? universe.forms : [];
  return universe;
}

export function newCondition() {
  return { id: id(), name: 'Nouvelle condition', enabled: true, sourceKind: 'stat', sourceId: null, operator: 'gte', value: 1, invert: false };
}

export function newEffect() {
  return { id: id(), name: 'Nouvel effet', enabled: true, kind: 'stat-modifier', statId: null, resourceId: null, operation: 'add', value: 1, valueMode: 'fixed', duration: 0, timing: 'immediate', chance: 100, stackable: false, maxStacks: 1 };
}

export function newSkill() {
  return { id: id(), name: 'Nouvelle compétence', icon: '✨', kind: 'active', description: '', conditionIds: [], costResourceId: null, costValue: 0, cooldown: 0, maxCharges: null, recovery: 'combat', roll: { enabled: true, die: 100, statId: null, difficulty: 50 }, target: 'enemy', effectIds: [] };
}

export function newHeroForm() {
  return { id: id(), name: 'Nouvelle forme', icon: '⚡', type: 'temporary', conditionIds: [], costResourceId: null, costValue: 0, duration: { kind: 'turns', value: 3 }, effectIds: [], addedSkillIds: [], returnConditionIds: [] };
}

function options(list, selected, none = '— Aucun —') {
  return [`<option value="">${none}</option>`, ...list.map(x => `<option value="${esc(x.id)}" ${String(x.id) === String(selected || '') ? 'selected' : ''}>${esc(x.icon || '')} ${esc(x.name || 'Sans nom')}</option>`)].join('');
}

function multiOptions(list, selected = []) {
  const set = new Set((selected || []).map(String));
  return list.map(x => `<option value="${esc(x.id)}" ${set.has(String(x.id)) ? 'selected' : ''}>${esc(x.icon || '')} ${esc(x.name || 'Sans nom')}</option>`).join('');
}

function sourceOptions(condition, universe) {
  if (condition.sourceKind === 'stat') return options(universe.stats, condition.sourceId, '— Choisir une statistique —');
  if (condition.sourceKind === 'resource') return options(universe.resources, condition.sourceId, '— Choisir une ressource —');
  return '<option value="">Valeur générale</option>';
}

function conditionCard(c, universe) {
  return `<article class="editor-card compact" data-condition-id="${esc(c.id)}">
    <div class="editor-card-head"><strong>🔀 ${esc(c.name)}</strong><button class="help-button tiny" data-help="rpg-condition" type="button">?</button></div>
    <div class="form-grid">
      <label>Nom<input data-f="name" value="${esc(c.name)}"></label>
      <label>Source<select data-f="sourceKind"><option value="stat" ${c.sourceKind === 'stat' ? 'selected' : ''}>Statistique</option><option value="resource" ${c.sourceKind === 'resource' ? 'selected' : ''}>Ressource</option><option value="level" ${c.sourceKind === 'level' ? 'selected' : ''}>Niveau</option><option value="xp" ${c.sourceKind === 'xp' ? 'selected' : ''}>XP</option></select></label>
      <label>Valeur liée<select data-f="sourceId">${sourceOptions(c, universe)}</select></label>
      <label>Comparaison<select data-f="operator"><option value="gte" ${c.operator === 'gte' ? 'selected' : ''}>≥</option><option value="gt" ${c.operator === 'gt' ? 'selected' : ''}>&gt;</option><option value="lte" ${c.operator === 'lte' ? 'selected' : ''}>≤</option><option value="lt" ${c.operator === 'lt' ? 'selected' : ''}>&lt;</option><option value="eq" ${c.operator === 'eq' ? 'selected' : ''}>=</option><option value="neq" ${c.operator === 'neq' ? 'selected' : ''}>≠</option></select></label>
      <label>Valeur<input data-f="value" type="number" value="${Number(c.value) || 0}"></label>
    </div>
    <div class="toggle-row"><label><input data-f="enabled" type="checkbox" ${c.enabled !== false ? 'checked' : ''}> Active</label><label><input data-f="invert" type="checkbox" ${c.invert ? 'checked' : ''}> Inverser le résultat</label></div>
    <button class="danger-button" data-delete-condition="${esc(c.id)}" type="button">Supprimer</button>
  </article>`;
}

function effectCard(e, universe) {
  return `<article class="editor-card compact" data-effect-id="${esc(e.id)}">
    <div class="editor-card-head"><strong>✨ ${esc(e.name)}</strong><button class="help-button tiny" data-help="rpg-effect" type="button">?</button></div>
    <div class="form-grid">
      <label>Nom<input data-f="name" value="${esc(e.name)}"></label>
      <label>Type<select data-f="kind"><option value="stat-modifier" ${e.kind === 'stat-modifier' ? 'selected' : ''}>Modifier une statistique</option><option value="resource-modifier" ${e.kind === 'resource-modifier' ? 'selected' : ''}>Modifier une ressource</option></select></label>
      <label>Statistique<select data-f="statId">${options(universe.stats, e.statId)}</select></label>
      <label>Ressource<select data-f="resourceId">${options(universe.resources, e.resourceId)}</select></label>
      <label>Opération<select data-f="operation"><option value="add" ${e.operation === 'add' ? 'selected' : ''}>Ajouter</option><option value="subtract" ${e.operation === 'subtract' ? 'selected' : ''}>Retirer</option><option value="set" ${e.operation === 'set' ? 'selected' : ''}>Fixer</option><option value="multiply" ${e.operation === 'multiply' ? 'selected' : ''}>Multiplier</option></select></label>
      <label>Valeur<input data-f="value" type="number" step="0.1" value="${Number(e.value) || 0}"></label>
      <label>Durée (tours, 0 = immédiat)<input data-f="duration" type="number" min="0" value="${Math.max(0, Number(e.duration) || 0)}"></label>
      <label>Chance %<input data-f="chance" type="number" min="0" max="100" value="${Math.max(0, Math.min(100, Number(e.chance ?? 100)))}"></label>
    </div>
    <div class="toggle-row"><label><input data-f="enabled" type="checkbox" ${e.enabled !== false ? 'checked' : ''}> Actif</label><label><input data-f="stackable" type="checkbox" ${e.stackable ? 'checked' : ''}> Cumulable</label></div>
    <button class="danger-button" data-delete-effect="${esc(e.id)}" type="button">Supprimer</button>
  </article>`;
}

function skillCard(s, universe) {
  return `<article class="editor-card" data-skill-id="${esc(s.id)}">
    <div class="editor-card-head"><strong>${esc(s.icon)} ${esc(s.name)}</strong><button class="help-button tiny" data-help="rpg-skill" type="button">?</button></div>
    <div class="form-grid">
      <label>Nom<input data-f="name" value="${esc(s.name)}"></label><label>Icône<input data-f="icon" value="${esc(s.icon)}" maxlength="6"></label>
      <label>Type<select data-f="kind"><option value="active" ${s.kind === 'active' ? 'selected' : ''}>Active</option><option value="passive" ${s.kind === 'passive' ? 'selected' : ''}>Passive</option></select></label>
      <label>Cible<select data-f="target"><option value="self" ${s.target === 'self' ? 'selected' : ''}>Lanceur</option><option value="ally" ${s.target === 'ally' ? 'selected' : ''}>Allié</option><option value="enemy" ${s.target === 'enemy' ? 'selected' : ''}>Ennemi</option><option value="all-allies" ${s.target === 'all-allies' ? 'selected' : ''}>Tous les alliés</option><option value="all-enemies" ${s.target === 'all-enemies' ? 'selected' : ''}>Tous les ennemis</option></select></label>
      <label>Coût<select data-f="costResourceId">${options(universe.resources, s.costResourceId, '— Gratuit —')}</select></label><label>Valeur du coût<input data-f="costValue" type="number" min="0" value="${Number(s.costValue) || 0}"></label>
      <label>Recharge (tours)<input data-f="cooldown" type="number" min="0" value="${Number(s.cooldown) || 0}"></label><label>Charges max<input data-f="maxCharges" type="number" min="0" placeholder="Illimité" value="${s.maxCharges ?? ''}"></label>
      <label>Stat de jet<select data-f="roll.statId">${options(universe.stats, s.roll?.statId)}</select></label><label>Difficulté / seuil<input data-f="roll.difficulty" type="number" value="${Number(s.roll?.difficulty ?? 50)}"></label>
      <label>Conditions<select data-f="conditionIds" multiple size="4">${multiOptions(universe.conditions, s.conditionIds)}</select></label><label>Effets<select data-f="effectIds" multiple size="4">${multiOptions(universe.effects, s.effectIds)}</select></label>
    </div>
    <label class="wide-label">Description<textarea data-f="description" rows="2">${esc(s.description)}</textarea></label>
    <div class="toggle-row"><label><input data-f="roll.enabled" type="checkbox" ${s.roll?.enabled !== false ? 'checked' : ''}> Utilise un jet</label></div>
    <button class="danger-button" data-delete-skill="${esc(s.id)}" type="button">Supprimer</button>
  </article>`;
}

function formCard(f, universe) {
  const duration = f.duration || { kind: 'turns', value: 3 };
  return `<article class="editor-card" data-form-id="${esc(f.id)}">
    <div class="editor-card-head"><strong>${esc(f.icon)} ${esc(f.name)}</strong><button class="help-button tiny" data-help="rpg-form" type="button">?</button></div>
    <div class="form-grid">
      <label>Nom<input data-f="name" value="${esc(f.name)}"></label><label>Icône<input data-f="icon" value="${esc(f.icon)}" maxlength="6"></label>
      <label>Nature<select data-f="type"><option value="temporary" ${f.type === 'temporary' ? 'selected' : ''}>Transformation temporaire</option><option value="permanent" ${f.type === 'permanent' ? 'selected' : ''}>Évolution permanente</option></select></label>
      <label>Conditions d'activation<select data-f="conditionIds" multiple size="4">${multiOptions(universe.conditions, f.conditionIds)}</select></label>
      <label>Coût<select data-f="costResourceId">${options(universe.resources, f.costResourceId, '— Aucun coût —')}</select></label><label>Valeur du coût<input data-f="costValue" type="number" min="0" value="${Number(f.costValue) || 0}"></label>
      <label>Durée<select data-f="duration.kind"><option value="turns" ${duration.kind === 'turns' ? 'selected' : ''}>Tours</option><option value="while-condition" ${duration.kind === 'while-condition' ? 'selected' : ''}>Tant que condition vraie</option><option value="permanent" ${duration.kind === 'permanent' ? 'selected' : ''}>Permanente</option></select></label><label>Nombre de tours<input data-f="duration.value" type="number" min="0" value="${Number(duration.value) || 0}"></label>
      <label>Effets de forme<select data-f="effectIds" multiple size="4">${multiOptions(universe.effects, f.effectIds)}</select></label><label>Compétences ajoutées<select data-f="addedSkillIds" multiple size="4">${multiOptions(universe.skills, f.addedSkillIds)}</select></label>
    </div>
    <button class="danger-button" data-delete-form="${esc(f.id)}" type="button">Supprimer</button>
  </article>`;
}

function valueOf(input) {
  if (input.multiple) return [...input.selectedOptions].map(o => o.value).filter(Boolean);
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'number') return input.value === '' ? null : Number(input.value);
  return input.value || null;
}

function setNested(target, path, value) {
  const keys = path.split('.');
  let cursor = target;
  while (keys.length > 1) { const key = keys.shift(); cursor[key] = cursor[key] || {}; cursor = cursor[key]; }
  cursor[keys[0]] = value;
}

export function mountAdvancedRpgEditor(host, universe, onChange) {
  ensureAdvancedRpgCollections(universe);
  host.innerHTML = `
    <section class="editor-section"><div class="section-title-row"><div><h3>Conditions</h3><p class="muted">Briques réutilisables : stat, ressource, niveau ou XP.</p></div><button class="primary-button" id="addRpgCondition" type="button">+ Condition</button></div><div class="editor-list">${universe.conditions.map(x => conditionCard(x, universe)).join('') || '<p class="muted">Aucune condition.</p>'}</div></section>
    <section class="editor-section"><div class="section-title-row"><div><h3>Effets</h3><p class="muted">Effets génériques réutilisables par compétences, objets, pièges, événements et formes.</p></div><button class="primary-button" id="addRpgEffect" type="button">+ Effet</button></div><div class="editor-list">${universe.effects.map(x => effectCard(x, universe)).join('') || '<p class="muted">Aucun effet.</p>'}</div></section>
    <section class="editor-section"><div class="section-title-row"><div><h3>Compétences</h3><p class="muted">Coût, charges, jet, conditions, cible et effets sont liés par menus.</p></div><button class="primary-button" id="addRpgSkill" type="button">+ Compétence</button></div><div class="editor-list">${universe.skills.map(x => skillCard(x, universe)).join('') || '<p class="muted">Aucune compétence.</p>'}</div></section>
    <section class="editor-section"><div class="section-title-row"><div><h3>Évolutions & transformations</h3><p class="muted">Permanentes ou temporaires, avec conditions, coût, durée, effets et compétences ajoutées.</p></div><button class="primary-button" id="addRpgForm" type="button">+ Forme</button></div><div class="editor-list">${universe.forms.map(x => formCard(x, universe)).join('') || '<p class="muted">Aucune forme.</p>'}</div></section>`;

  const rerender = () => onChange?.(universe, true);
  host.querySelector('#addRpgCondition')?.addEventListener('click', () => { universe.conditions.push(newCondition()); rerender(); });
  host.querySelector('#addRpgEffect')?.addEventListener('click', () => { universe.effects.push(newEffect()); rerender(); });
  host.querySelector('#addRpgSkill')?.addEventListener('click', () => { universe.skills.push(newSkill()); rerender(); });
  host.querySelector('#addRpgForm')?.addEventListener('click', () => { universe.forms.push(newHeroForm()); rerender(); });

  const bind = (selector, list) => host.querySelectorAll(selector).forEach(card => {
    const key = selector.slice(6, -1).replace('-id', '');
    const record = list.find(x => String(x.id) === String(card.dataset[key]));
    card.querySelectorAll('[data-f]').forEach(input => input.addEventListener('change', () => { setNested(record, input.dataset.f, valueOf(input)); rerender(); }));
  });
  bind('[data-condition-id]', universe.conditions);
  bind('[data-effect-id]', universe.effects);
  bind('[data-skill-id]', universe.skills);
  bind('[data-form-id]', universe.forms);

  host.querySelectorAll('[data-delete-condition]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.deleteCondition; universe.conditions = universe.conditions.filter(x => x.id !== id); universe.skills.forEach(x => x.conditionIds = (x.conditionIds || []).filter(v => v !== id)); universe.forms.forEach(x => { x.conditionIds = (x.conditionIds || []).filter(v => v !== id); x.returnConditionIds = (x.returnConditionIds || []).filter(v => v !== id); }); rerender(); }));
  host.querySelectorAll('[data-delete-effect]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.deleteEffect; universe.effects = universe.effects.filter(x => x.id !== id); universe.skills.forEach(x => x.effectIds = (x.effectIds || []).filter(v => v !== id)); universe.forms.forEach(x => x.effectIds = (x.effectIds || []).filter(v => v !== id)); rerender(); }));
  host.querySelectorAll('[data-delete-skill]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.deleteSkill; universe.skills = universe.skills.filter(x => x.id !== id); universe.forms.forEach(x => x.addedSkillIds = (x.addedSkillIds || []).filter(v => v !== id)); rerender(); }));
  host.querySelectorAll('[data-delete-form]').forEach(b => b.addEventListener('click', () => { universe.forms = universe.forms.filter(x => x.id !== b.dataset.deleteForm); rerender(); }));
}
