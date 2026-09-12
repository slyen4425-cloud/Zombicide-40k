import { createCaptureModeState } from './capture.js';

export function mountCapturePage(host,{initialState=null}={}){
  const state=initialState||createCaptureModeState();
  host.innerHTML=`
    <section class="panel capture-page" data-capture-mounted="true">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Mode autonome</p>
          <h2>Capture de créatures</h2>
        </div>
      </div>
      <p>Le runtime Capture est chargé uniquement à l’ouverture de ce mode.</p>
      <div class="status-list">
        <p><strong>Exploration :</strong> libre, sur le socle spatial partagé.</p>
        <p><strong>Équipe active :</strong> ${state.activeTeam.length}/6</p>
        <p><strong>Réserve :</strong> ${state.reserve.length}</p>
        <p><strong>Combat :</strong> moteur dynamique dédié à construire, sans timeline RPG.</p>
      </div>
    </section>`;
  return {
    state,
    dispose(){ host.innerHTML=''; },
  };
}
