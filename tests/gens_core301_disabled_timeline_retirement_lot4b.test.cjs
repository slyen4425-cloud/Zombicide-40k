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

const activeStart=html.indexOf('<script id="dungeonCore303TimelineRootFix">');
assert.ok(activeStart>=0,'Active Core 3.03 timeline owner must remain present');
const activeEnd=html.indexOf('</script>',activeStart);
assert.ok(activeEnd>activeStart,'Active Core 3.03 timeline script must remain complete');
const active=html.slice(activeStart,activeEnd);

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
