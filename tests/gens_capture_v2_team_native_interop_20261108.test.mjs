import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('official source pin proves native Exploration owns loading, speed and title return',()=>{
 const pins=JSON.parse(read('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(pins.exploration.repository,
  'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.match(pins.exploration.sha,/^[a-f0-9]{40}$/);
 assert.ok(pins.exploration.certifiedCiRun>0);
 const native=read('_site/vendor/exploration-lab/src/sculpt-lab-main.js');
 const html=read('_site/vendor/exploration-lab/sculpt-lab.html');
 const game=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(html,/id="play-area-loading"/);
 assert.match(native,/sculptPortalLoading/);
 assert.match(native,/requestAnimationFrame/);
 assert.match(native,/moveSpeed/);
 assert.match(native,/gensrpg\.exploration\.play\.return-title\.v1/);
 assert.match(native,/gensrpg\.capture\.v2\.save-and-title\.v1/);
 assert.match(native,/gensrpg\.capture\.v2\.party-refresh\.v1/);
 assert.match(game,/url\.searchParams\.set\('moveSpeed'/);
 assert.match(game,/gensrpg\.capture\.v2\.party-refresh\.v1/);
 assert.match(game,/gensrpg\.capture\.v2\.save-and-title\.v1/);
 assert.doesNotMatch(game,/new (?:Exploration|Movement|Combat)Runtime\(/,
  'Game consumes the official Lab, never a parallel movement/combat engine');
});
test('scoped Android Adventure reloads the exact official Exploration Combat bundle without stale CacheStorage',()=>{
 const native=read('_site/vendor/exploration-lab/src/sculpt-lab-main.js');
 const loader=read('_site/vendor/exploration-lab/src/capture/capture-showcase-encounter-source-v1.js');
 assert.match(native,/sculptPlayRequested&&playOptions/,
  'fresh author request must be limited to the true game session');
 assert.match(native,/releaseLoadId:window\.crypto\.randomUUID\(\)/);
 assert.match(loader,/url\.searchParams\.set\('_gens_capture_release',releaseLoadId\)/);
 assert.match(loader,/releaseLoadId===null\?'force-cache':'no-store'/);
 assert.match(native,/readScopedAdventurePublishedEncountersV1/,
  'strict author+engine SHA validation must remain in native Exploration');
});

