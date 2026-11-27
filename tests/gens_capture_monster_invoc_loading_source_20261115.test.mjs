import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const path=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const read=p=>readFileSync(new URL(p,path),'utf8');

test('only one creator image in the Capture owner, original title is depicted in scene',()=>{
 const art=read('branding/monster-invoc-loading-v1.svg');
 const match=art.match(/xlink:href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
 assert.ok(match,'embedded optimized artwork must load without JS or external URL');
 const media=Buffer.from(match[1],'base64');
 assert.equal(media.toString('ascii',0,4),'RIFF');
 assert.equal(media.toString('ascii',8,12),'WEBP');
 assert.equal(media.byteLength,472540,'stable optimized preview size');
 assert.equal(createHash('sha256').update(media).digest('hex'),
  '81fc1475620b8bf0840f061bb3e57f576a73e1f7d81fe13376b799cbddd2021d');
});
test('launch cover and native Explorer transition share the exact same art path',()=>{
 const html=read('adventure.html'),css=read('adventure-style-v1.css'),app=read('adventure-app-v1.mjs');
 assert.ok(css.includes('vendor/combat-lab/assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png'));
 assert.match(css,/#adventure-launch-loading\[hidden\]\{display:none!important\}/);
 assert.match(html,/class="adventure-loading-brand" aria-label="Monster InvoC"/);
 assert.match(app,/activeLoadingImages\.launch\?\.\[0\]\?\?loadingArt\.pathname/);
 assert.match(app,/loadingArtZone/);
 assert.match(app,/loadingArtCombat/);
 assert.match(app,/loadingArt\.origin!==url\.origin/);
 assert.match(app,/event\.data\.schema==='gensrpg\.exploration\.play\.ready\.v1'/);
 assert.match(app,/dismissJourneyLoading\(\)/);
});

test('official transport pins exactly one certified victory MP3 and latest Exploration owner',()=>{
 const pins=JSON.parse(read('source-pins-v1.json'));
 assert.equal(pins.combat.sha,'3e2082ebcc396414c1fbe0c54ac24e0382ddd3b5');
 assert.equal(pins.exploration.sha,'5f684c4d1978522ac7dc1f315fdc5e2aab8048fc');
 assert.equal(pins.combat.ref,'main');assert.equal(pins.exploration.ref,'main');
 assert.equal(pins.combat.certifiedCiRun,45897517488);
 assert.equal(pins.exploration.certifiedCiRun,46036194126);
 assert.equal(pins.legacyCaptureRuntime,false);
 const stage=readFileSync(new URL('../tools/stage_capture_v2_labs.mjs',import.meta.url),'utf8');
 assert.match(stage,/assets\/runtime\/audio\/music-v1\/victory-01-0b52ce2b\.mp3/);
 assert.match(stage,/327d2734bca243c90c3b9f0b6bbf2f93fb78a667fbe380dc1be5486e68e250fe/);
 assert.match(stage,/copy\(victorySource,path\.join\(combatOut,victoryTrack\)\)/);
 assert.match(stage,/787a24def6d8c1865f337ce6d5fd485a7274bf02/);
 assert.doesNotMatch(stage,/copy\(path\.join\(combat,'assets'\)/);
});

test('launch overlay keeps entire Monster InvoC art while filling every viewport',()=>{
 const css=read('adventure-style-v1.css');
 assert.ok(css.includes("background-image:url('../../../vendor/combat-lab/assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png'),url('../../../vendor/combat-lab/assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png')"));
 assert.ok(css.includes('background-size:contain,cover'));
 assert.ok(css.includes('background-image:var(--capture-custom-art),linear-gradient('));
 assert.ok(css.includes('background-size:contain,100% 100%,cover'));
 assert.ok(!css.includes("center 46% / cover no-repeat"),'cropping-only composition must not return');
});
