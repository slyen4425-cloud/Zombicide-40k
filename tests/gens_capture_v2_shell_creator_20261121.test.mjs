import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 normalizeCaptureShellCreatorSettingsV1,
 captureShellCreatorSettingsKeyV1,
 validateCaptureShellMediaV1,CAPTURE_SHELL_MEDIA_SLOTS_V1
} from '../assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs';
import {
 captureArtUniverseIdV1,LEGACY_CAPTURE_ART_UNIVERSE_ID_V1,
 CAPTURE_LOADING_SCENES_V1
} from '../assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs';
const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const read=n=>readFileSync(new URL(n,root),'utf8');

test('Creator is a real fourth top-level Capture menu and never owns the game iframe',()=>{
 const shell=read('shell-entry-v1.js'),css=read('shell-style-v1.css');
 assert.match(shell,/creator\.textContent="Créateur"/);
 assert.match(shell,/nav\.append\(play,editing,creator,change\)/);
 assert.match(shell,/function showCreator\(\)/);
 assert.match(shell,/createCaptureShellCreatorV1/);
 assert.match(shell,/host\.dataset\.menu='creator'/);
 assert.match(css,/data-menu="creator"/);
 assert.match(css,/gensCaptureV2CreatorPanel/);
 assert.doesNotMatch(shell,/creator:\{label:.*family:"combat"/);
 assert.doesNotMatch(shell,/new Audio\(/);
});
test('universe-scoped settings reject unsupported fields and unsafe values',()=>{
 const defaults=normalizeCaptureShellCreatorSettingsV1({});
 assert.equal(defaults.menuVolume,35);
 assert.equal(defaults.interfaceVolume,55);
 assert.equal(defaults.ambienceEnabled,false,'no unexpected autoplay in new worlds');
 assert.equal(defaults.backgroundShade,55);
 assert.ok(Object.isFrozen(defaults));
 const id='unv_12345678-aaaa';
 assert.notEqual(captureShellCreatorSettingsKeyV1(id),
  captureShellCreatorSettingsKeyV1('monster-invoc'));
 assert.equal(captureArtUniverseIdV1(),LEGACY_CAPTURE_ART_UNIVERSE_ID_V1);
 assert.throws(()=>captureArtUniverseIdV1('../other'),/Univers/);
 assert.throws(()=>normalizeCaptureShellCreatorSettingsV1({
  menuVolume:130}),/Volume/);
 assert.throws(()=>normalizeCaptureShellCreatorSettingsV1({
  combatMusic:'secret'}),/invalides/);
});
test('interface media imports are local, bounded and separate from the in-game soundtrack',()=>{
 assert.deepEqual(CAPTURE_SHELL_MEDIA_SLOTS_V1,
  ['background','ambience','click','confirm','back','error']);
 assert.equal(validateCaptureShellMediaV1('background',{
  type:'image/png',size:5000,name:'mon-fond.png'}),true);
 assert.equal(validateCaptureShellMediaV1('click',{
  type:'audio/mpeg',size:333,name:'clic.mp3'}),true);
 assert.throws(()=>validateCaptureShellMediaV1('background',{
  type:'audio/mpeg',size:5000}),/Fond/);
 assert.throws(()=>validateCaptureShellMediaV1('ambience',{
  type:'audio/mpeg',size:22*1024*1024}),/Son/);
 assert.throws(()=>validateCaptureShellMediaV1('combat',{
  type:'audio/mpeg',size:4}),/média/i);
 const owner=read('shell-creator-presentation-v1.mjs');
 assert.match(owner,/createAdventureLoadingArtLibraryV1/);
 assert.match(owner,/universeId:universe/);
 assert.match(owner,/root\.localStorage/);
 assert.match(owner,/indexedDB\.open\(DB,1\)/);
 assert.match(owner,/leaveHome\(\)/);
 assert.match(owner,/stopAmbient\(\)/);
 assert.doesNotMatch(owner,/\bimport\s*\{[^}]*?(?:AdventureRules|CombatResult|createAdventureSessionV1)/);
});
test('loading art uses the canonical three-scene library scoped to each universe',()=>{
 const library=read('adventure-loading-art-v1.mjs');
 const game=read('adventure-app-v1.mjs'),shell=read('shell-entry-v1.js');
 assert.deepEqual(CAPTURE_LOADING_SCENES_V1,['launch','zone','combat']);
 assert.match(library,/r\.universeId\?\?LEGACY_CAPTURE_ART_UNIVERSE_ID_V1/);
 assert.match(library,/universeId:universe/);
 assert.match(library,/MAX_PER_SCENE=12/);
 assert.match(game,/universeId:selectedUniverseId\?\?'monster-invoc'/);
 assert.match(shell,/universeId:selectedUniverse\?\.id\?\?'monster-invoc'/);
 assert.match(shell,/mountCaptureLoadingArtCrossfadeV1/);
 assert.doesNotMatch(library,/localStorage/);
});
