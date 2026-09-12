import {
  advanceCaptureBattleSession,
  beginCaptureBattleSession,
  consumeCaptureUiEvents,
  createCaptureAppSession,
  createCaptureModeState,
  dispatchCaptureUiEvents,
  finishCaptureBattleSession,
  setCaptureBattleBlocking,
  stopCaptureDriver,
} from './runtime.js';

function escapeHtml(value){
  return String(value??'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

export function mountCapturePage(host,{initialState=null}={}){
  let session=createCaptureAppSession({state:initialState||createCaptureModeState()});
  const notices=[];
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
      <div class="capture-combat-feed" data-capture-combat-feed aria-live="polite" aria-atomic="false"></div>
    </section>`;

  const feed=host.querySelector?.('[data-capture-combat-feed]')||null;
  function renderNotice(notice){
    notices.push(notice);
    if(!feed) return;
    const row=feed.ownerDocument?.createElement?.('p')||null;
    if(row){
      row.className='capture-combat-notice';
      row.dataset.captureEvent=notice.type;
      row.textContent=notice.message;
      feed.appendChild(row);
      return;
    }
    feed.innerHTML+=`<p class="capture-combat-notice" data-capture-event="${escapeHtml(notice.type)}">${escapeHtml(notice.message)}</p>`;
  }

  function flushUiEvents(){
    const consumed=consumeCaptureUiEvents(session);
    session=consumed.session;
    return dispatchCaptureUiEvents(consumed.events,renderNotice);
  }

  return {
    get state(){return session.state;},
    get session(){return session;},
    get notices(){return notices.slice();},
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
      if(result.ok){
        session=result.session;
        result.notices=flushUiEvents();
      }
      return result;
    },
    flushUiEvents,
    finishBattle(reason){
      const result=finishCaptureBattleSession(session,reason);
      if(result.ok) session=result.session;
      return result;
    },
    dispose(){
      session={...session,driver:stopCaptureDriver(session.driver),blocking:false,uiEvents:[]};
      host.innerHTML='';
    },
  };
}
