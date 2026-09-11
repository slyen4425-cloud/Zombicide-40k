(()=>{
  'use strict';

  // V16.78.127 — Chrome Android touch/click recovery.
  // Purpose: recover home navigation when Android Chrome paints the pressed state
  // but drops/delays the real click or fails to repaint the new view.
  if (window.__GENSRPG_CHROME_ANDROID_UI_RECOVERY__) return;
  window.__GENSRPG_CHROME_ANDROID_UI_RECOVERY__ = true;

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !/(EdgA|OPR|Firefox|FxiOS)\//i.test(ua);
  if (!isAndroid || !isChrome) return;

  const rootClass = 'gens-chrome-android-ui-recovery';
  document.documentElement.classList.add(rootClass);

  const style = document.createElement('style');
  style.id = 'gensChromeAndroidUiRecoveryStyle';
  style.textContent = `
    html.${rootClass} .gensRootModeCard,
    html.${rootClass} .gensRootModeCard *,
    html.${rootClass} .homeGear,
    html.${rootClass} [class*="gensRootMode"] {
      animation: none !important;
      transition: none !important;
      filter: none !important;
      -webkit-filter: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      will-change: auto !important;
      contain: none !important;
      content-visibility: visible !important;
      perspective: none !important;
    }

    html.${rootClass} .gensRootModeCard,
    html.${rootClass} .homeGear {
      transform: none !important;
      -webkit-transform: none !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255,255,255,.12) !important;
    }

    html.${rootClass}.gens-hard-nav-repaint *,
    html.${rootClass}.gens-hard-nav-repaint *::before,
    html.${rootClass}.gens-hard-nav-repaint *::after {
      animation: none !important;
      transition: none !important;
      filter: none !important;
      -webkit-filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      will-change: auto !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  const clickTimes = new WeakMap();
  let hardRepaintBusy = false;

  function navTargetFrom(eventTarget) {
    return eventTarget instanceof Element
      ? eventTarget.closest('.gensRootModeCard, .homeGear')
      : null;
  }

  function hardRepaint() {
    if (hardRepaintBusy) return;
    const body = document.body;
    if (!body) return;
    hardRepaintBusy = true;
    document.documentElement.classList.add('gens-hard-nav-repaint');

    const oldDisplay = body.style.display;
    const oldVisibility = body.style.visibility;

    setTimeout(() => {
      body.style.visibility = 'hidden';
      body.style.display = 'none';
      void document.documentElement.offsetHeight;

      setTimeout(() => {
        body.style.display = oldDisplay;
        body.style.visibility = oldVisibility;
        void body.offsetHeight;
        document.documentElement.classList.remove('gens-hard-nav-repaint');
        hardRepaintBusy = false;
      }, 16);
    }, 0);
  }

  function softRepaintBurst() {
    queueMicrotask(hardRepaint);
    setTimeout(hardRepaint, 40);
    setTimeout(hardRepaint, 140);
    setTimeout(hardRepaint, 320);
  }

  function armFallback(target) {
    if (!target) return;
    const armedAt = performance.now();
    setTimeout(() => {
      const lastClick = clickTimes.get(target) || 0;
      if (lastClick >= armedAt - 8) return;
      try {
        target.click();
      } catch (_) {
        try {
          target.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window
          }));
        } catch (_) {}
      }
      softRepaintBurst();
    }, 110);
  }

  document.addEventListener('click', event => {
    const target = navTargetFrom(event.target);
    if (!target) return;
    clickTimes.set(target, performance.now());
    softRepaintBurst();
  }, true);

  document.addEventListener('pointerup', event => {
    const target = navTargetFrom(event.target);
    if (!target) return;
    armFallback(target);
  }, true);

  document.addEventListener('touchend', event => {
    const target = navTargetFrom(event.target);
    if (!target) return;
    armFallback(target);
  }, {capture:true, passive:true});

  window.addEventListener('pageshow', () => setTimeout(hardRepaint, 0), { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(hardRepaint, 60), { passive: true });
})();
