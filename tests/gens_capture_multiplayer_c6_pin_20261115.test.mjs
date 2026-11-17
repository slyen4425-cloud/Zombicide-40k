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
 assert.equal(pins.exploration.sha,'13bbd8230d8dfcef612586974b2dcb54e18e16c4');
 assert.equal(pins.exploration.certifiedCiRun,44137364939);
 assert.equal(pins.combat.sha,'72cc1b8271b4e83d3014d8f85c7addcd0aa8436e');
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
