// #553 PWA handoff: assert the ACTUAL assembled vendor files, not a fake
// in-memory Lab sample. This file runs only after the two certified SHA checkouts
// and the ONE native staging process. It never owns Supabase or gameplay.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source='assets/gensrpg/capture-v2/';
const staged='_site/';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pins=JSON.parse(read(source+'source-pins-v1.json'));
const delivery=JSON.parse(read(staged+source+'delivery-manifest.json'));

test('#553: the assembled PWA source uses precisely both certified main SHA pins',()=>{
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(delivery.combat.sha,pins.combat.sha);
 assert.equal(delivery.exploration.sha,pins.exploration.sha);
 assert.equal(delivery.combat.ref,'main');
 assert.equal(delivery.exploration.ref,'main');
 assert.equal(delivery.legacyCaptureRuntime,false);
 assert.ok(Number.isSafeInteger(pins.combat.certifiedCiRun));
 assert.ok(Number.isSafeInteger(pins.exploration.certifiedCiRun));
});
test('#553: real staged Exploration main owns online 120ms checkpoints and stop pose',()=>{
 const play=read(staged+'vendor/exploration-lab/src/sculpt-lab-main.js');
 const visual=read(staged+'vendor/exploration-lab/src/play/exploration-peer-visual-projection-v1.js');
 assert.match(play,/time-playLastCheckpointAt>\\(playOptions\\?\\.sessionId\\?120:1500\\)/);
 assert.match(play,/else if\\(navActor\\.moving\\)\\s*\\{[\\s\\S]{0,260}persistPlayNavigationCheckpoint\\(\\)/);
 assert.match(play,/sculptPeerProjection\\.sampleForArea\\(sculptWorldAreaId\\)/);
 assert.match(play,/sculptPeerProjection\\?\\.isAnimating\\(sculptWorldAreaId,time\\)/);
 assert.match(visual,/MIN_BLEND_MS=140,MAX_BLEND_MS=340/);
 assert.match(visual,/MAX_CONTINUOUS_STEP=240/);
 assert.doesNotMatch(visual,/new WebSocket|localStorage\\.|sessionStorage\\./);
});
test('#553: exact Capture runtime still owns one authenticated transport and reconnect hook',()=>{
 const transport=read(source+'adventure-multiplayer-transport-v1.mjs');
 const bridge=read(source+'adventure-multiplayer-exploration-events-v1.mjs');
 const app=read(source+'adventure-app-v1.mjs');
 assert.match(transport,/client\\.rpc\\('gensrpg_capture_report_position'/);
 assert.match(transport,/wakePositionReaders\\(id\\)/);
 assert.match(transport,/client\\.realtime\\.setAuth/);
 assert.match(transport,/readScopedPeerPositions/);
 assert.match(bridge,/gensrpg\\.exploration\\.play\\.navigation-committed\\.v1/);
 assert.match(bridge,/retryPending\\(\\)/);
 assert.match(app,/activeCaptureExplorationEvents\\?\\.retryPending\\(\\)/);
 assert.doesNotMatch(bridge,/setInterval\\(|new WebSocket|localStorage\\./);
 assert.doesNotMatch(transport,/z40k_sync_state|new WebSocket|setInterval\\(/);
});
