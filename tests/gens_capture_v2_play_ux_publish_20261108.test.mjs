import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const published='_site/preview/capture-v2-pr225/';
const file=relative=>read(published+relative);
const pin=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));

test('the ONE real GenSRPG Pages build publishes the complete team and title controls',()=>{
 const html=file('assets/gensrpg/capture-v2/adventure.html');
 const app=file('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const contract=file('assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
 const sheet=file('assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs');
 const view=file('assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs');
 for(const id of ['adventure-play-frame','adventure-return-title',
  'adventure-move-speed','adventure-move-speed-value','adventure-play-sheet'])
  assert.ok(html.includes('id="'+id+'"'),id+' absent from real assembled Pages');
 assert.match(app,/gensrpg\\.capture\\.v2\\.save-and-title\\.v1/);
 assert.match(app,/GensCaptureV2/);
 assert.match(app,/gensrpg\\.capture\\.v2\\.party-refresh\\.v1/);
 assert.match(app,/url\\.searchParams\\.set\\('moveSpeed'/);
 assert.match(contract,/export function moveAdventurePartyMemberV1/);
 assert.match(contract,/export function allocateAdventureStatPointsV1/);
 assert.match(contract,/availableAdventureStatPointsV1\\(session,instanceId=null\\)/);
 assert.match(sheet,/selectedInstanceId/);
 assert.match(view,/onSelectCreature/);
 assert.match(view,/onMoveCreature/);
 assert.match(view,/onMakeActive/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/,
  'pregame must not show unspent combat stats');
});

test('Explorer owns the SAME native Portal, loading overlay, movement and title return',()=>{
 const native=file('vendor/exploration-lab/src/sculpt-lab-main.js');
 const html=file('vendor/exploration-lab/sculpt-lab.html');
 assert.match(html,/id="play-area-loading"/);
 assert.match(native,/sculptPortalLoading/);
 assert.match(native,/applyPortalTransition/);
 assert.match(native,/moveSpeed/);
 assert.match(native,/gensrpg\\.exploration\\.play\\.return-title\\.v1/);
 assert.match(native,/gensrpg\\.capture\\.v2\\.save-and-title\\.v1/);
 assert.match(native,/gensrpg\\.capture\\.v2\\.party-refresh\\.v1/);
});

test('publisher source is immutable Capture with certified current Exploration, no new source authority',()=>{
 assert.equal(pin.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(pin.repository,'slyen4425-cloud/Zombicide-40k');
 assert.match(pin.sha,/^[a-f0-9]{40}$/);
 const provenance=JSON.parse(file('release-provenance.v1.json'));
 const pins=JSON.parse(file('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(provenance.source.commit,pin.sha);
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'7a4f4b3e198e6fe3b5707c4b5b6dfed5d17007b9');
 assert.equal(pins.exploration.certifiedCiRun,42462411801);
 assert.equal(provenance.exploration.sha,pins.exploration.sha);
 assert.equal(provenance.combat.sha,pins.combat.sha);
});
