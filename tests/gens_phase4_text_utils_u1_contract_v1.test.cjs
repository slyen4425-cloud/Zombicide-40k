const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const servicePath='assets/gensrpg/core/text-utils-v1.js';

assert.ok(fs.existsSync(path.join(root,servicePath)),
  'RED expected: Phase 4 U1 text utility service does not exist yet');

const source=read(servicePath);
const worldBuilder=read('assets/dungeon/dungeon-world-builder-167821.js');
const roomCreator=read('assets/dungeon/dungeon-room-creator-100.js');
const statsUi=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');

function historicalEsc(src,marker,label){
  const line=src.split(/\r?\n/).find(l=>l.includes(marker));
  assert.ok(line,label+' representative esc helper missing');
  return vm.runInNewContext(line+'\n;esc',{}, {filename:label});
}

const representatives=[
  ['World Builder',historicalEsc(worldBuilder,'function esc(v)','world-builder-esc')],
  ['Room Creator',historicalEsc(roomCreator,'function esc(v)','room-creator-esc')],
  ['Stats UI',historicalEsc(statsUi,'const esc=v=>','stats-ui-esc')]
];

const ctx={console};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(source,ctx,{filename:servicePath});

assert.ok(ctx.GensTextUtilsV1,'GensTextUtilsV1 public export missing');
assert.ok(Object.isFrozen(ctx.GensTextUtilsV1),'GensTextUtilsV1 must expose a frozen contract');
assert.equal(typeof ctx.GensTextUtilsV1.escapeHtml,'function','escapeHtml export missing');

const escapeHtml=ctx.GensTextUtilsV1.escapeHtml;
const cases=[
  [null,''],
  [undefined,''],
  ['',''],
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
  ['déjà &amp;','déjà &amp;amp;'],
  ['é / = +','é / = +']
];

for(const [input,expected] of cases){
  assert.equal(escapeHtml(input),expected,'Core escapeHtml contract drifted for '+String(input));
  for(const [label,legacy] of representatives){
    assert.equal(escapeHtml(input),legacy(input),label+' parity drifted for '+String(input));
  }
}

assert.doesNotMatch(source,/\b(?:document|localStorage|sessionStorage|CustomEvent|dispatchEvent|addEventListener|MutationObserver|setTimeout|setInterval|requestAnimationFrame|XMLHttpRequest|fetch)\b/,
  'U1 text utility must remain pure and infrastructure-free');
assert.doesNotMatch(source,/Math\.random|location\.|history\.|navigator\./,
  'U1 text utility must not use RNG/navigation/browser state');
assert.doesNotMatch(source,/Dungeon|Tactical|Survival|Capture|PvP|combat|damage|xp|skillPoints/i,
  'U1 text utility must remain domain-neutral');

for(const rel of ['index.html','preview.html','service-worker.js','.github/workflows/main.yml']){
  if(!fs.existsSync(path.join(root,rel)))continue;
  const prod=read(rel);
  assert.doesNotMatch(prod,/text-utils-v1\.js|GensTextUtilsV1/,
    rel+' must not load or reference inert U1 contract');
}

console.log(JSON.stringify({
  scenario:'Phase 4 U1 pure text utility contract',
  servicePath,
  export:'GensTextUtilsV1.escapeHtml',
  parityImplementations:representatives.map(x=>x[0]),
  cases:cases.length,
  inertProductionGraph:true,
  eventBusCreated:false
},null,2));
