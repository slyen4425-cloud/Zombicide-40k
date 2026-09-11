export function ensureSpatialRules(universe = {}) {
  universe.spatialRules = {
    enabled: universe.spatialRules?.enabled !== false,
    unit: universe.spatialRules?.unit || 'cases',
    diagonal: Boolean(universe.spatialRules?.diagonal),
    movementStatId: universe.spatialRules?.movementStatId || null,
    defaultMovement: Math.max(0, Number(universe.spatialRules?.defaultMovement ?? 3) || 0),
    combatAssistRange: Math.max(0, Number(universe.spatialRules?.combatAssistRange ?? 3) || 0),
    requireSameZone: universe.spatialRules?.requireSameZone !== false,
  };
  universe.perceptionRules = {
    enabled: universe.perceptionRules?.enabled !== false,
    visionStatId: universe.perceptionRules?.visionStatId || null,
    stealthStatId: universe.perceptionRules?.stealthStatId || null,
    defaultVisionRange: Math.max(0, Number(universe.perceptionRules?.defaultVisionRange ?? 6) || 0),
    defaultStealth: Number(universe.perceptionRules?.defaultStealth ?? 0) || 0,
    distancePenaltyPerUnit: Math.max(0, Number(universe.perceptionRules?.distancePenaltyPerUnit ?? 1) || 0),
    requireSameZone: universe.perceptionRules?.requireSameZone !== false,
  };
  return universe;
}

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function options(stats, selected, none){return [`<option value="">${none}</option>`,...(stats||[]).map(s=>`<option value="${esc(s.id)}" ${String(s.id)===String(selected||'')?'selected':''}>${esc(s.icon||'')} ${esc(s.name||'Sans nom')}</option>`)].join('');}

export function renderSpatialRulesSection(universe = {}) {
  ensureSpatialRules(universe);
  const s=universe.spatialRules, p=universe.perceptionRules;
  return `<section class="editor-section" data-spatial-rules>
    <div class="section-title-row"><div><h3>Déplacements, portée & détection</h3><p class="muted">Toutes les valeurs sont configurables. Aucune statistique Mouvement, Vision ou Furtivité n'est imposée au moteur.</p></div><button class="help-button tiny" data-help="rpg-spatial" type="button">?</button></div>
    <div class="form-grid">
      <label>Unité<select data-spatial-field="unit"><option value="cases" ${s.unit==='cases'?'selected':''}>Cases</option><option value="cm" ${s.unit==='cm'?'selected':''}>Centimètres</option><option value="inches" ${s.unit==='inches'?'selected':''}>Pouces</option><option value="off" ${s.unit==='off'?'selected':''}>Sans mesure</option></select></label>
      <label>Statistique de mouvement<select data-spatial-field="movementStatId">${options(universe.stats,s.movementStatId,'— Valeur fixe —')}</select></label>
      <label>Mouvement par défaut<input data-spatial-field="defaultMovement" type="number" min="0" value="${s.defaultMovement}"></label>
      <label>Portée d'entraide combat<input data-spatial-field="combatAssistRange" type="number" min="0" value="${s.combatAssistRange}"></label>
      <label>Statistique de vision<select data-perception-field="visionStatId">${options(universe.stats,p.visionStatId,'— Valeur fixe —')}</select></label>
      <label>Portée de vision par défaut<input data-perception-field="defaultVisionRange" type="number" min="0" value="${p.defaultVisionRange}"></label>
      <label>Statistique de furtivité<select data-perception-field="stealthStatId">${options(universe.stats,p.stealthStatId,'— Valeur fixe —')}</select></label>
      <label>Furtivité par défaut<input data-perception-field="defaultStealth" type="number" value="${p.defaultStealth}"></label>
      <label>Pénalité de détection par unité<input data-perception-field="distancePenaltyPerUnit" type="number" min="0" step="0.1" value="${p.distancePenaltyPerUnit}"></label>
    </div>
    <div class="toggle-row">
      <label><input data-spatial-field="enabled" type="checkbox" ${s.enabled?'checked':''}> Déplacements tactiques actifs</label>
      <label><input data-spatial-field="diagonal" type="checkbox" ${s.diagonal?'checked':''}> Diagonales autorisées</label>
      <label><input data-spatial-field="requireSameZone" type="checkbox" ${s.requireSameZone?'checked':''}> Entraide limitée à la même zone</label>
      <label><input data-perception-field="enabled" type="checkbox" ${p.enabled?'checked':''}> Détection active</label>
      <label><input data-perception-field="requireSameZone" type="checkbox" ${p.requireSameZone?'checked':''}> Détection limitée à la même zone</label>
    </div>
  </section>`;
}

function readInput(input){if(input.type==='checkbox')return input.checked;if(input.type==='number')return Number(input.value)||0;return input.value||null;}
export function bindSpatialRulesSection(host, universe, onChange) {
  ensureSpatialRules(universe);
  host.querySelectorAll('[data-spatial-field]').forEach(input=>input.addEventListener('change',()=>{universe.spatialRules[input.dataset.spatialField]=readInput(input);onChange?.(universe);}));
  host.querySelectorAll('[data-perception-field]').forEach(input=>input.addEventListener('change',()=>{universe.perceptionRules[input.dataset.perceptionField]=readInput(input);onChange?.(universe);}));
}
