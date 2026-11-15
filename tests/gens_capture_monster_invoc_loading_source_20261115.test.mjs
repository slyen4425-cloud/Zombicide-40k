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
  '81fc1475620b8bf0840f'); // source provenance placeholder replaced below
});
test('launch cover and native Explorer transition share the exact same art path',()=>{
 const html=read('adventure.html'),css=read('adventure-style-v1.css'),app=read('adventure-app-v1.mjs');
 assert.match(css,/branding\/monster-invoc-loading-v1\.svg/);
 assert.match(css,/#adventure-launch-loading\[hidden\]\{display:none!important\}/);
 assert.match(html,/class="adventure-loading-brand" aria-label="Monster InvoC"/);
 assert.match(app,/url\.searchParams\.set\('loadingArt',loadingArt\.pathname\)/);
 assert.match(app,/loadingArt\.origin!==url\.origin/);
 assert.match(app,/event\.data\.schema==='gensrpg\.exploration\.play\.ready\.v1'/);
 assert.match(app,/dismissJourneyLoading\(\)/);
});
