import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {releasePreviewPwaForCommit} from '../tools/capture_v2_pwa_release.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const originalWorker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const sample='<meta name="z40k-app-version" content="16.168-DUNGEON-HERO-ITEM-ASSETS">\n'+
 'const Z40K_APP_VERSION = "16.168-DUNGEON-HERO-ITEM-ASSETS";';
const a='a'.repeat(40),b='b'.repeat(40);

test('RED: same immutable Capture source, different GenSRPG deployments always install a new preview worker and page',()=>{
 const first=releasePreviewPwaForCommit(originalWorker,sample,a);
 const second=releasePreviewPwaForCommit(originalWorker,sample,b);
 assert.equal(first.cacheName,'gensrpg-preview-capture-v2-aaaaaaaaaaaa');
 assert.equal(second.cacheName,'gensrpg-preview-capture-v2-bbbbbbbbbbbb');
 assert.notEqual(first.worker,second.worker);
 assert.notEqual(first.html,second.html);
 assert.match(first.html,/z40k-app-version" content="gensrpg-release-aaaaaaaaaaaa"/);
 assert.match(second.html,/const Z40K_APP_VERSION = "gensrpg-release-bbbbbbbbbbbb";/);
 assert.match(first.worker,/name\.startsWith\("gensrpg-preview-capture-v2-"\)&&name!==CACHE_NAME/);
 assert.doesNotMatch(first.worker,/name\.startsWith\("gensrpg-cache-"\)&&name!==CACHE_NAME/);
});

test('refuse floating refs, duplicate cache owners and inconsistent HTML release markers',()=>{
 for(const sha of ['main','abc','0'.repeat(39),'Z'.repeat(40)])
  assert.throws(()=>releasePreviewPwaForCommit(originalWorker,sample,sha),/SHA|commit|release/i);
 assert.throws(()=>releasePreviewPwaForCommit(originalWorker,'<html></html>',a),/version|marker/i);
 assert.throws(()=>releasePreviewPwaForCommit(originalWorker+'const CACHE_NAME = "gensrpg-cache-copy";',sample,a),/cache|owner/i);
});

test('actual assembled preview uses GitHub Pages publisher SHA, not the pinned source SHA',async()=>{
 const sha=process.env.GITHUB_SHA;
 assert.match(sha||'',/^[a-f0-9]{40}$/);
 const trial=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site','preview/capture-v2-pr225');
 const sw=fs.readFileSync(path.join(trial,'service-worker.js'),'utf8');
 const html=fs.readFileSync(path.join(trial,'index.html'),'utf8');
 const manifest=JSON.parse(fs.readFileSync(path.join(trial,'manifest.webmanifest'),'utf8'));
 const provenance=JSON.parse(fs.readFileSync(path.join(trial,'release-provenance.v1.json'),'utf8'));
 const cache='gensrpg-preview-capture-v2-'+sha.slice(0,12);
 assert.ok(sw.includes('const CACHE_NAME = "'+cache+'";'));
 assert.ok(html.includes('<meta name="z40k-app-version" content="gensrpg-release-'+sha.slice(0,12)+'">'));
 assert.ok(html.includes('const Z40K_APP_VERSION = "gensrpg-release-'+sha.slice(0,12)+'";'));
 assert.equal(provenance.publisherCommit,sha);
 assert.match(html,/reg\.waiting\.postMessage\(\{type:'SKIP_WAITING'\}\)/,
   'installed preview must activate any already waiting release automatically');
 assert.match(html,/worker\.postMessage\(\{type:'SKIP_WAITING'\}\)/,
   'installed preview must activate a new worker as soon as it installs');
 assert.equal(manifest.id,'./');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.start_url,'./');
 let activation,waited;
 const removed=[];
 vm.runInNewContext(sw,{self:{
  addEventListener(name,handler){if(name==='activate')activation=handler},
  skipWaiting(){},clients:{claim:async()=>{}},
  registration:{scope:'https://example.github.io/Zombicide-40k/preview/capture-v2-pr225/'}
 },caches:{
  keys:async()=>[cache,'gensrpg-cache-release-root','gensrpg-preview-capture-v2-older'],
  delete:async name=>{removed.push(name);return true}
 },console});
 activation({waitUntil(promise){waited=promise}});
 await waited;
 assert.deepEqual(removed,['gensrpg-preview-capture-v2-older'],
   'preview update cannot delete the installed root app cache');
});
test('one publisher and HTTPS proof must require the exact preview release SHA',()=>{
 const flow=fs.readFileSync(path.join(root,'.github/workflows/main.yml'),'utf8');
 assert.match(flow,/release\.publisherCommit!==process\.env\.GITHUB_SHA/);
 assert.match(flow,/node --test tests\/gens_capture_v2_auto_update_20261107\.test\.mjs/);
 const stage=fs.readFileSync(path.join(root,'tools/stage_capture_v2_pages_preview.mjs'),'utf8');
 assert.match(stage,/process\.env\.GITHUB_SHA/);
});

test('preview worker requests skipWaiting before precache and holds activation in install lifetime',()=>{
 const worker=releasePreviewPwaForCommit(originalWorker,sample,a).worker;
 const install=worker.match(/self\.addEventListener\("install",event=>\{([^\n]+)\}\);/)?.[1];
 assert.ok(install,'the actual source has one installed worker authority');
 assert.match(install,/event\.waitUntil\(\(async\(\)=>\{await self\.skipWaiting\(\);const cache=await caches\.open\(CACHE_NAME\)/);
 assert.ok(install.indexOf('await self.skipWaiting()')<
  install.indexOf('for(const file of CORE_FILES)'),
  'activation request must not be blocked by the 140-resource precache');
 assert.match(worker,/name\.startsWith\("gensrpg-preview-capture-v2-"\)/);
 assert.doesNotMatch(worker,/name\.startsWith\("gensrpg-cache-"\)&&name!==CACHE_NAME/);
});
