const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.doesNotMatch(
  html,
  /<script\s+id=["']dungeonCore301Timeline["'][^>]*>/,
  'Lot 4B: the disabled Core 3.01 timeline script must be retired instead of modernized'
);

assert.match(
  html,
  /<style\s+id=["']dungeonCore301TimelineCss["']>/,
  'Lot 4B is script-only: neighboring historical CSS stays out of scope'
);

// R16: preserve the active Core303 owner exactly, now externalized in place.
const owner='assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js';
const tag='<script id="dungeonCore303TimelineRootFix" src="'+owner+'"></script>';
assert.equal(html.split(tag).length-1,1,'Active Core 3.03 timeline owner must load once');
assert.doesNotMatch(html,/<script id="dungeonCore303TimelineRootFix">/,'Core 3.03 has no duplicate inline owner');
assert.ok(html.indexOf('src="assets/dungeon/dungeon-core-316.js"')<html.indexOf(tag),'Core303 must follow Core316');
assert.ok(html.indexOf(tag)<html.indexOf('id="dungeonCore304DefeatExit"'),'Core303 must precede Core304');
const active=fs.readFileSync(path.join(root,owner),'utf8');
const crypto=require('node:crypto');
const buf=Buffer.from(active,'utf8');
const sha=crypto.createHash('sha1').update('blob '+buf.length+String.fromCharCode(0)).update(buf).digest('hex');
assert.equal(sha,'fe7c0cff03f7e19f49d3c743257c5fe717f40593','Core303 code must remain byte-exact');

// Lot 4B owns only retirement of disabled Core 3.01. Later lots may reduce
// historical entrypoint debt inside Core 3.03, but must not remove its real
// timeline/turn responsibilities.
assert.match(active,/let T=\{sig:"",order:\[\],index:0,aiBusy:false,pendingHero:false\}/,
  'Active Core 3.03 timeline state must remain present');
assert.match(active,/function init\(force=false\)/,
  'Active Core 3.03 timeline initialization must remain present');
assert.match(active,/function advance\(\)/,
  'Active Core 3.03 turn advance must remain present');
assert.match(active,/function applyTurnUi\(\)/,
  'Active Core 3.03 turn UI authority must remain present');

console.log(JSON.stringify({lot:'4B',retired:'dungeonCore301Timeline',activeOwner:'dungeonCore303TimelineRootFix'}));
