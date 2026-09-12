import {
  advanceCaptureBattleSession,
  beginCaptureBattleSession,
  createCaptureAppSession,
  createCaptureModeState,
  finishCaptureBattleSession,
  setCaptureBattleBlocking,
  stopCaptureDriver,
} from './runtime.js';

export function mountCapturePage(host,{initialState=null}={}){
  let session=createCaptureAppSession({state:initialState||createCaptureModeState()});
  const state=session.state;
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
        <p><strong>Combat :</strong> moteur dynamique dédié, cycle de vie driver piloté par l’application.</p>
      </div>
    </section>`;

  return {
    get state(){return session.state;},
    get session(){return session;},
    beginBattle(options={}){
      const result=beginCaptureBattleSession(session,options);
      if(result.ok) session=result.session;
      return result;
    },
    setBlocking(blocking){
      const result=setCaptureBattleBlocking(session,blocking);
      if(result.ok) session=result.session;
      return result;
    },
    advance(delta,options={}){
      const result=advanceCaptureBattleSession(session,{...options,delta});
      if(result.ok) session=result.session;
      return result;
    },
    finishBattle(reason){
      const result=finishCaptureBattleSession(session,reason);
      if(result.ok) session=result.session;
      return result;
    },
    dispose(){
      session={...session,driver:stopCaptureDriver(session.driver),blocking:false};
      host.innerHTML='';
    },
  };
}
