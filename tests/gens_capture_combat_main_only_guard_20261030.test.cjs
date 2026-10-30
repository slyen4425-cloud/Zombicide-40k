const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = require('node:path').resolve(__dirname,'..');
const read = p => fs.readFileSync(require('node:path').join(root,p),'utf8');
const manifest = JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
const loader = read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
for (const name of ['.github/workflows/main.yml','.github/workflows/capture-lab-delivery.yml']) {
 test(name+' refuses unpromoted Combat revisions',()=>{
  const y = read(name);
  assert.match(y,/refs\/heads\/main/);
  assert.match(y,/COMBAT_LAB_SOURCE_V1\.sha!==combatMain/);
  assert.match(y,/throw Error\('Combat pin differs from approved main/);
  assert.doesNotMatch(y,/ref:\s*gh-pages/);
 });
}
test('engine and authored data share the single main-approved SHA',()=>{
 assert.match(manifest.authoredSourceLabPin,/^[a-f0-9]{40}$/);
 assert.equal(manifest.authoredSourceLabPin,'248f718ec924106d16999d59e5dc8310f8450180');
 assert.ok(loader.includes(manifest.authoredSourceLabPin));
 assert.equal(manifest.originalWildBattleButton.officialSourceSha,manifest.authoredSourceLabPin);
 assert.doesNotMatch(loader,/8318220b6a9b883aeced1d4bf693f906b0f36d3d/);
});
