import {
  advanceCaptureBattleSession,
  appendCaptureUiNotices,
  attachCaptureUiVisualActivitySource,
  attachCaptureUiVisualClockSource,
  beginCaptureBattleSession,
  captureUiNoticeFeedNotices,
  clearCaptureUiVisualPauseReasons,
  closeCaptureUiOverlay,
  consumeCaptureUiEvents,
  createCaptureAppSession,
  createCaptureModeState,
  createCaptureUiNoticeFeed,
  createCaptureUiOverlayState,
  createCaptureUiPresentationBlockState,
  createCaptureUiVisualClockAdapterState,
  createCaptureUiVisualDriverState,
  createCaptureUiVisualPauseControllerState,
  dispatchCaptureUiEvents,
  finishCaptureBattleSession,
  openCaptureUiOverlay,
  pauseCaptureUiVisualClockAdapter,
  pauseCaptureUiVisualDriver,
  resumeCaptureUiVisualClockAdapter,
  resumeCaptureUiVisualDriver,
  sampleCaptureUiVisualClock,
  setCaptureBattleBlocking,
  setCaptureUiPresentationBlocked,
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
  let presentationBlock=createCaptureUiPresentationBlockState();
  let overlay=createCaptureUiOverlayState();
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
      <aside class="capture-overlay" data-capture-overlay hidden aria-live="polite" aria-modal="false">
        <div class="capture-overlay-card">
          <p class="eyebrow" data-capture-overlay-kind></p>
          <h3 data-capture-overlay-title></h3>
          <p data-capture-overlay-message></p>
          <button type="button" data-capture-overlay-close>Fermer</button>
        </div>
      </aside>
    </section>`;

  const feed=host.querySelector?.('[data-capture-combat-feed]')||null;
  const overlayNode=host.querySelector?.('[data-capture-overlay]')||null;
  const overlayKind=host.querySelector?.('[data-capture-overlay-kind]')||null;
  const overlayTitle=host.querySelector?.('[data-capture-overlay-title]')||null;
  const overlayMessage=host.querySelector?.('[data-capture-overlay-message]')||null;
  const overlayClose=host.querySelector?.('[data-capture-overlay-close]')||null;

  function renderFeed(){
    if(!feed) return;
    const notices=captureUiNoticeFeedNotices(noticeFeed);
    feed.innerHTML=notices.map(notice=>`<p class="capture-combat-notice" data-capture-event="${escapeHtml(notice.type)}">${escapeHtml(notice.message)}</p>`).join('');
  }

  function renderOverlay(){
    if(!overlayNode) return;
    overlayNode.hidden=!overlay.open;
    if(overlayKind) overlayKind.textContent=overlay.kind;
    if(overlayTitle) overlayTitle.textContent=overlay.title;
    if(overlayMessage) overlayMessage.textContent=overlay.message;
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
    get presentationBlock(){return structuredClone(presentationBlock);},
    get overlay(){return structuredClone(overlay);},
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
    setPresentationBlocking(blocking,options={}){
      const result=setCaptureUiPresentationBlocked(presentationBlock,blocking,options);
      if(!result.ok) return result;
      presentationBlock=result.state;
      const visual=applyVisualPauseReason(result.pauseReason,result.paused);
      return {
        ...result,
        visual,
        gameplayDriverStatus:session.driver?.status??null,
      };
    },
    openOverlay(options={}){
      const result=openCaptureUiOverlay(overlay,options);
      overlay=result.state;
      const blocking=api.setPresentationBlocking(result.presentationBlocked,{kind:overlay.kind,metadata:overlay.metadata});
      renderOverlay();
      return {...result,blocking,gameplayDriverStatus:session.driver?.status??null};
    },
    closeOverlay(){
      const result=closeCaptureUiOverlay(overlay);
      overlay=result.state;
      const blocking=api.setPresentationBlocking(result.presentationBlocked,{kind:overlay.kind,metadata:overlay.metadata});
      renderOverlay();
      return {...result,blocking,gameplayDriverStatus:session.driver?.status??null};
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
      if(presentationBlock.blocked) applyVisualPauseReason('presentation-block',true);
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
      overlay=createCaptureUiOverlayState();
      presentationBlock=createCaptureUiPresentationBlockState();
      visualPauseController=createCaptureUiVisualPauseControllerState();
      visualDriver=stopCaptureUiVisualDriver(visualDriver);
      visualClockAdapter=stopCaptureUiVisualClockAdapter(visualClockAdapter);
      noticeFeed=createCaptureUiNoticeFeed({maxVisible:noticeMaxVisible,expireAfterVisualTime:noticeExpireAfterVisualTime});
      host.innerHTML='';
    },
  };

  if(overlayClose&&typeof overlayClose.addEventListener==='function'){
    overlayClose.addEventListener('click',()=>api.closeOverlay());
  }
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

  renderOverlay();
  return api;
}
