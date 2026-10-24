const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-ui.js'),'utf8');
const v111=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');

// The canonical Tactical renderer owns one explicit post-render lifecycle hook.
assert.match(ui,/const afterRenderHooks=new Set\(\)/,
  'canonical Tactical UI must own a post-render hook set');
assert.match(ui,/function onAfterRender\(fn\)/,
  'canonical Tactical UI must expose explicit post-render registration');
assert.match(ui,/function notifyAfterRender\(\)/,
  'canonical Tactical UI must own post-render notification');
assert.match(ui,/notifyAfterRender\(\)/,
  'the local canonical render path must notify subscribers after rendering');
assert.match(ui,/onAfterRender/,
  'Tactical UI public API must expose onAfterRender');

// V111 may subscribe to the renderer lifecycle, but must not wrap/re-own render.
assert.match(v111,/typeof U\?\.onAfterRender!=="function"/,
  'V111 must wait for the canonical onAfterRender contract');
assert.match(v111,/U\.onAfterRender\(\(\)=>maintain\(rt\)\)/,
  'V111 must subscribe maintain() to the canonical post-render hook');
assert.doesNotMatch(v111,/U\.render=wrapped/,
  'V111 must not replace the canonical Tactical render function');
assert.doesNotMatch(v111,/old=U\?\.render/,
  'V111 must not capture the exported render function as a repair layer');

// The retired DOM repair path stays retired.
const install=(v111.match(/function install\(rt=R\)\{([^}]*)\}/)||[])[1]||'';
assert.ok(install,'V111 install() must exist');
assert.doesNotMatch(install,/observe\(/,
  'V111 install must not reactivate MutationObserver repair');
assert.match(v111,/Attaquer/,'dock Attack label must remain');
assert.match(v111,/Fin du tour/,'dock End turn label must remain');
assert.match(v111,/Capacité/,'dock Ability label must remain');
assert.match(v111,/\.gtv2Actions button\[data-attack\]/,
  'dock attack button must keep relaying to the real Tactical source action');
assert.match(v111,/\.gtv2Actions button\[data-end\]/,
  'dock end-turn button must keep relaying to the real Tactical source action');

console.log('GenSrpG canonical Tactical post-render dock hook contract OK');
