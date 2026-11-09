import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const site=path=>read('_site/preview/capture-v2-pr225/'+path);

test('physical Capture Pages XP/fullscreen release uses exactly one immutable source pin',()=>{
 const pin=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));
 const proven=JSON.parse(site('release-provenance.v1.json'));
 const official=JSON.parse(site('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(proven.source.commit,pin.sha,'preview source SHA must equal publisher authority');
 assert.equal(official.combat.ref,'main');
 assert.equal(official.exploration.ref,'main');
 assert.match(official.combat.sha,/^[a-f0-9]{40}$/);
 assert.match(official.exploration.sha,/^[a-f0-9]{40}$/);
});

test('physically staged shell owns fullscreen and Sac remains above real Exploration iframe',()=>{
 const shell=site('assets/gensrpg/capture-v2/shell-entry-v1.js');
 const app=site('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const html=site('assets/gensrpg/capture-v2/adventure.html');
 assert.match(shell,/requestGameFullscreen/);
 assert.match(shell,/gameFullscreenActive/);
 assert.match(app,/shell\.requestGameFullscreen\(\)/,
  'launch must reach the official four-module Shell instead of stealing fullscreen');
 assert.match(app,/\$\('adventure-play'\)\.addEventListener\('click',[\s\S]*?void requestAdventureFullscreen\(\);[\s\S]*?const selectedWorldId/,
  'fullscreen must be requested during the actual game-entry tap, before async world selection');
 assert.match(html,/id="adventure-open-sheet"/);
 assert.match(html,/id="adventure-play-frame"[^>]*allow="autoplay" hidden/);
 assert.doesNotMatch(html,/id="adventure-play-frame"[^>]*allowfullscreen/,
  'native Exploration cannot cover parent Sac with a competing fullscreen layer');
});

test('physical play uses configured 1–6 team XP, persists exact per-instance gains and result view',()=>{
 const contract=site('assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
 const app=site('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const html=site('assets/gensrpg/capture-v2/adventure.html');
 const view=site('assets/gensrpg/capture-v2/adventure-result-presentation-v1.mjs');
 assert.match(contract,/distribution:'all'/,
  'showcase/new game must use shared XP, preserving legacy active settings separately');
 assert.match(contract,/const recipients=state\.rules\.xp\.distribution==='all'/);
 assert.match(contract,/const shares=new Map\(/);
 assert.match(contract,/memberXp/);
 assert.match(app,/distribution:\$\(idField\.distribution\)\.value/);
 assert.match(html,/id="adventure-xp-distribution"/);
 assert.match(view,/saved\.memberXp/);
 assert.match(view,/xpRows/);
});
