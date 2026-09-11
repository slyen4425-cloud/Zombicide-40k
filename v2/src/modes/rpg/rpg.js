import { createStatDefinition, createResourceDefinition } from '../../core/contracts.js';
import { readJson, writeJson, cloneData } from '../../core/storage.js';
import { mountAdvancedRpgEditor, ensureAdvancedRpgCollections } from './advanced-editor.js';

const RPG_KEY = 'rpg_universe';
const RPG_ID = 'starter';

const DEFAULT_STATS = [
  createStatDefinition({ name: 'Force', icon: '💪', baseValue: 10 }),
  createStatDefinition({ name: 'Agilité', icon: '🏃', baseValue: 10 }),
  createStatDefinition({ name: 'Intelligence', icon: '🧠', baseValue: 10 }),
  createStatDefinition({ name: 'Esprit', icon: '✨', baseValue: 10 }),
  createStatDefinition({ name: 'Endurance', icon: '🛡️', baseValue: 10 }),
];

const DEFAULT_RESOURCES = [
  createResourceDefinition({ name: 'Points de vie', icon: '❤️', maxFormula: { kind: 'fixed', value: 10 } }),
];

export function createDefaultRpgUniverse() {
  return ensureAdvancedRpgCollections({
    schemaVersion: 1,
    id: RPG_ID,
    name: 'Mon univers RPG',
    stats: cloneData(DEFAULT_STATS),
    resources: cloneData(DEFAULT_RESOURCES),
    conditions: [],
    effects: [],
    skills: [],
    heroes: [],
    forms: [],
    updatedAt: new Date().toISOString(),
  });
}

export function loadRpgUniverse() {
  const universe = readJson(RPG_KEY, RPG_ID, null) || createDefaultRpgUniverse();
  return ensureAdvancedRpgCollections(universe);
}

export function saveRpgUniverse(universe) {
  ensureAdvancedRpgCollections(universe);
  universe.updatedAt = new Date().toISOString();
  return writeJson(RPG_KEY, RPG_ID, universe);
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function statOptions(stats, selected) {
  return ['<option value="">— Aucune —</option>', ...stats.map(stat =>
    `<option value="${esc(stat.id)}" ${stat.id === selected ? 'selected' : ''}>${esc(stat.icon)} ${esc(stat.name)}</option>`
  )].join('');
}

function resourceOptions(resources, selected) {
  return ['<option value="">— Aucun coût —</option>', ...resources.map(resource =>
    `<option value="${esc(resource.id)}" ${resource.id === selected ? 'selected' : ''}>${esc(resource.icon)} ${esc(resource.name)}</option>`
  )].join('');
}

function renderStatCard(stat, resources) {
  return `<article class="editor-card" data-stat-id="${esc(stat.id)}">
    <div class="editor-card-head">
      <strong>${esc(stat.icon)} ${esc(stat.name)}</strong>
      <button class="help-button tiny" type="button" data-help="rpg-stat" aria-label="Aide statistique">?</button>
    </div>
    <div class="form-grid">
      <label>Nom<input data-field="name" value="${esc(stat.name)}"></label>
      <label>Icône<input data-field="icon" value="${esc(stat.icon)}" maxlength="6"></label>
      <label>Valeur de base<input data-field="baseValue" type="number" value="${Number(stat.baseValue) || 0}"></label>
      <label>Minimum<input data-field="min" type="number" value="${Number(stat.min) || 0}"></label>
      <label>Maximum<input data-field="max" type="number" placeholder="Illimité" value="${stat.max ?? ''}"></label>
      <label>Coût d'amélioration
        <select data-field="upgrade.costResourceId">${resourceOptions(resources, stat.upgrade?.costResourceId || '')}</select>
      </label>
      <label>Coût par point<input data-field="upgrade.costPerPoint" type="number" min="0" step="1" value="${Number(stat.upgrade?.costPerPoint ?? 1)}"></label>
    </div>
    <div class="toggle-row">
      <label><input data-field="enabled" type="checkbox" ${stat.enabled !== false ? 'checked' : ''}> Active</label>
      <label><input data-field="visible" type="checkbox" ${stat.visible !== false ? 'checked' : ''}> Visible</label>
      <label><input data-field="upgrade.enabled" type="checkbox" ${stat.upgrade?.enabled !== false ? 'checked' : ''}> Améliorable</label>
    </div>
    <button class="danger-button" type="button" data-delete-stat="${esc(stat.id)}">Supprimer</button>
  </article>`;
}

function renderResourceCard(resource, stats) {
  const f = resource.maxFormula || { kind: 'fixed', value: 10 };
  return `<article class="editor-card" data-resource-id="${esc(resource.id)}">
    <div class="editor-card-head">
      <strong>${esc(resource.icon)} ${esc(resource.name)}</strong>
      <button class="help-button tiny" type="button" data-help="rpg-resource" aria-label="Aide ressource">?</button>
    </div>
    <div class="form-grid">
      <label>Nom<input data-field="name" value="${esc(resource.name)}"></label>
      <label>Icône<input data-field="icon" value="${esc(resource.icon)}" maxlength="6"></label>
      <label>Minimum<input data-field="min" type="number" value="${Number(resource.min) || 0}"></label>
      <label>Maximum
        <select data-field="maxFormula.kind">
          <option value="fixed" ${f.kind === 'fixed' ? 'selected' : ''}>Valeur fixe</option>
          <option value="stat" ${f.kind === 'stat' ? 'selected' : ''}>Lié à une statistique</option>
        </select>
      </label>
      <label>Valeur max<input data-field="maxFormula.value" type="number" value="${Number(f.value) || 0}"></label>
      <label>Statistique liée
        <select data-field="maxFormula.statId">${statOptions(stats, f.statId || '')}</select>
      </label>
    </div>
    <div class="toggle-row">
      <label><input data-field="enabled" type="checkbox" ${resource.enabled !== false ? 'checked' : ''}> Active</label>
      <label><input data-field="visible" type="checkbox" ${resource.visible !== false ? 'checked' : ''}> Visible</label>
    </div>
    <button class="danger-button" type="button" data-delete-resource="${esc(resource.id)}">Supprimer</button>
  </article>`;
}

function setNested(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  while (parts.length > 1) {
    const key = parts.shift();
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  }
  cursor[parts[0]] = value;
}

function fieldValue(input) {
  if (input.type === 'checkbox') return input.checked;
  if (input.type === 'number') return input.value === '' ? null : Number(input.value);
  return input.value;
}

function detachStat(universe, id) {
  universe.resources.forEach(resource => { if (resource.maxFormula?.statId === id) resource.maxFormula.statId = null; });
  universe.conditions.forEach(c => { if (c.sourceKind === 'stat' && c.sourceId === id) c.sourceId = null; });
  universe.effects.forEach(e => { if (e.statId === id) e.statId = null; });
  universe.skills.forEach(s => { if (s.roll?.statId === id) s.roll.statId = null; });
}

function detachResource(universe, id) {
  universe.stats.forEach(stat => { if (stat.upgrade?.costResourceId === id) stat.upgrade.costResourceId = null; });
  universe.conditions.forEach(c => { if (c.sourceKind === 'resource' && c.sourceId === id) c.sourceId = null; });
  universe.effects.forEach(e => { if (e.resourceId === id) e.resourceId = null; });
  universe.skills.forEach(s => { if (s.costResourceId === id) s.costResourceId = null; });
  universe.forms.forEach(f => { if (f.costResourceId === id) f.costResourceId = null; });
}

export function mountRpgEditor(host) {
  let universe = loadRpgUniverse();

  function saveAndRender() {
    saveRpgUniverse(universe);
    render();
  }

  function render() {
    ensureAdvancedRpgCollections(universe);
    host.innerHTML = `
      <section class="workspace-head">
        <div>
          <p class="eyebrow">RPG · ÉDITEUR GÉNÉRIQUE</p>
          <h2>${esc(universe.name)}</h2>
          <p class="muted">Statistiques, ressources, conditions, effets, compétences et transformations libres. Aucun nom de règle n'est imposé au moteur.</p>
        </div>
        <button class="help-button" type="button" data-help="rpg-editor" aria-label="Aide éditeur RPG">?</button>
      </section>

      <section class="editor-section">
        <div class="section-title-row">
          <div><h3>Statistiques</h3><p class="muted">Force, Furtivité, Chance, Vision… ou n'importe quelle statistique créée par l'utilisateur.</p></div>
          <button class="primary-button" type="button" id="addRpgStat">+ Statistique</button>
        </div>
        <div class="editor-list">${universe.stats.map(s => renderStatCard(s, universe.resources)).join('')}</div>
      </section>

      <section class="editor-section">
        <div class="section-title-row">
          <div><h3>Ressources</h3><p class="muted">PV, Mana, Ki, Rage, Énergie… le moteur ne leur donne aucun sens codé en dur.</p></div>
          <button class="primary-button" type="button" id="addRpgResource">+ Ressource</button>
        </div>
        <div class="editor-list">${universe.resources.map(r => renderResourceCard(r, universe.stats)).join('')}</div>
      </section>
      <div id="rpgAdvancedHost"></div>`;

    host.querySelector('#addRpgStat')?.addEventListener('click', () => {
      universe.stats.push(createStatDefinition());
      saveAndRender();
    });
    host.querySelector('#addRpgResource')?.addEventListener('click', () => {
      universe.resources.push(createResourceDefinition());
      saveAndRender();
    });

    host.querySelectorAll('[data-stat-id]').forEach(card => {
      const stat = universe.stats.find(x => x.id === card.dataset.statId);
      card.querySelectorAll('[data-field]').forEach(input => input.addEventListener('change', () => {
        setNested(stat, input.dataset.field, fieldValue(input));
        saveAndRender();
      }));
    });

    host.querySelectorAll('[data-resource-id]').forEach(card => {
      const resource = universe.resources.find(x => x.id === card.dataset.resourceId);
      card.querySelectorAll('[data-field]').forEach(input => input.addEventListener('change', () => {
        setNested(resource, input.dataset.field, fieldValue(input));
        saveAndRender();
      }));
    });

    host.querySelectorAll('[data-delete-stat]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.deleteStat;
      universe.stats = universe.stats.filter(x => x.id !== id);
      detachStat(universe, id);
      saveAndRender();
    }));

    host.querySelectorAll('[data-delete-resource]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.deleteResource;
      universe.resources = universe.resources.filter(x => x.id !== id);
      detachResource(universe, id);
      saveAndRender();
    }));

    const advancedHost = host.querySelector('#rpgAdvancedHost');
    if (advancedHost) mountAdvancedRpgEditor(advancedHost, universe, next => { universe = next; saveAndRender(); });
  }

  render();
}
