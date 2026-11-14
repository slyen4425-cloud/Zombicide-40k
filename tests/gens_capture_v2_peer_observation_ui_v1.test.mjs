import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('online room surfaces server-derived remote positions without editing Exploration checkpoint',()=>{
 const app=src('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const html=src('assets/gensrpg/capture-v2/adventure.html');
 const css=src('assets/gensrpg/capture-v2/adventure-style-v1.css');
 assert.match(app,/onPositions:\s*updateCaptureRemotePositions/);
 assert.match(app,/function updateCaptureRemotePositions\(/);
 assert.match(app,/function renderCaptureRemotePositions\(/);
 assert.match(app,/captureRemotePositions\.clear\(\)/);
 assert.match(html,/id="adventure-room-positions"/);
 // Room information still exists in the canonical pre-game network panel,
 // but is no longer drawn as an unnecessary map overlay.
 assert.doesNotMatch(html,/id="adventure-play-remote-status"/);
 assert.doesNotMatch(css,/#adventure-play-remote-status/);
 const begin=app.indexOf('function updateCaptureRemotePositions(');
 const end=app.indexOf('async function connectCaptureRoom(',begin);
 assert.ok(begin>0&&end>begin);
 const body=app.slice(begin,end);
 assert.doesNotMatch(body,/localStorage|sessionStorage|indexedDB|Storage\.prototype/);
 assert.doesNotMatch(body,/\.save\(|writeAdventure|createNewExplorationPlay|postMessage\(/);
 assert.doesNotMatch(body,/z40k/);
});
test('the network room panel distinguishes positions from avatars without cluttering Jouer',()=>{
 const html=src('assets/gensrpg/capture-v2/adventure.html');
 assert.match(html,/Positions reçues/);
 assert.match(html,/pas encore affichés|affichage des avatars/i);
});
