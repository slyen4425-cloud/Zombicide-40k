'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=require(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'));
const uiSrc=fs.readFileSync(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js'),'utf8');

let registered=0,removed=0,hook=null,renderCalls=0;
const originalRender=()=>{renderCalls++};
const style={remove(){}};
const D={
  getElementById(){return style}, // style already present; no unrelated DOM mutation
  addEventListener(){},removeEventListener(){},
  querySelector(){return null}
};
const U={
  getBattle(){return null},
  render:originalRender,
  onAfterRender(fn){registered++;hook=fn;return ()=>{removed++;hook=null}}
};
const rt={document:D,GensRpgTacticalCombatV2Ui:U};
api.install(rt);
assert.equal(registered,1,'single native render-hook subscription');
assert.equal(typeof hook,'function');
assert.strictEqual(U.render,originalRender,'do not shadow or replace the real Tactical renderer');
api.install(rt);
assert.equal(registered,1,'retries must not duplicate action-panel render hooks');
assert.equal(U.render,originalRender);
hook({root:null,battle:null});
assert.equal(renderCalls,0,'afterRender hook should not recursively rerender');
api.dispose(rt);
assert.equal(removed,1,'dispose releases native subscription');
api.install(rt);
assert.equal(registered,2,'reopened encounter may register again');
api.dispose(rt);
assert.equal(removed,2);
assert.match(uiSrc,/function onAfterRender\(/,'Tactical native lifecycle contract must exist');
assert.match(uiSrc,/notifyAfterRender\(\)/,'Tactical renders must issue lifecycle notifications');
assert.match(uiSrc,/rootEl\.innerHTML=/,'Tactical must own its markup');
assert.match(uiSrc,/notifyAfterRender\(\)\}/,'native render must call notification after replacing markup');
const polishSrc=fs.readFileSync(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'),'utf8');
assert.match(polishSrc,/onAfterRender\(/,'the ergonomic panel must use the native lifecycle');
assert.doesNotMatch(polishSrc,/MutationObserver/,'no body/html observer or repeated timer may be introduced');
console.log(JSON.stringify({scenario:'native Tactical afterRender panel lifecycle',registrations:registered,unsubscribes:removed,renderAuthorityKept:true}));
