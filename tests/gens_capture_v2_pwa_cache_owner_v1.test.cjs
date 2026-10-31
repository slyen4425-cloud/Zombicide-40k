'use strict';
// TDD: the installed GenSrpg PWA must pre-cache the single active Capture V2
// shell, never the 27 physically retired Capture V1 runtime scripts.
// Preserves the other three modes and does not cache duplicate Lab runtimes.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const core=sw.match(/const CORE_FILES\s*=\s*\[([\s\S]*?)\];/);
test('PWA install has no retired Capture V1 script in its core pre-cache',()=>{
 assert.ok(core,'actual PWA core list must exist');
 const entries=[...core[1].matchAll(/["']([^"']+)["']/g)].map(m=>m[1]);
 assert.equal(entries.filter(e=>e.startsWith('./assets/gensrpg/capture/')).length,0,
   'PWA cannot pre-cache retired Capture scripts excluded from Pages');
 for(const rel of [
  './assets/gensrpg/core/game-profile-builder-v1.js',
  './assets/gensrpg/capture-v2/identity-v1.js',
  './assets/gensrpg/capture-v2/shell-entry-v1.js',
  './assets/gensrpg/capture-v2/shell-style-v1.css'
 ])assert.equal(entries.filter(e=>e===rel).length,1,'PWA needs exactly one new owner: '+rel);
 for(const rel of [
  './','./index.html',
  './assets/gensrpg/survival/entry-v1.js',
  './assets/gensrpg/dungeon/entry-v1.js'
 ])assert.equal(entries.filter(e=>e===rel).length,1,'preserve independent game: '+rel);
 assert.equal(entries.length,new Set(entries).size,'all PWA core entries unique');
});
test('PWA activates a new versioned V2 cache while keeping same-origin updates and user data',()=>{
 assert.match(sw,/const CACHE_NAME\s*=\s*"gensrpg-cache-[^"]+-capture-v2[^"]*"/);
 assert.match(sw,/self\.addEventListener\("activate"/);
 assert.match(sw,/cacheNames\.filter\(name=>name!==CACHE_NAME\)/);
 assert.match(sw,/request\.mode==="navigate"/);
 assert.match(sw,/fetch\(url\.href,\{cache:"no-store"/);
 assert.doesNotMatch(sw,/(?:indexedDB\.deleteDatabase|localStorage\.clear|caches\.delete\(CACHE_NAME\))/,
  'PWA update may not erase user saves or its active cache');
});
