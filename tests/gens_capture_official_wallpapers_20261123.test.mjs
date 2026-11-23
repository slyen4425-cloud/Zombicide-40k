import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAPTURE_OFFICIAL_BACKGROUND_ART_V1,captureOfficialArtByIdV1,
 captureOfficialArtUrlV1,captureOfficialLoadingArtUrlsV1}
 from '../assets/gensrpg/capture-v2/shell-official-art-v1.mjs';

const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');

test('original loading art survives and exactly three new official backgrounds join it',()=>{
 assert.deepEqual(CAPTURE_OFFICIAL_BACKGROUND_ART_V1.map(x=>x.id),
  ['polocendre','givre','raiiven']);
 for(const art of CAPTURE_OFFICIAL_BACKGROUND_ART_V1){
  assert.equal(captureOfficialArtByIdV1(art.assetId),art);
  assert.ok(captureOfficialArtUrlV1(art).endsWith(art.file));
 }
 assert.equal(captureOfficialArtByIdV1('gensrpg:wallpaper:missing'),null);
 assert.throws(()=>captureOfficialArtUrlV1({assetId:'gensrpg:wallpaper:raiiven'}),/inconnue/);
 const images=captureOfficialLoadingArtUrlsV1();
 assert.equal(images.length,4);
 assert.match(images[0],/file_0000000089ec81f4a7bdfd03220f487c\.png$/);
 assert.equal(new Set(images).size,4,'no duplicate wallpaper');
 assert.deepEqual(images.slice(1).map(x=>x.split('/').pop()),
  CAPTURE_OFFICIAL_BACKGROUND_ART_V1.map(x=>x.file));
});

test('Creator keeps author files while persisting only an official selection pointer',()=>{
 const creator=read('shell-creator-presentation-v1.mjs');
 assert.match(creator,/async getVisualChoice\(universeId\)/);
 assert.match(creator,/async putVisualChoice\(universeId,assetId\)/);
 assert.match(creator,/async clearVisualChoice\(universeId\)/);
 assert.match(creator,/media\.putVisualChoice\(universe,art\.assetId\)/);
 assert.match(creator,/await media\.put\(universe,'background',bgInput\.files\[0\]\)/);
 assert.match(creator,/media\.getVisualChoice\(universe\)/);
 assert.match(creator,/const officialUrls=captureOfficialLoadingArtUrlsV1\(\)/);
 assert.match(creator,/root\.URL\.createObjectURL\(image\.blob\)/);
 assert.equal((creator.match(/const STORE='assets',DB=/g)||[]).length,1);
});

test('the existing Shell and all gameplay loading contexts use the same four official images',()=>{
 const shell=read('shell-entry-v1.js'),game=read('adventure-app-v1.mjs');
 assert.match(shell,/\[officialLoadingArt,\.\.\.artOwner\.captureOfficialLoadingArtUrlsV1\(\)\.slice\(1\),\.\.\.urls\]/);
 // Native Exploration accepts blob: URLs for Combat; HTTPS official files must
 // be projected into temporary same-origin blobs, never discarded.
 assert.match(game,/captureOfficialLoadingArtUrlsV1\(\)\.map\(async source=>/);
 assert.match(game,/\[\.\.\.officialBlobs\.filter\(Boolean\),\.\.\.sequence\]\.slice\(0,12\)/);
 assert.match(game,/for\(const scene of \['launch','zone','combat'\]\)/);
 assert.doesNotMatch(shell,/new Audio\(/);
});
