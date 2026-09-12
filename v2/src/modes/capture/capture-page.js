import {
  advanceCaptureBattleSession,
  appendCaptureUiNotices,
  attachCaptureUiVisualActivitySource,
  attachCaptureUiVisualClockSource,
  beginCaptureBattleSession,
  buildCaptureCreatureInspection,
  buildCaptureOpponentInspection,
  buildCaptureOpponentSummary,
  buildCaptureRosterLists,
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

export function mountCapturePage(host,{initialState=null,noticeMaxVisible=6,noticeExpireAfterVisualTime=null,visualClockSource=null,visualActivitySource=null,speciesById={},assetRegistry={}}={}){
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
      <section class="capture-roster-section" aria-labelledby="capture-active-team-title">
        <h3 id="capture-active-team-title">Équipe active</h3>
        <div class="capture-roster-list" data-capture-active-list></div>
      </section>
      <section class="capture-roster-section" aria-labelledby="capture-reserve-title">
        <h3 id="capture-reserve-title">Réserve</h3>
        <div class="capture-roster-list" data-capture-reserve-list></div>
      </section>
      <section class="capture-opponent-section" data-capture-opponent-section hidden aria-labelledby="capture-opponent-title">
        <h3 id="capture-opponent-title">Adversaire sauvage</h3>
        <div data-capture-opponent-summary></div>
      </section>
      <div class="capture-combat-feed" data-capture-combat-feed aria-live="polite" aria-atomic="false"></div>
      <aside class="capture-overlay" data-capture-overlay hidden aria-live="polite" aria-modal="false">
        <div class="capture-overlay-card">
          <p class="eyebrow" data-capture-overlay-kind></p>
          <h3 data-capture-overlay-title></h3>
          <p data-capture-overlay-message></p>
          <dl class="capture-overlay-fields" data-capture-overlay-fields></dl>
          <button type="button" data-capture-overlay-close>Fermer</button>
        </div>
      </aside>
    </section>`;

  const activeList=host.querySelector?.('[data-capture-active-list]')||null;
  const reserveList=host.querySelector?.('[data-capture-reserve-list]')||null;
  const opponentSection=host.querySelector?.('[data-capture-opponent-section]')||null;
  const opponentSummaryNode=host.querySelector?.('[data-capture-opponent-summary]')||null;
  const feed=host.querySelector?.('[data-capture-combat-feed]')||null;
  const overlayNode=host.querySelector?.('[data-capture-overlay]')||null;
  const overlayKind=host.querySelector?.('[data-capture-overlay-kind]')||null;
  const overlayTitle=host.querySelector?.('[data-capture-overlay-title]')||null;
  const overlayMessage=host.querySelector?.('[data-capture-overlay-message]')||null;
  const overlayFields=host.querySelector?.('[data-capture-overlay-fields]')||null;
  const overlayClose=host.querySelector?.('[data-capture-overlay-close]')||null;

  function rosterStatusHtml(status){
    const stacks=status.stacks!==null&&status.stacks>1?` ×${escapeHtml(status.stacks)}`:'';
    const remaining=status.remainingDuration!==null?` · reste ${escapeHtml(status.remainingDuration)}`:'';
    return `<span class="capture-roster-status" data-capture-status="${escapeHtml(status.id||status.name)}">${escapeHtml(status.name||status.id)}${stacks}${remaining}</span>`;
  }

  function rosterAbilityHtml(ability){
    const charges=ability.charges!==null&&ability.chargeMax!==null
      ?` · charges ${escapeHtml(ability.charges)}/${escapeHtml(ability.chargeMax)}`
      :ability.charges!==null
        ?` · charges ${escapeHtml(ability.charges)}`
        :'';
    const cooldown=ability.cooldownRemaining!==null?` · recharge ${escapeHtml(ability.cooldownRemaining)}`:'';
    return `<span class="capture-roster-ability" data-capture-ability="${escapeHtml(ability.id)}">${escapeHtml(ability.id)}${charges}${cooldown}</span>`;
  }

  function rosterReactionHtml(reaction){
    const cooldown=reaction.cooldownRemaining===null
      ?''
      :reaction.readyByCooldown
        ?' · prête côté cooldown'
        :` · recharge ${escapeHtml(reaction.cooldownRemaining)}`;
    const resource=reaction.resource!==null?` · ressource ${escapeHtml(reaction.resource)}`:'';
    return `<span class="capture-roster-reaction" data-capture-reaction="${escapeHtml(reaction.id)}" data-capture-reaction-ready="${reaction.readyByCooldown===true?'true':reaction.readyByCooldown===false?'false':'unknown'}">${escapeHtml(reaction.id)}${cooldown}${resource}</span>`;
  }

  function rosterEntryHtml(entry){
    const activeClass=entry.activeInBattle?' is-active-in-battle':'';
    const koClass=entry.ko?' is-ko':'';
    const activeAttr=entry.activeInBattle?'true':'false';
    const koAttr=entry.ko?'true':'false';
    const activeBadge=entry.activeInBattle?'<span class="capture-roster-active-badge" data-capture-active-battle-badge>Actif en combat</span>':'';
    const koBadge=entry.ko?'<span class="capture-roster-ko-badge" data-capture-ko-badge>KO</span>':'';
    const vitals=entry.hpLabel!==null?`<p class="capture-roster-vitals" data-capture-hp>PV : ${escapeHtml(entry.hpLabel)}</p>`:'';
    const statuses=entry.statuses.length?`<div class="capture-roster-statuses" data-capture-statuses>${entry.statuses.map(rosterStatusHtml).join('')}</div>`:'';
    const abilities=entry.abilities.length?`<div class="capture-roster-abilities" data-capture-abilities>${entry.abilities.map(rosterAbilityHtml).join('')}</div>`:'';
    const reactions=entry.reactions.length?`<div class="capture-roster-reactions" data-capture-reactions>${entry.reactions.map(rosterReactionHtml).join('')}</div>`:'';
    const visual=entry.iconArt||entry.mainArt;
    const art=visual?.src?`<img class="capture-roster-art" data-capture-roster-art src="${escapeHtml(visual.src)}" alt="${escapeHtml(entry.displayName)}">`:'';
    return `<article class="capture-roster-entry${activeClass}${koClass}" data-capture-roster-location="${escapeHtml(entry.location)}" data-capture-active-in-battle="${activeAttr}" data-capture-ko="${koAttr}">
      ${art}
      <div>
        <strong>${escapeHtml(entry.title)}</strong>
        <p>${escapeHtml(entry.subtitle)}</p>
        ${vitals}
        ${statuses}
        ${abilities}
        ${reactions}
        ${activeBadge}
        ${koBadge}
      </div>
      <button type="button" data-capture-inspect-instance="${escapeHtml(entry.instanceId)}">Inspecter</button>
    </article>`;
  }

  function renderRosterLists(){
    const lists=buildCaptureRosterLists(session.state,{assetRegistry});
    if(activeList){
      activeList.innerHTML=lists.activeTeam.length
        ?lists.activeTeam.map(rosterEntryHtml).join('')
        :'<p data-capture-roster-empty="active">Aucune créature active.</p>';
    }
    if(reserveList){
      reserveList.innerHTML=lists.reserve.length
        ?lists.reserve.map(rosterEntryHtml).join('')
        :'<p data-capture-roster-empty="reserve">Réserve vide.</p>';
    }
    return lists;
  }

  function opponentStatusHtml(status){
    const stacks=status.stacks!==null&&status.stacks>1?` ×${escapeHtml(status.stacks)}`:'';
    const remaining=status.remainingDuration!==null?` · reste ${escapeHtml(status.remainingDuration)}`:'';
    return `<span class="capture-opponent-status" data-capture-opponent-status="${escapeHtml(status.id||status.name)}">${escapeHtml(status.name||status.id)}${stacks}${remaining}</span>`;
  }

  function renderOpponentSummary(){
    const summary=buildCaptureOpponentSummary(session.state,{assetRegistry});
    if(opponentSection) opponentSection.hidden=!summary;
    if(!opponentSummaryNode) return summary;
    if(!summary){
      opponentSummaryNode.innerHTML='';
      return null;
    }
    const koBadge=summary.ko?'<span class="capture-opponent-ko" data-capture-opponent-ko>KO</span>':'';
    const wildBadge=summary.wild?'<span class="capture-opponent-wild" data-capture-opponent-wild>Sauvage</span>':'';
    const hp=summary.hpLabel!==null?`<p data-capture-opponent-hp>PV : ${escapeHtml(summary.hpLabel)}</p>`:'';
    const position=summary.position&&summary.position.x!=null&&summary.position.y!=null
      ?`<p data-capture-opponent-position>Position : ${escapeHtml(summary.position.x)}, ${escapeHtml(summary.position.y)}</p>`
      :'';
    const statuses=summary.statuses.length
      ?`<div data-capture-opponent-statuses>${summary.statuses.map(opponentStatusHtml).join('')}</div>`
      :'';
    const visual=summary.iconArt||summary.mainArt;
    const art=visual?.src?`<img class="capture-opponent-art" data-capture-opponent-art src="${escapeHtml(visual.src)}" alt="${escapeHtml(summary.displayName)}">`:'';
    opponentSummaryNode.innerHTML=`<article class="capture-opponent-summary${summary.ko?' is-ko':''}" data-capture-opponent-instance="${escapeHtml(summary.instanceId)}">
      ${art}
      <div>
        <strong>${escapeHtml(summary.title)}</strong>
        ${wildBadge}${koBadge}${hp}${position}${statuses}
      </div>
      <button type="button" data-capture-inspect-opponent>Inspecter</button>
    </article>`;
    return summary;
  }

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
    if(overlayFields){
      const fields=Array.isArray(overlay.metadata?.fields)?overlay.metadata.fields:[];
      overlayFields.innerHTML=fields.map(field=>`<div class="capture-overlay-field"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`).join('');
    }
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

  function findOwnedCreature(instanceId){
    const id=String(instanceId??'');
    if(!id) return null;
    const candidates=[...(session.state?.roster||[]),...(session.state?.activeTeam||[]),...(session.state?.reserve||[])];
    return candidates.find(entry=>String(entry?.instanceId||'')===id)||null;
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
    get rosterLists(){return buildCaptureRosterLists(session.state,{assetRegistry});},
    get opponentSummary(){return buildCaptureOpponentSummary(session.state,{assetRegistry});},
    get visualClockSourceAttached(){return visualClockSourceAttachment.attached===true;},
    get visualActivitySourceAttached(){return visualActivitySourceAttachment.attached===true;},
    beginBattle(options={}){
      const result=beginCaptureBattleSession(session,options);
      if(result.ok){
        session=result.session;
        renderRosterLists();
        renderOpponentSummary();
      }
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
    inspectCreature(instanceId,{speciesDef=null}={}){
      const creature=findOwnedCreature(instanceId);
      if(!creature) return {ok:false,reason:'capture-creature-not-owned'};
      const species=speciesDef||speciesById?.[String(creature.speciesId)]||null;
      const inspection=buildCaptureCreatureInspection(creature,{speciesDef:species});
      if(!inspection.ok) return inspection;
      const opened=api.openOverlay({
        kind:inspection.kind,
        title:inspection.title,
        message:inspection.message,
        metadata:inspection.metadata,
      });
      return {...inspection,overlay:opened.state,blocking:opened.blocking,gameplayDriverStatus:opened.gameplayDriverStatus};
    },
    inspectOpponent({speciesDef=null}={}){
      const summary=buildCaptureOpponentSummary(session.state,{assetRegistry});
      const species=speciesDef||speciesById?.[String(summary?.speciesId||'')]||null;
      const inspection=buildCaptureOpponentInspection(session.state,{speciesDef:species,assetRegistry});
      if(!inspection.ok) return inspection;
      const opened=api.openOverlay({
        kind:inspection.kind,
        title:inspection.title,
        message:inspection.message,
        metadata:inspection.metadata,
      });
      return {...inspection,overlay:opened.state,blocking:opened.blocking,gameplayDriverStatus:opened.gameplayDriverStatus};
    },
    refreshRosterLists(){return renderRosterLists();},
    refreshOpponentSummary(){return renderOpponentSummary();},
    advance(delta,options={}){
      const result=advanceCaptureBattleSession(session,{...options,delta});
      if(result.ok){
        session=result.session;
        result.notices=flushUiEvents();
        renderRosterLists();
        renderOpponentSummary();
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
      if(result.ok){
        session=result.session;
        renderRosterLists();
        renderOpponentSummary();
      }
      return result;
    },
    dispose(){
      if(activeList&&typeof activeList.removeEventListener==='function') activeList.removeEventListener('click',handleRosterInspectClick);
      if(reserveList&&typeof reserveList.removeEventListener==='function') reserveList.removeEventListener('click',handleRosterInspectClick);
      if(opponentSummaryNode&&typeof opponentSummaryNode.removeEventListener==='function') opponentSummaryNode.removeEventListener('click',handleOpponentInspectClick);
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

  function handleRosterInspectClick(event){
    const target=event?.target?.closest?.('[data-capture-inspect-instance]')||event?.target||null;
    const instanceId=target?.getAttribute?.('data-capture-inspect-instance')||target?.dataset?.captureInspectInstance||null;
    if(instanceId) api.inspectCreature(instanceId);
  }

  function handleOpponentInspectClick(event){
    const target=event?.target?.closest?.('[data-capture-inspect-opponent]')||event?.target||null;
    const inspect=target?.hasAttribute?.('data-capture-inspect-opponent')||target?.dataset?.captureInspectOpponent!=null;
    if(inspect) api.inspectOpponent();
  }

  if(activeList&&typeof activeList.addEventListener==='function') activeList.addEventListener('click',handleRosterInspectClick);
  if(reserveList&&typeof reserveList.addEventListener==='function') reserveList.addEventListener('click',handleRosterInspectClick);
  if(opponentSummaryNode&&typeof opponentSummaryNode.addEventListener==='function') opponentSummaryNode.addEventListener('click',handleOpponentInspectClick);
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

  renderRosterLists();
  renderOpponentSummary();
  renderOverlay();
  return api;
}
