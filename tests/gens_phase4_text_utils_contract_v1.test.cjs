const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/text-utils-v1.js';
const abs=path.join(root,rel);

assert.ok(fs.existsSync(abs),
  'RED until pure Core text utility exists at '+rel);

const source=fs.readFileSync(abs,'utf8');

for(const token of [
  'document.','localStorage','sessionStorage','indexedDB',
  'addEventListener','dispatchEvent','CustomEvent','MutationObserver',
  'setTimeout','setInterval','requestAnimationFrame','Math.random',
  'fetch(','WebSocket','location.','navigator.'
]){
  assert.ok(!source.includes(token),rel+' must remain pure; forbidden token: '+token);
}

assert.doesNotMatch(source,/\b(?:Dungeon|Tactical|Survival|Capture|PvP|z40k)\b/,
  'text utility must remain module-agnostic');

const ctx={console};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:rel});

const U=ctx.GensTextUtilsV1;
assert.ok(U,'GensTextUtilsV1 export missing');
assert.equal(typeof U.escapeHtml,'function','escapeHtml export missing');
assert.ok(Object.isFrozen(U),'public Text Utils API must be frozen');

const cases=[
  [null,''],
  [undefined,''],
  ['',''],
  [0,'0'],
  [42,'42'],
  [false,'false'],
  [true,'true'],
  ['plain text','plain text'],
  ['&','&amp;'],
  ['<','&lt;'],
  ['>','&gt;'],
  ['"','&quot;'],
  ["'",'&#39;'],
  ['&<>"\'','&amp;&lt;&gt;&quot;&#39;'],
  ['already &lt; escaped','already &amp;lt; escaped'],
  ['éèà 😀','éèà 😀']
];

for(const [input,expected] of cases){
  assert.equal(U.escapeHtml(input),expected,'escapeHtml parity drift for '+String(input));
}

const obj={toString(){return '<object & value>'}};
assert.equal(U.escapeHtml(obj),'&lt;object &amp; value&gt;',
  'escapeHtml must preserve String(value) semantics');

assert.deepEqual(Object.keys(U).sort(),['VERSION','escapeHtml'],
  'U1 public surface must stay minimal');

console.log(JSON.stringify({
  scenario:'Phase 4 U1 pure Text Utils contract',
  cases:cases.length+1,
  service:rel,
  api:'GensTextUtilsV1.escapeHtml',
  runtimeConnected:true
},null,2));
