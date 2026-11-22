'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const preview=path.join(root,'_site/preview/capture-v2-pr225');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const gitSha=data=>crypto.createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
const proof=JSON.parse(fs.readFileSync(path.join(preview,
 'assets/gensrpg/capture-v2/official-art-provenance-v1.json'),'utf8'));
const pin=JSON.parse(fs.readFileSync(path.join(root,'tools/capture_v2_pages_preview_pin.json'),'utf8'));
test('three exact approved PNGs are transported once and unchanged',()=>{
 assert.equal(proof.schema,'capture-three-approved-wallpapers-v1');
 assert.equal(proof.sourceSha,pin.sha);
 assert.equal(proof.visualsSha,pin.officialVisuals.sha);
 assert.equal(proof.items.length,3);
 assert.equal(new Set(proof.items.map(x=>x.path)).size,3);
 const exact=[
  ['raiiven_sous_la_lune_violette.png','1bce6ae819d19e64370f65e1f6dc811eb063d2f3'],
  ['file_00000000ee088210a7c5cb3bea4d5068.png','8b4cf837d74643abf6e7d6246db716691f941222'],
  ['file_0000000090d481f48cc94001c7925590.png','f3a8f75eed0d8d0f1f670d343107f53ec9bfc83b']
 ];
 for(const [filename,sha] of exact){
  const art=proof.items.find(x=>x.path.endsWith('/'+filename));
  assert.ok(art,'missing '+filename);assert.equal(art.blobSha,sha);
  const data=fs.readFileSync(path.join(preview,art.path));
  assert.equal(data.length,art.size);
  assert.equal(gitSha(data),sha);
  assert.equal(sha256(data),art.sha256);
 }
});
test('official owner reuses the Creator UI and existing loading transitions',()=>{
 const rootDir=path.join(preview,'assets/gensrpg/capture-v2');
 const get=rel=>fs.readFileSync(path.join(rootDir,rel),'utf8');
 assert.match(get('shell-official-wallpapers-v1.mjs'),/CAPTURE_OFFICIAL_WALLPAPERS_V1/);
 assert.match(get('shell-creator-presentation-v1.mjs'),/Choisir une illustration officielle de fond/);
 assert.match(get('adventure-app-v1.mjs'),/captureOfficialLoadingArtUrlsV1/);
 assert.match(get('shell-entry-v1.js'),/visualOwner\.captureOfficialLoadingArtUrlsV1/);
});
