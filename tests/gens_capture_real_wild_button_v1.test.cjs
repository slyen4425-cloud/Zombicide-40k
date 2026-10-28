'use strict';
// Mandatory gate: test the single ORIGINAL public-world onclick, not an
// artificially created preview button. Complemented by true browser tests.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const owner=read('assets/gensrpg/capture/legacy-monolith-functions-v1.js');
const world=read('assets/gensrpg/capture/world-exploration-v1.js');
const segment=/function captureStartWildBattle\(creatureId\)\{[\s\S]*?\n\}\n\nfunction captureOpenTrainerBattle/.exec(owner);
test('the canonical existing Capture COMBATTRE function transfers to the sole official entry and NEVER starts old combat',()=>{
 assert.ok(segment,'original 90-function Capture owner still declares the real wild button');
 const body=segment[0];
 assert.equal((owner.match(/^function captureStartWildBattle\(/gm)||[]).length,1);
 assert.match(body,/import\(/,'real original button imports official integration instead of old fight');
 assert.match(body,/capture-official-wild-entry-v1\.mjs/);
 assert.doesNotMatch(body,/captureStartBattleAutomatic\(/,'no old engine fallback');
 assert.doesNotMatch(owner,/window\.captureStartWildBattle\s*=/,'no global wrapper or second authority');
 assert.match(world,/onclick="captureStartWildBattle\(/,'existing World UI still owns button markup');
});
test('exact one official entry owns native composer, view, migration, persistent World and no shadow runtime',()=>{
 const entry=read('assets/gensrpg/capture/capture-official-wild-entry-v1.mjs');
 assert.match(entry,/createCaptureOfficialHubCompositionV1/);
 assert.match(entry,/createCaptureOfficialBattleViewV1/);
 assert.match(entry,/createCaptureSavedProfileLabMigrationV1/);
 assert.match(entry,/captureConsumeWildEncounter/);
 assert.match(entry,/saveHeroCreatureState/);
 assert.match(entry,/plan\.consentText/,'informed user consent required on historical migration');
 assert.doesNotMatch(entry,/captureStartBattleAutomatic\(|gensCreateCaptureBattle\(|window\.captureStartWildBattle\s*=|localStorage\.setItem\(|createCombatSession\(/);
 assert.equal((entry.match(/createCaptureOfficialHubCompositionV1\s*\(/g)||[]).length,1,'one official composition only');
});
test('historical R10 rollback remains byte-pinned and original index remains unchanged',()=>{
 const crypto=require('node:crypto');
 const blob=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob(fs.readFileSync(path.join(root,'index.html'))),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646');
 assert.equal(blob(fs.readFileSync(path.join(root,'tests/fixtures/gensrpg-phase12-r10-capture-original-owner-20261018.js.txt'))),'c6ea3c101a6861b99f8bc064d2d1fec874e7266b');
});
