'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const hero=fs.readFileSync(path.join(root,'assets/gensrpg/gens-hero-editor-dynamic-167897.js'),'utf8');

assert.match(
  hero,
  /function hasWrapFlag\(fn,flag\).*__original/s,
  'Hero Editor must expose a bounded __original-chain guard for wrapper ownership'
);

assert.match(
  hero,
  /function wrap\(name,maker,flag="__canon101"\)\{const old=R\[name\];if\(typeof old!=="function"\|\|hasWrapFlag\(old,flag\)\)return false/,
  'generic Hero Editor wrapper must reject an owner marker already present in the __original chain'
);

assert.match(
  hero,
  /const retry=\(\)=>\{installWrappers\(\);forceBuiltinArt\(\);if\(tries\+\+<30\)setTimeout\(retry,100\)\}/,
  'existing retry cadence must remain intact'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Hero Editor wrapper chain guard owner contract',
  chainAwareGuard:true,
  retryCadencePreserved:true
},null,2));
