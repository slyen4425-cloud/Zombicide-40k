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
 assert.ok(app.includes('gensrpg.capture.v2.save-and-title.v1'));
 assert.match(app,/GensCaptureV2/);
 assert.ok(app.includes('gensrpg.capture.v2.party-refresh.v1'));
 assert.ok(app.includes("url.searchParams.set('moveSpeed'"));
 assert.match(contract,/export function moveAdventurePartyMemberV1/);
 assert.match(contract,/export function allocateAdventureStatPointsV1/);
 assert.ok(contract.includes('availableAdventureStatPointsV1(session,instanceId=null)'));
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
 assert.ok(native.includes('gensrpg.exploration.play.return-title.v1'));
 assert.ok(native.includes('gensrpg.capture.v2.save-and-title.v1'));
 assert.ok(native.includes('gensrpg.capture.v2.party-refresh.v1'));
});

test('publisher source is immutable Capture with certified current Exploration, no new source authority',()=>{
 assert.equal(pin.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(pin.repository,'slyen4425-cloud/Zombicide-40k');
 assert.match(pin.sha,/^[a-f0-9]{40}$/);
 const provenance=JSON.parse(file('release-provenance.v1.json'));
 const pins=JSON.parse(file('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(provenance.source.commit,pin.sha);
 assert.equal(pins.exploration.ref,'main');
 // Historical exact-SHA literals become stale when a new certified main
 // arrives. The versioned source pin + packaged provenance are the authority.
 assert.match(pins.exploration.sha,/^[a-f0-9]{40}$/);
 assert.ok(Number.isInteger(pins.exploration.certifiedCiRun) &&
   pins.exploration.certifiedCiRun>0,'only an explicitly certified Exploration main');
 const native=file('vendor/exploration-lab/src/sculpt-lab-main.js');
 const loader=file('vendor/exploration-lab/src/capture/capture-showcase-encounter-source-v1.js');
 assert.match(native,/sculptPlayRequested&&playOptions/);
 assert.match(native,/releaseLoadId:window\.crypto\.randomUUID\(\)/);
 assert.match(loader,/url\.searchParams\.set\('_gens_capture_release',releaseLoadId\)/);
 assert.match(loader,/releaseLoadId===null\?'force-cache':'no-store'/);
 const battle=file('vendor/exploration-lab/combat-preview/examples/dom-demo/exploration-encounter.js');
 const cacheOwner=file('vendor/exploration-lab/combat-preview/examples/dom-demo/exploration-native-source-v1.js');
 const game=file('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const setup=file('assets/gensrpg/capture-v2/adventure.html');
 const camera=file('vendor/exploration-lab/src/play/exploration-creator-camera-v1.js');
 assert.match(battle,/const scopedReleaseLoadId=encounterSessionId===undefined\?null:window\.crypto\.randomUUID\(\)/,
  'the REAL embedded combat must isolate Android cache, not only overworld entry');
 assert.match(battle,/const request=scopedRequest\(url\)/,
  'combat author bundle and other official JSON load with one scoped boot ID');
 assert.match(battle,/const templateRequest=scopedRequest\('\.\/capture-editor-v2\.html'\)/);
 assert.match(battle,/readScopedAdventurePublishedEncountersV1\(context\)/,
  'retain strict real-game author and engine SHA validation');
 assert.ok(battle.includes("from './exploration-native-source-v1.js'"),
  'one existing packaged Combat native bridge must own the scoped loader');
 assert.match(cacheOwner,/source\.searchParams\.set\('_gens_capture_release',loadId\)/);
 assert.match(cacheOwner,/cache:'no-store'/);
 assert.match(setup,/id="adventure-creator-camera-zoom"/);
 assert.match(setup,/id="adventure-play-team-count"/);
 assert.match(game,/url\.searchParams\.set\('cameraZoom'/);
 assert.match(camera,/export function cameraInitialZoomFromAdventurePlayUrlV1/);
 assert.equal(provenance.exploration.sha,pins.exploration.sha);
 assert.equal(provenance.combat.sha,pins.combat.sha);
});
