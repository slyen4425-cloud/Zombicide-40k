const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const block=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(block,'Pages module injection list missing');
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(previewBlock,'preview module injection list missing');
const pageSrcs=[...block.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);
const previewSrcs=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>m[1]);

assert.ok(pageSrcs.length>=10,'unexpectedly small Pages module list');
const storageSrc='assets/gensrpg/core/storage-v1.js';
assert.equal(index.split('<script src="'+storageSrc+'"></script>').length-1,1,'source index must bootstrap Core storage exactly once');
assert.deepEqual(previewSrcs,pageSrcs.filter(src=>src!==storageSrc),'preview.html must reproduce Pages additions except Core storage already inherited from source index');
for(const src of previewSrcs){
  const file=src.split('?')[0];
  assert.equal(fs.existsSync(path.join(root,file)),true,`preview runtime asset missing: ${file}`);
}
assert.equal(previewSrcs.at(-2),'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
  'performance/bootstrap handoff must remain immediately before the final Shell authority');
assert.equal(previewSrcs.at(-1),'assets/gensrpg/shell/module-launch-final-authority-v1.js',
  'final Shell authority must be the final injected preview runtime layer');
assert.match(preview,/html=html\.split\(perf\)\.join\(''\)/,
  'preview must remove the source performance tag before reinjecting the Pages order');
assert.match(preview,/html=html\.split\(finalShell\)\.join\(''\)/,
  'preview must remove the source final Shell tag before reinjecting the Pages order');
assert.ok(preview.includes('const base=new URL(\'./\',location.href).href;'),'preview must derive its immutable commit-root base URL');
assert.ok(preview.includes('<base href="${base}">'),'preview must inject the commit-root base into the source document');
assert.ok(preview.includes('document.open();')&&preview.includes('document.write(html);')&&preview.includes('document.close();'),'preview must render into the top-level document so reload/restart returns to preview.html');
assert.doesNotMatch(preview,/<iframe\b/i,'restart-safe preview must not use an iframe/srcdoc');
assert.ok(preview.includes('__GENSRPG_PREVIEW__'),'preview must mark its isolated runtime');
assert.ok(preview.includes('Object.defineProperty(navigator.serviceWorker,"register"'),'preview must prevent PWA worker registration');
assert.ok(preview.includes('gensrpg-cache-'),'preview must clear GenSrpG preview caches without touching unrelated cache names');
assert.ok(preview.includes('gensrpgPreviewReady'),'preview must emit an explicit runtime-ready marker');

console.log('GenSrpG manual preview composition matches GitHub Pages:',previewSrcs.length,'added modules + one inherited Core storage bootstrap + top-level restart-safe PWA isolation');
