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

test('the published preparation offers 1–6 real starter creatures without restoring the removed stat wallet',()=>{
 const html=read(assembled+'assets/gensrpg/capture-v2/adventure.html');
 const app=read(assembled+'assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const contract=read(assembled+'assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
 assert.match(html,/id="adventure-starter-count"/);
 for(let n=1;n<=6;n++)assert.ok(html.includes('<option value="'+n+'"'),'starter count '+n+' missing');
 assert.match(html,/id="adventure-starter-reserve"/);
 assert.match(html,/id="adventure-active-creature"/);
 assert.match(html,/id="adventure-select-active"/);
 assert.match(app,/getStarterSpeciesIds\(\)/);
 assert.match(app,/chooseAdventureActiveCreatureV1\(/);
 assert.match(contract,/reserveInstanceIds/);
 assert.match(contract,/new Set\(instanceIds\)\.size!==instanceIds\.length/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
 assert.doesNotMatch(app,/renderStatWallet\(/);
});
