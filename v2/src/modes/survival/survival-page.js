import { loadSurvivalUniverse } from './survival.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function mountSurvivalPage(host){
  const universe=loadSurvivalUniverse();
  host.innerHTML=`
    <section class="workspace-head survival-head">
      <div>
        <p class="eyebrow">MODE SURVIE · MOTEUR SÉPARÉ</p>
        <h2>${esc(universe.name)}</h2>
        <p class="muted">Migration fidèle du mode Survie : vagues, scénarios, héros, ennemis et progression de menace. Aucune règle Dungeon/RPG n’est utilisée ici.</p>
      </div>
      <button class="help-button" type="button" data-help="survival">?</button>
    </section>
    <section class="survival-dashboard">
      <article class="survival-card"><strong>☠️ Menace</strong><span>${universe.rules.threatTiers.join(' → ')}</span></article>
      <article class="survival-card"><strong>🌊 Vagues</strong><span>${universe.rules.waveProgression?'Progression active':'Désactivée'}</span></article>
      <article class="survival-card"><strong>👹 Phase ennemie</strong><span>${universe.rules.sharedEnemyPhase?'Phase commune':'Configuration libre'}</span></article>
      <article class="survival-card"><strong>🗺️ Plateau</strong><span>${universe.rules.tacticalBoard?'Tactique':'Narratif'}</span></article>
    </section>
    <section class="panel">
      <h3>Migration Survie</h3>
      <p class="muted">Cette zone recevra uniquement les systèmes historiques du mode Survie. La fiche héros RPG, le World Builder Dungeon, les transformations RPG et les règles D100 restent dans <code>modes/rpg</code>.</p>
    </section>`;
}
