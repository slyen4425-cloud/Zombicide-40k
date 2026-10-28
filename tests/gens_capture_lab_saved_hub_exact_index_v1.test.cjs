'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const root=require('node:path').resolve(__dirname,'..');
const read=name=>fs.readFileSync(require('node:path').join(root,name));
const blob=value=>crypto.createHash('sha1').update('blob '+value.length+'\0').update(value).digest('hex');
const indexBytes=read('index.html');
assert.equal(indexBytes.length,1722603,'uploaded index from the exact staging SHA must match');
assert.equal(blob(indexBytes),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646',
 'uploaded index1.zip/index.html(1).txt has the same blob as staging PR #175');
const html=indexBytes.toString('utf8');
const original='assets/gensrpg/capture/legacy-monolith-functions-v1.js';
const world='assets/gensrpg/capture/world-exploration-v1.js';
const roster='assets/gensrpg/capture/team-roster-v1.js';
const positions=[world,roster,original].map(file=>{
 const tag='src="'+file;
 const index=html.indexOf(tag);
 assert.ok(index>0,'canonical Capture owner must already be loaded: '+file);
 assert.equal(html.indexOf(tag,index+1),-1,'no duplicate owner: '+file);
 return index;
});
assert.ok(positions[0]<positions[1]&&positions[1]<positions[2],
 'browser must load World and roster before the legacy Capture battle-button owner');
// The PR #187 R10 archive remains a byte-exact historical certificate;
// ONLY its one active original public callback is changed in this C3 lot.
const r10Snapshot=read('tests/fixtures/gensrpg-phase12-r10-capture-original-owner-20261018.js.txt');
assert.equal(r10Snapshot.length,61943,'R10 archive size is still certified');
assert.equal(blob(r10Snapshot),'c6ea3c101a6861b99f8bc064d2d1fec874e7266b',
 'historical R10 bytes are never rewritten for the new public handler');
const active=read(original).toString('utf8'),historical=r10Snapshot.toString('utf8');
const names=body=>[...body.matchAll(/^function (capture[A-Za-z0-9_$]+)\s*\(/gm)].map(m=>m[1]);
assert.equal(names(historical).length,90,'R10 still certifies all 90 owners');
assert.deepEqual(names(active),names(historical),'active Capture preserves all 90 declarations in order');
assert.equal(names(active).filter(name=>name==='captureStartWildBattle').length,1);
assert.match(active,/capture-official-public-wild-v1\.mjs/);
const wildBody=active.slice(active.indexOf('function captureStartWildBattle('),
 active.indexOf('\nfunction captureOpenTrainerBattle('));
assert.doesNotMatch(wildBody,/captureStartBattleAutomatic\(/,
 'original wild button cannot launch the historical simulator');
assert.doesNotMatch(active,/window\.captureStartWildBattle\s*=/,
 'no parallel public wild handler may be installed');
assert.ok(!html.includes('capture-lab-saved-hub-preview.html'));
assert.ok(!html.includes('saved-hub.mjs'));
assert.ok(!html.includes('capture-lab-hub-battle-command-v1.mjs'));
const preview=read('capture-lab-saved-hub-preview.html').toString('utf8');
for(const file of [world,roster])assert.ok(preview.includes('src="'+file+'"'),file+' must be the actual original owner');
assert.ok(preview.includes('src="assets/gensrpg/capture/preview/saved-hub.mjs"'));
assert.ok(!preview.includes('src="'+original+'"'),'the frozen old turn combat is never loaded in this isolated live-Lab preview');
const context=read('assets/gensrpg/capture/preview/saved-hub-owners.js').toString('utf8');
assert.match(context,/gensrpg_capture_lab_saved_preview_profile_v1/);
assert.match(context,/gensrpg_capture_lab_saved_preview_hero_/);
assert.doesNotMatch(context,/saveCaptureWorldState\s*=|window\.captureStartWildBattle\s*=|createCombatSession|createCombatRuntime/);
console.log(JSON.stringify({
 scenario:'uploaded index1.zip matched exact staging index and three unique physical owners',
 htmlGitBlob:blob(indexBytes),historicalR10Retained:true,
 originalPublicWildOwnerUsesLab:true,previewIsolated:true,productionGraphUnchanged:true
}));
