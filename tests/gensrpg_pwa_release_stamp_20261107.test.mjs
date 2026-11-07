import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stampWorkerForCommit} from '../tools/version_pwa_release_worker.mjs';
const original=fs.readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const a='a'.repeat(40),b='b'.repeat(40);
test('RED: each shipped main commit gets its own root cache name; preview namespace never affected',()=>{
  const one=stampWorkerForCommit(original,a),two=stampWorkerForCommit(original,b);
  assert.match(one,/const CACHE_NAME = "gensrpg-cache-release-aaaaaaaaaaaa";/);
  assert.match(two,/const CACHE_NAME = "gensrpg-cache-release-bbbbbbbbbbbb";/);
  assert.notEqual(one,two,'a production release must install a new worker');
  assert.match(one,/name\.startsWith\("gensrpg-cache-"\)&&name!==CACHE_NAME/);
  assert.doesNotMatch(one,/cacheNames\.filter\(name=>name!==CACHE_NAME\)/);
  assert.equal(one.replace('gensrpg-cache-release-aaaaaaaaaaaa',
    original.match(/^const CACHE_NAME = "([^"]+)";/m)[1]),original,
    'stamping must change only the root cache version; not gameplay, SW behavior or saves');
});
test('untrusted ref, malformed worker or multiple version owners must fail closed',()=>{
  for(const sha of ['main','123','ABC'.repeat(13)+'A','0'.repeat(39)])
    assert.throws(()=>stampWorkerForCommit(original,sha),/sha|commit|version/i);
  assert.throws(()=>stampWorkerForCommit(original.replace('const CACHE_NAME =','const UNKNOWN ='),a));
  assert.throws(()=>stampWorkerForCommit(original+'\nconst CACHE_NAME = "gensrpg-cache-copy";',a));
});
test('real Pages builder stamps the published worker, not the checked-in source',()=>{
  const pipeline=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
  assert.match(pipeline,/cp -f service-worker\.js _site\/service-worker\.js/);
  assert.match(pipeline,/node tools\/version_pwa_release_worker\.mjs _site\/service-worker\.js "\$GITHUB_SHA"/);
  assert.match(pipeline,/node --test tests\/gensrpg_pwa_release_stamp_20261107\.test\.mjs/);
});
