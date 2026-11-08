import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fetchOfficialAdventureJsonV1}
 from '../assets/gensrpg/capture-v2/adventure-official-json-v1.mjs';

const BASE='https://example.test/Zombicide-40k/preview/capture-v2-pr225/assets/gensrpg/capture-v2/adventure-app-v1.mjs';
const BODY={schema:'capture-author-encounter-bundle-v1',
 authorSha:'a'.repeat(40),engineSha:'a'.repeat(40)};
test('installed PWA cache-first JSON cannot mix old Combat transfers with current release',async()=>{
 const cache=new Map(),seen=[],keys=['old-cache','fresh-release'];
 const paths=[
  './delivery-manifest.json',
  '../../../vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json',
  '../../../vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json',
  '../../../vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json',
  '../../../vendor/combat-lab/data/combat/skills/catalog.v1.json'
 ];
 // An installed older worker caches JSON by its URL, BEFORE checking no-store.
 for(const relative of paths)
  cache.set(new URL(relative,BASE).href,{stale:true,combat:'b'.repeat(40)});
 const request=async(url,opts)=>{
  seen.push({href:url.href,cache:opts.cache});
  const previous=cache.get(url.href);
  return {ok:true,status:200,json:async()=>previous??{
   fresh:true,combat:'a'.repeat(40),...(/encounter-bundle/.test(url.pathname)?BODY:{})}};
 };
 const old=await request(new URL(paths[1],BASE),{cache:'no-store'});
 assert.equal((await old.json()).stale,true,'real older worker returns old JSON despite no-store');
 const out=await Promise.all(paths.map(p=>fetchOfficialAdventureJsonV1(p,BASE,keys[1],request)));
 assert.ok(out.every(x=>x.fresh===true),'all official inputs bypass cache-first old entries');
 assert.equal(out[1].authorSha,'a'.repeat(40));
 assert.equal(out[1].engineSha,'a'.repeat(40));
 assert.equal(seen.filter(x=>x.href.includes('_gens_capture_load=fresh-release')).length,5);
 assert.ok(seen.every(x=>x.cache==='no-store'));
 const next=await fetchOfficialAdventureJsonV1(paths[1],BASE,'different-release',request);
 assert.equal(next.fresh,true,'a second app boot uses a distinct cache key');
});
test('unavailable or invalid official source fails closed; never tries historical data',async()=>{
 await assert.rejects(
  fetchOfficialAdventureJsonV1('./delivery-manifest.json',BASE,'fresh-release',
   async()=>({ok:false,status:404})),
  /Source officielle indisponible \(HTTP 404\)/);
 await assert.rejects(
  fetchOfficialAdventureJsonV1('./delivery-manifest.json',BASE,'',
   async()=>({ok:true,json:async()=>({})})),/immutable boot key/);
});
test('real Adventure boot uses one new token for all 5 official sources and keeps Combat SHA guards',()=>{
 const source=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(source,/const releaseLoadId=crypto\.randomUUID\(\)/);
 assert.match(source,/fetchOfficialAdventureJsonV1\(\s*relative,import\.meta\.url,releaseLoadId,fetch\)/);
 assert.match(source,/bundle\.authorSha!==delivery\?\.combat\?\.sha/);
 assert.match(source,/bundle\.engineSha!==delivery\.combat\.sha/);
 assert.match(source,/captureBestiaryCardsV1/);
 assert.doesNotMatch(source,/legacyBestiary|fallbackBestiary/);
});
