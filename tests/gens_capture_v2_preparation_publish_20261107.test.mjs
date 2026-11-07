import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pinned=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));
const assembled='_'+ 'site/preview/capture-v2-pr225/';
test('the ONE published main Capture V2 candidate owns the corrected Aventure preparation',()=>{
 const html=read(assembled+'assets/gensrpg/capture-v2/adventure.html');
 assert.match(html,/id="adventure-save-summary"/);
 assert.match(html,/id="adventure-save-select"/);
 assert.match(html,/id="adventure-hero-choice"/);
 assert.doesNotMatch(html,/adventure-stat-wallet|adventure-stat-rows|adventure-stat-points-left/,
  'the published preparation must no longer expose an actionable stat wallet');
 assert.match(html,/<dialog id="adventure-play-sheet"/);
 assert.match(html,/data-adventure-sheet-tab="stats"/,
  'the in-game official character sheet still owns stat allocation');
 assert.match(html,/id="adventure-stat-points-per-level"/,
  'creator still configures the progression policy');
});
test('the deployed provenance stays pinned to the exact candidate, not a duplicate editor or a drifting branch',()=>{
 const prov=JSON.parse(read(assembled+'release-provenance.v1.json'));
 assert.equal(pinned.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.match(pinned.sha,/^[a-f0-9]{40}$/);
 assert.equal(prov.source.commit,pinned.sha);
 assert.equal(prov.publicPath,pinned.publicPath);
 assert.equal(prov.legacyCaptureRuntime,false);
});
