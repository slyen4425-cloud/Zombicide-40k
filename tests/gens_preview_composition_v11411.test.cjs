const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const {setImmediate:nextTurn}=require('node:timers/promises');
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
assert.ok(preview.includes("const original=params.get('url')"),'preview must recover the immutable source URL when rendered through html-preview');
assert.ok(preview.includes("https://raw.githack.com/"),'html-preview transport must resolve runtime assets against the exact immutable GitHub commit');
assert.ok(preview.includes("return {base,index:base+'index.html',external:true}"),'external preview must fetch the exact immutable commit index through RawGitHack');
assert.ok(preview.includes("return {base,index:new URL('index.html',base).href,external:false}"),'local preview must keep its native source-root composition');
assert.ok(preview.includes("if(!source.external)html=html.replace(/<\\/body>/i,tags.join("),'local preview must preserve the historical parser-ordered script injection');
assert.ok(preview.includes("if(source.external){"),'external preview must use an explicit dependency load path');
assert.ok(preview.includes('gensrpgPreviewLoadGate')&&preview.includes('document.getElementById("gensrpgPreviewLoadGate")?.remove()'),'preview must block user navigation until the external dependency graph completes');
assert.ok(preview.includes("if(!window.supabase)"),'manual preview must survive a blocked Supabase CDN without changing production runtime');
assert.ok(preview.includes('<base href="${base}">'),'preview must inject the commit-root base into the source document');
assert.ok(preview.includes('document.open();')&&preview.includes('document.write(html);')&&preview.includes('document.close();'),'preview must render into the top-level document so reload/restart returns to preview.html');
assert.doesNotMatch(preview,/<iframe\b/i,'restart-safe preview must not use an iframe/srcdoc');
assert.ok(preview.includes('__GENSRPG_PREVIEW__'),'preview must mark its isolated runtime');
assert.ok(preview.includes('Object.defineProperty(navigator.serviceWorker,"register"'),'preview must prevent PWA worker registration');
assert.ok(preview.includes('gensrpg-cache-'),'preview must clear GenSrpG preview caches without touching unrelated cache names');
assert.ok(preview.includes('gensrpgPreviewReady'),'preview must emit an explicit runtime-ready marker');

console.log('GenSrpG manual preview composition matches GitHub Pages:',previewSrcs.length,'added modules + one inherited Core storage bootstrap + top-level restart-safe PWA isolation');

function runExternalBootstrap(){
  const sha='f'.repeat(40);
  const base='https://raw.githack.com/slyen4425-cloud/Zombicide-40k/'+sha+'/';
  const search='?url='+encodeURIComponent('https://github.com/slyen4425-cloud/Zombicide-40k/blob/'+sha+'/preview.html');
  const scripts=[];
  const gate={textContent:'Chargement',remove(){this.removed=true;}};
  const document={
    readyState:'interactive',
    documentElement:{dataset:{}},
    getElementById:id=>id==='gensrpgPreviewLoadGate'?gate:null,
    open(){},
    write(){},
    close(){},
    createElement:()=>({dataset:{}}),
    body:{appendChild:script=>scripts.push(script)}
  };
  const bootstrap=preview.match(/\n<script>([\s\S]*?)\n<\/script>/)[1];
  const done=vm.runInNewContext(bootstrap,{
    document,window:{},location:{search},URL,URLSearchParams,
    fetch:async()=>({
      ok:true,text:async()=>'<html><head></head><body></body></html>',
      json:async()=>({
        combat:{repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',ref:'main',sha},
        exploration:{repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',ref:'main',sha}
      })
    })
  });
  return {base,document,done,gate,scripts};
}

test('external preview requests all auxiliary scripts while the first response is pending',async()=>{
  const {base,document,done,gate,scripts}=runExternalBootstrap();
  await nextTurn();
  assert.deepEqual(scripts.map(script=>script.src),previewSrcs.map(src=>base+src));
  assert.ok(scripts.every(script=>script.async===false),'classic scripts must execute in insertion order');
  assert.equal(document.documentElement.dataset.gensrpgPreviewReady,undefined);
  for(const script of scripts.slice(0,-1))script.onload();
  await nextTurn();
  assert.equal(gate.removed,undefined,'the menu stays locked until every dependency executes');
  scripts.at(-1).onload();
  await done;
  assert.equal(document.documentElement.dataset.gensrpgPreviewReady,'1');
  assert.equal(gate.removed,true);
});

test('external preview keeps the gate and identifies an inaccessible dependency',async()=>{
  const {document,done,gate,scripts}=runExternalBootstrap();
  await nextTurn();
  scripts[0].onerror();
  await done;
  assert.equal(document.documentElement.dataset.gensrpgPreviewReady,undefined);
  assert.equal(gate.removed,undefined);
  assert.ok(gate.textContent.includes(previewSrcs[0]));
});
