const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
function readJson(name){return JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))}
const web=readJson('manifest.webmanifest');
const json=readJson('manifest.json');
for(const m of [web,json]){
  assert.equal(m.name,'GenSrpG');
  assert.equal(m.short_name,'GenSrpG');
  assert.equal(m.start_url,'./');
  assert.equal(m.scope,'./');
  assert.equal(m.display,'standalone');
  assert.equal(m.lang,'fr');
  assert.equal(m.prefer_related_applications,false);
  assert.ok(Array.isArray(m.icons)&&m.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'));
  assert.ok(m.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'));
}
for(const key of ['name','short_name','start_url','scope','display','background_color','theme_color']) assert.deepEqual(web[key],json[key]);
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(sw,/gensrpg-cache-16\.78\.92-firefox-pwa/);
assert.match(sw,/\.\/manifest\.webmanifest/);
assert.match(sw,/\.\/manifest\.json/);
assert.ok(fs.existsSync(path.join(root,'icon-192.png')),'root 192 icon missing');
assert.ok(fs.existsSync(path.join(root,'icon-512.png')),'root 512 icon missing');
console.log('GenSrpG V16.78.92 Firefox/PWA compatibility: manifests + cache OK');
