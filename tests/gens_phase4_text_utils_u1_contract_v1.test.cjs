const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/text-utils-v1.js';
const full=path.join(root,rel);

assert.ok(fs.existsSync(full),'RED until Core Text Utility v1 exists');

const source=fs.readFileSync(full,'utf8');

for(const forbidden of [
  /\bdocument\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\bindexedDB\b/,
  /addEventListener|dispatchEvent|CustomEvent|MutationObserver/,
  /setTimeout|setInterval|requestAnimationFrame/,
  /Math\.random|crypto\.getRandomValues/,
  /location\.|history\.|openGensFamily|startConfiguredGame/,
  /damage|armor|initiative|skillPoints|xpPerLevel|combat/i
]){
  assert.doesNotMatch(source,forbidden,'Text Utility must stay pure: '+forbidden);
}

assert.match(source,/ROOT\.GensTextUtilsV1\s*=\s*Object\.freeze\(/,
  'public Core Text Utility API must be explicit and frozen');
assert.match(source,/escapeHtml/,'escapeHtml export missing');

const ctx={console};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:rel});

const api=ctx.GensTextUtilsV1;
assert.ok(api,'GensTextUtilsV1 missing');
assert.ok(Object.isFrozen(api),'GensTextUtilsV1 must be frozen');
assert.equal(typeof api.escapeHtml,'function');
assert.deepEqual(Object.keys(api).sort(),['VERSION','escapeHtml']);

const cases=[
  [null,''],
  [undefined,''],
  ['', ''],
  [0,'0'],
  [42,'42'],
  [true,'true'],
  [false,'false'],
  ['texte normal','texte normal'],
  ['&','&amp;'],
  ['<','&lt;'],
  ['>','&gt;'],
  ['"','&quot;'],
  ["'",'&#39;'],
  ['&<>"\'','&amp;&lt;&gt;&quot;&#39;'],
  ['A&B <tag> "x" \'y\'','A&amp;B &lt;tag&gt; &quot;x&quot; &#39;y&#39;'],
  ['&amp;','&amp;amp;']
];

for(const [input,expected] of cases){
  assert.equal(api.escapeHtml(input),expected,'escapeHtml parity failed for '+String(input));
}

console.log(JSON.stringify({
  scenario:'Phase 4 U1 pure Core Text Utility contract',
  api:'GensTextUtilsV1.escapeHtml',
  cases:cases.length,
  pure:true,
  compositionContract:'covered by dedicated raccord sentinels'
},null,2));
