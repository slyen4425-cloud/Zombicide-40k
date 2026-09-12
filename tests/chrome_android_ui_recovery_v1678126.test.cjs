const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'assets/gensrpg/gens-chrome-startup-diag-1678122.js');
const src = fs.readFileSync(file, 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(src.includes('__GENSRPG_CHROME_ANDROID_UI_RECOVERY__'), 'Chrome Android recovery guard missing');
assert(src.includes('gens-chrome-android-ui-recovery'), 'Chrome Android recovery class missing');
assert(src.includes('.gensRootModeCard, .homeGear'), 'Home navigation targets missing');
assert(src.includes('backdrop-filter: none'), 'Backdrop filter safety override missing');
assert(src.includes('touch-action: manipulation'), 'Touch safety override missing');
assert(src.includes("addEventListener('pointerup'"), 'Pointer fallback missing');
assert(src.includes('target.click()'), 'Synthetic click fallback missing');

assert(!src.includes('MutationObserver'), 'Chrome recovery must not run a navigation MutationObserver');
assert(!src.includes("body.style.display = 'none'"), 'Chrome recovery must not hide the whole document');
assert(!src.includes("body.style.visibility = 'hidden'"), 'Chrome recovery must not hide the whole document');
assert(!src.includes('offsetHeight'), 'Chrome recovery must not force synchronous layout reads');
assert(!src.includes('softRepaintBurst'), 'Old repaint burst is still present');
assert(!src.includes("addEventListener('touchend'"), 'Duplicate touch fallback is still present');
assert(!src.includes('EventTarget.prototype.addEventListener='), 'Dangerous EventTarget monkey patch is still present');
assert(!src.includes('__GENSRPG_DIAG122_INSTALLED__'), 'Old V122/V123 diagnostic guard is still present');
assert(!src.includes('gensrpgDiag122'), 'Old diagnostic overlay is still present');
assert(!src.includes('handler click START'), 'Old click handler instrumentation is still present');

console.log('chrome_android_ui_recovery_v1678129: success');
