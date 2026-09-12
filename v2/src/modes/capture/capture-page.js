import {
  advanceCaptureBattleSession,
  appendCaptureUiNotices,
  attachCaptureUiVisualActivitySource,
  attachCaptureUiVisualClockSource,
  beginCaptureBattleSession,
  captureUiNoticeFeedNotices,
  clearCaptureUiVisualPauseReasons,
  consumeCaptureUiEvents,
  createCaptureAppSession,
  createCaptureModeState,
  createCaptureUiNoticeFeed,
  createCaptureUiVisualClockAdapterState,
  createCaptureUiVisualDriverState,
  createCaptureUiVisualPauseControllerState,
  dispatchCaptureUiEvents,
  finishCaptureBattleSession,
  pauseCaptureUiVisualClockAdapter,
  pauseCaptureUiVisualDriver,
  resumeCaptureUiVisualClockAdapter,
  resumeCaptureUiVisualDriver,
  sampleCaptureUiVisualClock,
  setCaptureBattleBlocking,
  setCaptureUiVisualPauseReason,
  startCaptureUiVisualClockAdapter,
  startCaptureUiVisualDriver,
  stopCaptureDriver,
  stopCaptureUiVisualClockAdapter,
  stopCaptureUiVisualDriver,
} from './runtime.js';

function escapeHtml(value){
  return String(value??'')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

export function mountCapturePage(host,{initialState=null,noticeMaxVisible=6,noticeExpireAfterVisualTime=null,visualClockSource=null,visualActivitySource=null}={}){
  let session=createCaptureAppSession({state:initialState||createCaptureModeState()});
  let noticeFeed=createCaptureUiNoticeFeed({maxVisible:noticeMaxVisible,expireAfterVisualTime:noticeExpireAfterVisualTime});
  let visualDriver=createCaptureUiVisualDriverState();
  let visualClockAdapter=createCaptureUiVisualClockAdapterState();
  let visualPauseController=createCaptureUiVisualPauseControllerState();
  let visualClockSourceAttachment={ok:true,attached:false,detach:()=>{}};
  let visualActivitySourceAttachment={ok:true,attached:false,detach:()=>{}};
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
  function renderFeed(){
    if(!feed) return;
    const notices=captureUiNoticeFeedNotices(noticeFeed);
    feed.innerHTML=notices.map(notice=>`<p class="capture-combat-notice" data-capture-event="${escapeHtml(notice.type)}">${escapeHtml(notice.message)}</p>`).join('');
  }

  function flushUiEvents(){
    const consumed=consumeCaptureUiEvents(session);
    session=consumed.session;
    const dispatched=dispatchCaptureUiEvents(consumed.events);
    noticeFeed=appendCaptureUiNotices(noticeFeed,dispatched);
    renderFeed();
    return dispatched;
  }

  function sampleNoticeVisualClock(sample){
    const result=sampleCaptureUiVisualClock(noticeFeed,visualDriver,visualClockAdapter,{sample});
    if(result.ok){
      noticeFeed=result.feed;
      visualDriver=result.visualDriver;
      visualClockAdapter=result.adapter;
      renderFeed();
    }
    return {...result,notices:captureUiNoticeFeedNotices(noticeFeed)};
  }

  function applyVisualPauseReason(reason,paused){
    const result=setCaptureUiVisualPauseReason(visualPauseController,reason,paused);
    if(!result.ok) return result;
    visualPauseController=result.controller;
    if(result.transition==='pause'){
      visualDriver=pauseCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=pauseCaptureUiVisualClockAdapter(visualClockAdapter);
    }else if(result.transition==='resume'){
      visualDriver=resumeCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=resumeCaptureUiVisualClockAdapter(visualClockAdapter);
    }
    return {
      ...result,
      driver:structuredClone(visualDriver),
      adapter:structuredClone(visualClockAdapter),
    };
  }

  const api={
    get state(){return session.state;},
    get session(){return session;},
    get notices(){return captureUiNoticeFeedNotices(noticeFeed);},
    get noticeFeed(){return structuredClone(noticeFeed);},
    get visualDriver(){return structuredClone(visualDriver);},
    get visualClockAdapter(){return structuredClone(visualClockAdapter);},
    get visualPauseController(){return structuredClone(visualPauseController);},
    get visualClockSourceAttached(){return visualClockSourceAttachment.attached===true;},
    get visualActivitySourceAttached(){return visualActivitySourceAttachment.attached===true;},
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
    startNoticeVisualClock(){
      visualPauseController=clearCaptureUiVisualPauseReasons(visualPauseController).controller;
      visualDriver=startCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=startCaptureUiVisualClockAdapter(visualClockAdapter);
      return {driver:structuredClone(visualDriver),adapter:structuredClone(visualClockAdapter),pauseController:structuredClone(visualPauseController)};
    },
    pauseNoticeVisualClock(){
      return applyVisualPauseReason('manual',true);
    },
    resumeNoticeVisualClock(){
      return applyVisualPauseReason('manual',false);
    },
    setNoticeVisualPauseReason(reason,paused=true){
      return applyVisualPauseReason(reason,paused);
    },
    stopNoticeVisualClock(){
      visualPauseController=createCaptureUiVisualPauseControllerState();
      visualDriver=stopCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=stopCaptureUiVisualClockAdapter(visualClockAdapter);
      return {driver:structuredClone(visualDriver),adapter:structuredClone(visualClockAdapter),pauseController:structuredClone(visualPauseController)};
    },
    sampleNoticeVisualClock,
    flushUiEvents,
    finishBattle(reason){
      const result=finishCaptureBattleSession(session,reason);
      if(result.ok) session=result.session;
      return result;
    },
    dispose(){
      visualActivitySourceAttachment.detach();
      visualClockSourceAttachment.detach();
      visualActivitySourceAttachment={ok:true,attached:false,detach:()=>{}};
      visualClockSourceAttachment={ok:true,attached:false,detach:()=>{}};
      session={...session,driver:stopCaptureDriver(session.driver),blocking:false,uiEvents:[]};
      visualPauseController=createCaptureUiVisualPauseControllerState();
      visualDriver=stopCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=stopCaptureUiVisualClockAdapter(visualClockAdapter);
      noticeFeed=createCaptureUiNoticeFeed({maxVisible:noticeMaxVisible,expireAfterVisualTime:noticeExpireAfterVisualTime});
      host.innerHTML='';
    },
  };

  if(visualClockSource){
    api.startNoticeVisualClock();
    visualClockSourceAttachment=attachCaptureUiVisualClockSource(visualClockSource,sample=>api.sampleNoticeVisualClock(sample));
  }
  if(visualActivitySource){
    visualActivitySourceAttachment=attachCaptureUiVisualActivitySource(visualActivitySource,{
      onInactive:()=>api.setNoticeVisualPauseReason('activity',true),
      onActive:()=>api.setNoticeVisualPauseReason('activity',false),
    });
  }

  return api;
}
