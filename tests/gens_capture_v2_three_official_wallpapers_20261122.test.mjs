import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CAPTURE_OFFICIAL_WALLPAPERS_V1,
 captureOfficialWallpaperByIdV1,captureOfficialWallpaperUrlV1,
 captureOfficialLoadingArtUrlsV1} from '../assets/gensrpg/capture-v2/shell-official-wallpapers-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=rel=>fs.readFileSync(path.join(root,rel),'utf8');
test('three author-approved images share one immutable art catalog',()=>{
 assert.equal(CAPTURE_OFFICIAL_WALLPAPERS_V1.length,3);
 assert.equal(new Set(CAPTURE_OFFICIAL_WALLPAPERS_V1.map(x=>x.id)).size,3);
 assert.equal(new Set(CAPTURE_OFFICIAL_WALLPAPERS_V1.map(x=>x.path)).size,3);
 for(const item of CAPTURE_OFFICIAL_WALLPAPERS_V1){
  assert.match(item.path,/^vendor\/combat-lab\/assets\/library\/capture\/[a-z0-9_]+\.png$/);
  assert.match(item.blobSha,/^[0-9a-f]{40}$/);
  assert.ok(item.bytes>0&&item.bytes<=8*1024*1024);
  assert.equal(captureOfficialWallpaperByIdV1(item.id),item);
  assert.ok(captureOfficialWallpaperUrlV1(item.id).endsWith(item.path));
 }
 assert.equal(captureOfficialWallpaperByIdV1('bad'),null);
 assert.equal(captureOfficialWallpaperUrlV1('bad'),null);
 assert.deepEqual(captureOfficialLoadingArtUrlsV1(),
  CAPTURE_OFFICIAL_WALLPAPERS_V1.map(x=>captureOfficialWallpaperUrlV1(x.id)));
});
test('one Creator owns background selection and existing loading gallery',()=>{
 const creator=src('assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs');
 assert.match(creator,/media\.putCatalog\(universe,'background',art\.id,art\.label\)/);
 assert.match(creator,/captureOfficialWallpaperUrlV1\(record\.assetId\)/);
 assert.match(creator,/const images=await loading\.list\(\)/);
 assert.match(creator,/thumbnail\.src=captureOfficialWallpaperUrlV1\(art\.id\)/);
 assert.match(creator,/media\.put\(universe,'background',bgInput\.files\[0\]\)/);
});
test('all three native transitions and launch/zone/combat share same artwork',()=>{
 const shell=src('assets/gensrpg/capture-v2/shell-entry-v1.js');
 const adventure=src('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(shell,/visualOwner\.captureOfficialLoadingArtUrlsV1\(\)/);
 assert.match(shell,/const artwork=\[\.\.\.urls,\.\.\.visualOwner/);
 assert.match(adventure,/const scenes=\{launch:official,zone:official,combat:official\}/);
 assert.match(adventure,/Object\.freeze\(\[\.\.\.sequence,\.\.\.official\]\)/);
 assert.doesNotMatch(adventure,/new Audio\(/);
});
