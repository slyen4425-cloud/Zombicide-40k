'use strict';
// Separate certification of immutable 18 October R10 extraction and current
// Capture button owner. This fixture is text-only and never part of the PWA.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const originalPath='tests/fixtures/gensrpg-phase12-r10-capture-original-owner-20261018.js.txt';
const modulePath='assets/gensrpg/capture/legacy-monolith-functions-v1.js';
const certified=read(originalPath),active=read(modulePath);
assert.equal(certified.length,61943,'original owner byte count must match R10');
assert.equal(hash(certified),'c6ea3c101a6861b99f8bc064d2d1fec874e7266b',
 'historical R10 owner is a byte-exact, non-executable archive');
assert.ok(active.length>0);
const originalText=certified.toString('utf8'),activeText=active.toString('utf8');
new vm.Script(originalText);
new vm.Script(activeText);
const functionNames=s=>[...s.matchAll(/^function (capture[A-Za-z0-9_$]+)\s*\(/gm)].map(m=>m[1]);
const origNames=functionNames(originalText),liveNames=functionNames(activeText);
assert.equal(origNames.length,90);
assert.equal(new Set(origNames).size,90);
assert.deepEqual(liveNames,origNames,'new active owner must preserve the 90 unique declarations, their order and scope');
assert.equal(liveNames.filter(n=>n==='captureStartWildBattle').length,1,'a single original Capture button owner, no override');
const tool=read('tools/gensrpg_phase12_r10_capture_extract_apply.cjs').toString('utf8');
assert.match(tool,/const R10_OWNER_SNAPSHOT=/,'rollback script must explicitly know immutable historical owner fixture');
assert.match(tool,/certifiedHistoricalOwner\(\)/,'rollback script must consume snapshot, not mutated active runtime');
assert.match(tool,/blob\(original\)===NEW_MODULE/,'historical snapshot hash cannot be skipped');
const index=read('index.html').toString('utf8');
assert.ok(!index.includes(originalPath),'text-only fixture must never be loaded by index');
assert.ok(!read('service-worker.js').toString('utf8').includes(originalPath),'text-only fixture must never enter PWA cache');
console.log(JSON.stringify({scenario:'R10 historical certified rollback fixture isolated from evolving active Capture owner',
 originalSha:hash(certified),ownerDeclarations:liveNames.length,
 activeSha:hash(active),noProductionFixture:true}));
