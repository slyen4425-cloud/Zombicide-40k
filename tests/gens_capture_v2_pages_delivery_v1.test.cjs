'use strict';
// Release acceptance for the NEW real Capture entry, never the removed Phase9 Hub.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const combat=path.resolve(process.env.COMBAT_LAB_ROOT||'combat-lab');
const exploration=path.resolve(process.env.EXPLORATION_LAB_ROOT||'exploration-lab');
const pins=JSON.parse(fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/source-pins-v1.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(site,'assets/gensrpg/capture-v2/delivery-manifest.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const source=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const published=rel=>fs.readFileSync(path.join(site,rel),'utf8');
const scripts=html=>[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
test('Capture V2 release uses two exact approved main sources, never a parallel authority',()=>{
 assert.equal(manifest.schema,'gensrpg-capture-v2-main-only-transport-v1');
 assert.equal(manifest.legacyCaptureRuntime,false);
 assert.equal(pins.legacyCaptureRuntime,false);
 for(const [name,folder] of [['combat',combat],['exploration',exploration]]){
  assert.equal(manifest[name].ref,'main');
  assert.equal(pins[name].ref,'main');
  assert.equal(manifest[name].sha,pins[name].sha);
  assert.equal(manifest[name].sha,sha(folder));
  assert.equal(manifest[name].repository,pins[name].repository);
 }
 assert.deepEqual(manifest.featuresDeferred,pins.featuresDeferred);
 assert.ok(manifest.featuresDeferred.includes('encounters'));
 assert.ok(manifest.featuresDeferred.includes('XP'));
});
test('both main-native tools retain their ORIGINAL bytes and browser sources',()=>{
 assert.ok(manifest.transport.length>=8,'missing native author/browser files');
 const visited=new Set();
 for(const record of manifest.transport){
  assert.ok(record.owner==='combat'||record.owner==='exploration');
  assert.ok(record.path.startsWith(pins[record.owner].path));
  assert.ok(!visited.has(record.path),'duplicate owner path');
  visited.add(record.path);
  const rel=record.path.slice(pins[record.owner].path.length);
  const original=fs.readFileSync(path.join(record.owner==='combat'?combat:exploration,rel));
  const copy=fs.readFileSync(path.join(site,record.path));
  assert.equal(record.size,copy.length,record.path);
  assert.equal(record.sha256,hash(copy),record.path);
  assert.deepEqual(copy,original,'no replicated or altered native owner: '+record.path);
 }
 for(const rel of [
  'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
  'vendor/combat-lab/examples/dom-demo/bestiary.html',
  'vendor/combat-lab/src/ui/capture-combat-preview-v1.js',
  'vendor/exploration-lab/index.html',
  'vendor/exploration-lab/builder.html',
  'vendor/exploration-lab/world-assembler.html',
  'vendor/exploration-lab/src/main.js'
 ])assert.ok(visited.has(rel),'missing native contract: '+rel);
});
test('actual Pages root has ONLY Capture V2 entry and its existing four-mode Shell',()=>{
 const page=published('index.html');
 const origin=source('index.html');
 const before=scripts(origin),after=scripts(page);
 for(const list of [before,after]){
  assert.equal(list.filter(s=>/^assets\/gensrpg\/capture\//.test(s)).length,0,
   'legacy Capture script cannot be active in the actual site');
  assert.equal(list.filter(s=>s==='assets/gensrpg/capture-v2/identity-v1.js').length,1);
  assert.equal(list.filter(s=>s==='assets/gensrpg/capture-v2/shell-entry-v1.js').length,1);
 }
 assert.equal(page.includes('id="captureGameHub"'),false);
 assert.ok(page.includes('assets/gensrpg/shell/module-launch-final-authority-v1.js'));
 for(const module of [
  'assets/gensrpg/survival/entry-v1.js',
  'assets/gensrpg/dungeon/entry-v1.js',
  'assets/gensrpg/pvp/shell-composition-v1.js'
 ])assert.ok(after.some(s=>s.startsWith(module)),'unrelated mode lost: '+module);
 assert.ok(!fs.existsSync(path.join(site,'assets/gensrpg/capture/runtime-data')));
 assert.ok(!fs.existsSync(path.join(site,'capture-world-2v2-test.html')));
 assert.ok(!fs.existsSync(path.join(root,'vendor/combat-lab')));
 assert.ok(!fs.existsSync(path.join(root,'vendor/exploration-lab')));
});
test('Capture V2 does not mutate the user PWA cache or persistent profiles',()=>{
 const sw=source('service-worker.js');
 assert.ok(!sw.includes('vendor/combat-lab/'));
 assert.ok(!sw.includes('vendor/exploration-lab/'));
 assert.ok(!sw.includes('assets/gensrpg/capture-v2/delivery-manifest.json'));
 const v2=source('assets/gensrpg/capture-v2/shell-entry-v1.js');
 assert.doesNotMatch(v2,/localStorage|sessionStorage|indexedDB|captureStartBattleAutomatic|captureWorldState|gen(?:s|srpg)_capture_world/i);
 assert.match(v2,/shell\.register\("capture",start\)/);
});
