const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'assets/gensrpg/gens-chrome-startup-diag-1678122.js');
const src = fs.readFileSync(file, 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(src.includes('__GENSRPG_CHROME_ANDROID_UI_RECOVERY__'), 'Chrome Android recovery guard missing');
assert(src.includes('gens-chrome-android-ui-recovery'), 'Chrome Android recovery class missing');
assert(src.includes('MutationObserver'), 'Navigation repaint observer missing');
assert(src.includes('forceSoftwareRepaint'), 'Software repaint fallback missing');
assert(src.includes('.gensRootModeCard, .homeGear'), 'Home navigation targets missing');
assert(src.includes('backdrop-filter: none'), 'Backdrop filter safety override missing');
assert(src.includes('touch-action: manipulation'), 'Touch safety override missing');

assert(!src.includes('EventTarget.prototype.addEventListener='), 'Dangerous EventTarget monkey patch is still present');
assert(!src.includes('__GENSRPG_DIAG122_INSTALLED__'), 'Old V122/V123 diagnostic guard is still present');
assert(!src.includes('gensrpgDiag122'), 'Old diagnostic overlay is still present');
assert(!src.includes('handler click START'), 'Old click handler instrumentation is still present');

console.log('chrome_android_ui_recovery_v1678126: success');
