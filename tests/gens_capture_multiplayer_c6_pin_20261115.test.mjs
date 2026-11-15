import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pins=JSON.parse(load('assets/gensrpg/capture-v2/source-pins-v1.json'));
const app=load('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
const transport=load('assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs');
const relay=load('assets/gensrpg/capture-v2/adventure-multiplayer-peer-frame-relay-v1.mjs');

test('Capture C6 is pinned only to approved GREEN Exploration main',()=>{
 assert.equal(pins.exploration.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.exploration.sha,'b02523be8871013e26340cddd419e0957e798913');
 assert.equal(pins.exploration.certifiedCiRun,43696130743);
 assert.equal(pins.combat.sha,'df1eb2594f125bffcbc69473a1f757434c1ac1d2');
});

test('name and greeting use the one native Exploration peer renderer, never a second DOM player',()=>{
 assert.match(app,/attachCapturePeerFrameRelayV1/);
 assert.match(app,/onGreeting:/);
 assert.match(transport,/capture-peer-greeting-v1/);
 assert.match(relay,/displayName/);
 assert.match(app,/capture\.peer\.greeting\.v1|capture-peer-greeting|peer\.greeting/i);
 assert.doesNotMatch(relay,/document\.createElement|localStorage|indexedDB|new Image\(/);
});

test('remote positions and cosmetics cannot create a second AdventureSave',()=>{
 assert.doesNotMatch(relay,/saveAdventure|setItem|\.rpc\(/);
 assert.match(transport,/client\.from\('gensrpg_capture_peer_positions'\)/);
 assert.match(transport,/on\('broadcast',\{event:'capture-peer-greeting-v1'\}/);
});
