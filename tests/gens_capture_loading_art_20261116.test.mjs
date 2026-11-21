import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureLoadingArtSequenceV1,CAPTURE_LOADING_SCENES_V1}
 from '../assets/gensrpg/capture-v2/adventure-loading-art-v1.mjs';
const read=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');

test('one authored image library is editable only in Creator, not in game',()=>{
 assert.deepEqual(CAPTURE_LOADING_SCENES_V1,['launch','zone','combat']);
 const html=read('adventure.html');
 assert.doesNotMatch(html,/id="adventure-loading-art-editor"/);
 assert.doesNotMatch(html,/id="adventure-loading-art-files"/);
 const game=read('adventure-app-v1.mjs');
 assert.match(game,/prepareLoadingArtworkForPlay/);
 assert.match(game,/searchParams\.set\('loadingArtZone'/);
 assert.match(game,/searchParams\.set\('loadingArtCombat'/);
 assert.doesNotMatch(game,/refreshLoadingArtEditor|adventure-loading-art-files/);
 const creator=read('shell-creator-presentation-v1.mjs');
 assert.match(creator,/Illustrations de chargement/);
 assert.match(creator,/await loading\.add\('launch',artInput\.files\)/);
 assert.doesNotMatch(creator,/Scène de chargement|scene\.value/);
 const owner=read('adventure-loading-art-v1.mjs');
 assert.match(owner,/const DB_NAME='gensrpg\.capture\.loading-art\.v1'/);
 assert.match(creator,/createAdventureLoadingArtLibraryV1/);
 assert.match(game,/createAdventureLoadingArtLibraryV1/);
 assert.doesNotMatch(game,/new Audio\(/);
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
