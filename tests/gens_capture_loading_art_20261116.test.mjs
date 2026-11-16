import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureLoadingArtSequenceV1,CAPTURE_LOADING_SCENES_V1}
 from '../assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs';
const read=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');

test('one authored image library has separate launch, zone and combat scenes',()=>{
 assert.deepEqual(CAPTURE_LOADING_SCENES_V1,['launch','zone','combat']);
 const html=read('adventure.html');
 assert.match(html,/id="adventure-loading-art-editor"/);
 assert.match(html,/id="adventure-loading-art-files"/);
 for(const scene of CAPTURE_LOADING_SCENES_V1)
  assert.match(html,new RegExp('<option value="'+scene+'">'));
 const source=read('adventure-app-v1.mjs');
 assert.match(source,/prepareLoadingArtworkForPlay/);
 assert.match(source,/searchParams\.set\('loadingArtZone'/);
 assert.match(source,/searchParams\.set\('loadingArtCombat'/);
 assert.doesNotMatch(source,/new Audio\(/);
});
test('rotation preserves owned input without extra media copies',()=>{
 const art=Object.freeze(['blob:https://gensrpg.test/a','blob:https://gensrpg.test/b',
  'blob:https://gensrpg.test/c']);
 assert.deepEqual(captureLoadingArtSequenceV1(art,0),art);
 assert.deepEqual(captureLoadingArtSequenceV1(art,1),[art[1],art[2],art[0]]);
 assert.deepEqual(captureLoadingArtSequenceV1(art,4),[art[1],art[2],art[0]]);
 assert.deepEqual(captureLoadingArtSequenceV1([],0),[]);
 assert.throws(()=>captureLoadingArtSequenceV1(['https://evil.test/image.png'],0));
});
test('closing reward summary signals real Exploration owner to release official soundtrack',()=>{
 const source=read('adventure-app-v1.mjs');
 assert.match(source,/adventure-result-dialog'\)\.addEventListener\('close'/);
 assert.match(source,/gensrpg\.capture\.combat\.result-dismissed\.v1/);
 assert.doesNotMatch(source,/document\.querySelectorAll\('audio'/);
});
