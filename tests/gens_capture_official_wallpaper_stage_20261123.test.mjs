import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const site=resolve(process.env.GENSRPG_PAGES_SITE||'_site','preview','capture-v2-pr225');
const relative='vendor/combat-lab/assets/library/capture/';
const root=resolve(site,'assets/gensrpg/capture-v2/');
const expected=[
 ['file_00000000ee088210a7c5cb3bea4d5068.png',2272467,'8b4cf837d74643abf6e7d6246db716691f941222'],
 ['file_0000000090d481f48cc94001c7925590.png',2936672,'f3a8f75eed0d8d0f1f670d343107f53ec9bfc83b'],
 ['raiiven_sous_la_lune_violette.png',2530477,'1bce6ae819d19e64370f65e1f6dc811eb063d2f3']
];
const gitBlob=buffer=>createHash('sha1').update('blob '+buffer.length+String.fromCharCode(0)).update(buffer).digest('hex');
const pin=JSON.parse(readFileSync('tools/capture_v2_pages_preview_pin.json','utf8'));

test('exact visual SHA and exact source release are immutable',()=>{
 assert.match(pin.sha,/^[a-f0-9]{40}$/);
 assert.match(pin.officialVisuals.sha,/^[a-f0-9]{40}$/);
 assert.ok(Number.isInteger(pin.officialVisuals.certifiedCiRun));
});
test('historical Monster InvoC loading image remains physically present',()=>{
 const legacy=resolve(site,relative,'file_0000000089ec81f4a7bdfd03220f487c.png');
 assert.ok(existsSync(legacy),'original image must not be removed by wallpaper expansion');
 assert.equal(gitBlob(readFileSync(legacy)),'787a24def6d8c1865f337ce6d5fd485a7274bf02');
});
test('three new official images are transported byte-exact only once',()=>{
 const report=JSON.parse(readFileSync(resolve(root,'official-art-provenance.v1.json'),'utf8'));
 assert.equal(report.schema,'gensrpg-capture-official-wallpapers-v1');
 assert.equal(report.visualOwner.sha,pin.officialVisuals.sha);
 assert.equal(report.historicalArt.preserved,true);
 assert.equal(report.additions.length,3);
 for(const [filename,size,sha] of expected){
  const rel=relative+filename;
  const data=readFileSync(resolve(site,rel));
  assert.equal(data.length,size,filename);
  assert.equal(gitBlob(data),sha,filename);
  const certified=report.additions.filter(e=>e.file===rel);
  assert.equal(certified.length,1,'one transported file, no duplicate media authority');
  assert.equal(certified[0].sha256,createHash('sha256').update(data).digest('hex'));
 }
});
test('staged creator and launch screens use one official catalogue without replacing author gallery',()=>{
 const lib=readFileSync(resolve(root,'shell-official-art-v1.mjs'),'utf8');
 const creator=readFileSync(resolve(root,'shell-creator-presentation-v1.mjs'),'utf8');
 const shell=readFileSync(resolve(root,'shell-entry-v1.js'),'utf8');
 const game=readFileSync(resolve(root,'adventure-app-v1.mjs'),'utf8');
 assert.ok(lib.includes('captureOfficialLoadingArtUrlsV1'));
 for(const [filename] of expected)assert.ok(lib.includes(filename));
 assert.ok(creator.includes('putVisualChoice'));
 assert.ok(creator.includes('getVisualChoice'));
 assert.ok(shell.includes('officialLoadingArt,...artOwner.captureOfficialLoadingArtUrlsV1().slice(1)'));
 assert.ok(game.includes('...captureOfficialLoadingArtUrlsV1(),...sequence'));
});
