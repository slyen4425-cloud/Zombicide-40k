import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {captureLoadingArtSequenceV1} from '../assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const shell=file('assets/gensrpg/capture-v2/shell-entry-v1.js');
const app=file('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
const html=file('assets/gensrpg/capture-v2/adventure.html');
const css=file('assets/gensrpg/capture-v2/shell-style-v1.css');
const library=file('assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs');

test('the player has ONE loading image gallery across all old scene categories',()=>{
 assert.doesNotMatch(html,/id="adventure-loading-art-scene"/);
 assert.match(html,/Une seule galerie pour tous les chargements/);
 assert.match(app,/const entries=await \(await loadingArtLibrary\(\)\)\.list\(\);/);
 assert.match(app,/const entries=\(await library\.list\(\)\)\.slice\(0,12\)/);
 assert.match(app,/for\(const scene of \['launch','zone','combat'\]\)scenes\[scene\]=sequence/);
 assert.match(library,/if\(\(await library\.list\(\)\)\.length\+selected\.length>MAX_PER_SCENE\)/);
 assert.deepEqual(captureLoadingArtSequenceV1(['blob:one','blob:two'],1),['blob:two','blob:one']);
});

test('Shell covers Bestiary, editors and Adventure only until the real native document load',()=>{
 assert.match(shell,/bestiary:\{label:"Bestiaire"/);
 assert.match(shell,/function showNativeLoading\(nativeFrame,label\)/);
 assert.match(shell,/stage\.replaceChildren\(frame\);\s*showNativeLoading\(frame,info\.label\);\s*frame\.src=url\.href/);
 assert.match(shell,/nativeFrame\.addEventListener\('load'/);
 assert.match(shell,/root\.requestAnimationFrame/);
 assert.match(shell,/function home\(\)\{\s*if\(!host\)return false;\s*dismissNativeLoading\(\)/);
 assert.match(shell,/function stop\(\)\{\s*if\(!host\)return false;\s*dismissNativeLoading\(\)/);
 assert.match(shell,/state\.crossfade\?\.dispose\(\)/);
 assert.match(css,/#gensCaptureV2Root\[data-native-loading="true"\]/);
 assert.match(css,/background-size:contain/);
 assert.doesNotMatch(shell,/MutationObserver|stopImmediatePropagation/);
});

test('Aventure respects native readiness and drops the fading timer on dismiss',()=>{
 assert.match(app,/journeyLoadingCrossfade\?\.dispose\(\);journeyLoadingCrossfade=null/);
 assert.match(app,/mountCaptureLoadingArtCrossfadeV1/);
 assert.match(app,/scenes\.launch,documentRef:document,windowRef:window/);
 assert.match(app,/gensrpg\.exploration\.play\.ready\.v1/);
 assert.doesNotMatch(app,/setInterval\(/);
});

test('the edited scripts remain syntactically valid in Node',()=>{
 for(const path of [
  'assets/gensrpg/capture-v2/shell-entry-v1.js',
  'assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  'assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs'
 ])execFileSync(process.execPath,['--check',new URL('../'+path,import.meta.url).pathname]);
});


test('Monster InvoC loading art is scoped to Capture, never the Dungeon module',()=>{
 // The official four-mode launcher remains the sole module router.
 assert.match(shell,/if\(shell\.activeModule\(\)!=="capture"\)return false/);
 assert.match(shell,/shell\.register\("capture",start\)/);
 assert.match(shell,/host\.id="gensCaptureV2Root"/);
 // The image veil is created only inside that Capture-owned Shell and its iframe.
 assert.match(shell,/const overlay=root\.document\.createElement\('div'\);\s*overlay\.className='gensCaptureV2Loading'/);
 assert.match(shell,/stage\.append\(overlay\)/);
 assert.match(css,/#gensCaptureV2Root \.gensCaptureV2Loading\{/);
 assert.match(css,/#gensCaptureV2Root \[data-native-loading="true"\]/);
 // Never introduce a generic root PWA/Dungeon loading override.
 assert.doesNotMatch(shell,/GensDungeon|startModuleSession\("dungeon"\)|document\.body\.append\(overlay\)/);
 assert.doesNotMatch(css,/(?:^|\n)\s*(?:body|html|#gensDungeon)[^{]*\.gensCaptureV2Loading\{/);
});
