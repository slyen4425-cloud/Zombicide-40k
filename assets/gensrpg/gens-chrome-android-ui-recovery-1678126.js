(() => {
  'use strict';

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !/(EdgA|OPR|Firefox|FxiOS)\//i.test(ua);
  if (!isAndroid || !isChrome) return;

  const ROOT_CLASS = 'gens-chrome-android-ui-recovery';
  document.documentElement.classList.add(ROOT_CLASS);

  const style = document.createElement('style');
  style.id = 'gensChromeAndroidUiRecoveryStyle';
  style.textContent = `
    html.${ROOT_CLASS} .gensRootModeCard,
    html.${ROOT_CLASS} .gensRootModeCard *,
    html.${ROOT_CLASS} .homeGear,
    html.${ROOT_CLASS} [class*="gensRootMode"] {
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

    html.${ROOT_CLASS} .gensRootModeCard,
    html.${ROOT_CLASS} .homeGear {
      transform: none !important;
      -webkit-transform: none !important;
      touch-action: manipulation !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  let paintQueued = false;

  function forceSoftwareRepaint() {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      paintQueued = false;
      const body = document.body;
      if (!body) return;
      const previousOutline = body.style.outline;
      body.style.outline = '1px solid transparent';
      void body.offsetHeight;
      requestAnimationFrame(() => {
        body.style.outline = previousOutline;
        void body.offsetHeight;
      });
    });
  }

  function watchNavigationMutation() {
    const body = document.body;
    if (!body || typeof MutationObserver === 'undefined') return;

    let timer = 0;
    const observer = new MutationObserver(() => {
      forceSoftwareRepaint();
      clearTimeout(timer);
      timer = setTimeout(() => observer.disconnect(), 350);
    });

    observer.observe(body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
    });

    timer = setTimeout(() => observer.disconnect(), 1200);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element
      ? event.target.closest('.gensRootModeCard, .homeGear')
      : null;
    if (!target) return;

    watchNavigationMutation();
    queueMicrotask(forceSoftwareRepaint);
    requestAnimationFrame(forceSoftwareRepaint);
    setTimeout(forceSoftwareRepaint, 40);
    setTimeout(forceSoftwareRepaint, 120);
    setTimeout(forceSoftwareRepaint, 280);
  }, true);

  window.addEventListener('pageshow', forceSoftwareRepaint, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(forceSoftwareRepaint, 60), { passive: true });
})();
