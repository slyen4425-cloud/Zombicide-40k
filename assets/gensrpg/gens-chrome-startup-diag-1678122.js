(()=>{
  'use strict';

  // V16.78.129 — bounded Chrome Android home navigation recovery.
  // Keep a touch fallback only when Chrome really drops the click.
  // Never hide the document or force synchronous layout/repaint loops.
  if (window.__GENSRPG_CHROME_ANDROID_UI_RECOVERY__) return;
  window.__GENSRPG_CHROME_ANDROID_UI_RECOVERY__ = true;

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !/(EdgA|OPR|Firefox|FxiOS)\//i.test(ua);
  if (!isAndroid || !isChrome) return;

  const rootClass = 'gens-chrome-android-ui-recovery';
  const root = document.documentElement;
  root.classList.add(rootClass);

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
  `;
  (document.head || root).appendChild(style);

  const clickTimes = new WeakMap();
  const fallbackTimers = new WeakMap();

  function navTargetFrom(eventTarget) {
    return eventTarget instanceof Element
      ? eventTarget.closest('.gensRootModeCard, .homeGear')
      : null;
  }

  function noteRealClick(target) {
    clickTimes.set(target, performance.now());
    const timer = fallbackTimers.get(target);
    if (timer) {
      clearTimeout(timer);
      fallbackTimers.delete(target);
    }
  }

  function armFallback(target) {
    if (!target || fallbackTimers.has(target)) return;
    const armedAt = performance.now();
    const timer = setTimeout(() => {
      fallbackTimers.delete(target);
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
    }, 120);
    fallbackTimers.set(target, timer);
  }

  document.addEventListener('click', event => {
    const target = navTargetFrom(event.target);
    if (!target) return;
    noteRealClick(target);
  }, true);

  // Pointer events cover normal touch interaction in Android Chrome.
  // A single delayed fallback is enough; do not duplicate with touchend.
  document.addEventListener('pointerup', event => {
    const target = navTargetFrom(event.target);
    if (!target) return;
    armFallback(target);
  }, true);
})();
