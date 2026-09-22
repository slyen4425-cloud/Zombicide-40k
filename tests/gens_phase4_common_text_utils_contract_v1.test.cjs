const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/text-utils-v1.js';
const full=path.join(root,rel);

assert.ok(fs.existsSync(full),'RED until Core Text Utility v1 exists');

const source=fs.readFileSync(full,'utf8');
assert.doesNotMatch(source,/\b(?:document|localStorage|sessionStorage|indexedDB|CustomEvent|dispatchEvent|addEventListener|MutationObserver|setTimeout|setInterval|requestAnimationFrame|fetch|Math\.random)\b/,
  'Core Text Utility must remain pure and infrastructure-free');

const ctx={console};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:rel});

const api=ctx.GensTextUtilsV1;
assert.ok(api,'GensTextUtilsV1 export missing');
assert.ok(Object.isFrozen(api),'GensTextUtilsV1 must be frozen');
assert.equal(api.VERSION,'1.0.0');
assert.equal(typeof api.escapeHtml,'function');
assert.deepEqual(Object.keys(api).sort(),['VERSION','escapeHtml']);

const cases=[
  [null,''],
  [undefined,''],
  ['', ''],
  [0,'0'],
  [42,'42'],
  [false,'false'],
  [true,'true'],
  ['hello','hello'],
  ['&','&amp;'],
  ['<','&lt;'],
  ['>','&gt;'],
  ['"','&quot;'],
  ["'",'&#39;'],
  ['<&>"\'','&lt;&amp;&gt;&quot;&#39;'],
  ['already &amp; escaped','already &amp;amp; escaped'],
  ['a/b=c','a/b=c']
];

for(const [input,expected] of cases){
  assert.equal(api.escapeHtml(input),expected,'escapeHtml parity drift for '+String(input));
}

for(const relFile of ['index.html','service-worker.js','.github/workflows/main.yml','preview.html']){
  const p=path.join(root,relFile);
  if(!fs.existsSync(p))continue;
  const text=fs.readFileSync(p,'utf8');
  assert.ok(!text.includes('text-utils-v1.js'),relFile+' must not load inert U1 service');
}

console.log(JSON.stringify({
  scenario:'Phase 4 U1 pure Core Text Utility contract',
  api:'GensTextUtilsV1.escapeHtml',
  cases:cases.length,
  inert:true,
  runtimeConnected:false
},null,2));
