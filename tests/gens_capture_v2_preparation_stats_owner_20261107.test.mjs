import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('assets/gensrpg/capture-v2/adventure.html');
const app=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
const view=read('assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs');
const css=read('assets/gensrpg/capture-v2/adventure-style-v1.css');

test('preparing a new game does not render an actionable creature-stat allocation panel',()=>{
 const preparation=html.split('</main>')[0];
 assert.match(preparation,/id="adventure-create"/);
 assert.match(preparation,/id="adventure-save-summary"/);
 assert.doesNotMatch(preparation,/id="adventure-stat-wallet"|id="adventure-stat-rows"|id="adventure-stat-points-left"/);
 assert.doesNotMatch(app,/function renderStatWallet\(|renderStatWallet\(\)/);
 assert.doesNotMatch(css,/\.adventure-stat-wallet|#adventure-stat-points-left/);
});

test('the creator still configures stat gains, and the existing game-only sheet owns allocation',()=>{
 assert.match(html,/id="adventure-stat-points-per-level"/,
  'author progression remains editable during setup');
 assert.match(html,/id="adventure-guest-allocate-stats"/,
  'creator permissions remain configurable');
 assert.match(html,/<dialog id="adventure-play-sheet"/);
 assert.match(html,/data-adventure-sheet-tab="stats"/);
 assert.match(app,/if\(session\?\.status!=='playing'/,
  'allocation refuses sessions which are not in play');
 assert.match(app,/const changed=allocateAdventureStatPointsV1\(\{/,
  'one Core contract remains authoritative for stat points');
 assert.match(app,/play\.refreshParty\(changed\)/,
  'in-game official Exploration party is refreshed');
 assert.match(view,/onAllocate:tab==='stats'\?onAllocate:null/,
  'only game sheet stats tab provides allocation buttons');
});
