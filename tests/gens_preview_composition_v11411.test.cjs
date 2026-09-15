const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');

const block=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(block,'Pages module injection list missing');
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(previewBlock,'preview module injection list missing');
const pageSrcs=[...block.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);
const previewSrcs=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);

assert.ok(pageSrcs.length>=10,'unexpectedly small Pages module list');
assert.deepEqual(previewSrcs,pageSrcs,'preview.html must reproduce the exact GitHub Pages injected module order');
assert.equal(previewSrcs.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap handoff must remain the final injected runtime layer');
assert.match(preview,/html=html\.split\(perf\)\.join\(''\)/,'preview must remove the source performance tag before reinjecting the Pages order');
assert.ok(preview.includes('const base=new URL(\'./\',location.href).href;'),'preview must derive its immutable commit-root base URL');
assert.ok(preview.includes('<base href="${base}">'),'preview must inject the commit-root base into the source document');

console.log('GenSrpG manual preview composition matches GitHub Pages injected module order:',previewSrcs.length,'modules');
