const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');

const block=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(block,'Pages module injection list missing');
const pageSrcs=[...block.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);
const previewSrcs=[...preview.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);

assert.ok(pageSrcs.length>=10,'unexpectedly small Pages module list');
assert.deepEqual(previewSrcs,pageSrcs,'preview.html must reproduce the exact GitHub Pages injected module order');
assert.equal(previewSrcs.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap handoff must remain the final injected runtime layer');
assert.match(preview,/html=html\.split\(perf\)\.join\(''\)/,'preview must remove the source performance tag before reinjecting the Pages order');
assert.match(preview,/<base href=\\"\$\{base\}\\">/,'preview must resolve all relative assets against the immutable commit directory');

console.log('GenSrpG manual preview composition matches GitHub Pages injected module order:',previewSrcs.length,'modules');
