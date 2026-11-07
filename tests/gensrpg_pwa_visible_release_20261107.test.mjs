import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stampShellForCommit} from '../tools/version_pwa_release_worker.mjs';

const original=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a='a'.repeat(40), b='b'.repeat(40);
const version=sha=>'gensrpg-release-'+sha.slice(0,12);
const meta=html=>[...html.matchAll(/<meta name="z40k-app-version" content="([^"]+)">/g)].map(m=>m[1]);
const runtime=html=>[...html.matchAll(/const Z40K_APP_VERSION = "([^"]+)";/g)].map(m=>m[1]);

test('RED: immutable Pages SHA updates BOTH root version identifiers; source stays intact',()=>{
  const before=original;
  assert.equal(meta(before).length,1);
  assert.deepEqual(meta(before),runtime(before),'preexisting meta and runtime version must agree');
  const first=stampShellForCommit(before,a),second=stampShellForCommit(before,b);
  assert.deepEqual(meta(first),[version(a)]);
  assert.deepEqual(runtime(first),[version(a)]);
  assert.deepEqual(meta(second),[version(b)]);
  assert.deepEqual(runtime(second),[version(b)]);
  assert.notEqual(first,second);
  assert.equal(original,before,'source index and all saved user data stay untouched');
  assert.equal(first.replaceAll(version(a),meta(before)[0]),before,
    'only the TWO existing version markers may change, not Shell, Capture or scripts');
});

test('missing/duplicated/contradictory version markers or floating ref fail closed',()=>{
  assert.throws(()=>stampShellForCommit(original,'main'),/sha|commit|version/i);
  assert.throws(()=>stampShellForCommit(original.slice(0,100),a),/marker|version/i);
  assert.throws(()=>stampShellForCommit(original+'\n<meta name="z40k-app-version" content="duplicated">',a),/marker|version/i);
  assert.throws(()=>stampShellForCommit(original.replace('const Z40K_APP_VERSION = "',
    'const Z40K_APP_VERSION = "mismatched-'),a),/marker|version/i);
});

test('installed previous version detects a fresh Pages version and shows the existing update banner',async()=>{
  const old=stampShellForCommit(original,a),fresh=stampShellForCommit(original,b);
  const from=old.indexOf('const Z40K_APP_VERSION = ');
  const to=old.indexOf('/* Ancien ajout automatique',from);
  assert.ok(from>0&&to>from,'real existing PWA updater must be present');
  const code=old.slice(from,to);
  let shown=false;
  const banner={classList:{add(name){if(name==='show')shown=true;},remove(name){if(name==='show')shown=false;}}};
  const sandbox={URL,Date,console,navigator:{},window:{location:{href:'https://example.invalid/Zombicide-40k/'},addEventListener(){}},
    document:{getElementById(id){return id==='z40kUpdateBanner'?banner:null;}},
    fetch:async()=>({ok:true,text:async()=>fresh})};
  vm.createContext(sandbox);
  vm.runInContext(code,sandbox);
  await vm.runInContext('z40kCheckPublishedVersion()',sandbox);
  assert.equal(shown,true,'stale installed root must display the existing update control');
});

test('single Pages publisher stamps the public root at build time, never the original index',()=>{
  const flow=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
  assert.match(flow,/node tools\/version_pwa_release_worker\.mjs _site\/service-worker\.js "\$GITHUB_SHA"/);
  assert.match(flow,/node tools\/version_pwa_release_shell\.mjs _site\/index\.html "\$GITHUB_SHA"/);
  assert.match(flow,/node --test tests\/gensrpg_pwa_visible_release_20261107\.test\.mjs/);
});
