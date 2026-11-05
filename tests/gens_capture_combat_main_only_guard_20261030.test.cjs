const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const root = require('node:path').resolve(__dirname,'..');
const read = p => fs.readFileSync(require('node:path').join(root,p),'utf8');
const manifest = JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
const loader = read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
for (const name of ['.github/workflows/main.yml','.github/workflows/capture-lab-delivery.yml']) {
 test(name+' certifies a historical official main release but rejects dev-only commits',()=>{
  const y=read(name);
  assert.ok(y.includes('assertOfficialMainHistoryPin'));
  assert.ok(y.includes("repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique'"));
  assert.ok(y.includes('sha:COMBAT_LAB_SOURCE_V1.sha'));
  assert.ok(!y.includes('COMBAT_LAB_SOURCE_V1.sha!==combatMain'),
   'a newer main commit cannot invalidate an older official released pin');
  assert.ok(!y.includes('ref: gh-pages'));
 });
}
test('engine and authored data share the single main-approved SHA',()=>{
 assert.match(manifest.authoredSourceLabPin,/^[a-f0-9]{40}$/);
 assert.equal(manifest.authoredSourceLabPin,'53890e1383b33f7a0ec5bb2fafed59acf1d7a163');
 assert.ok(loader.includes(manifest.authoredSourceLabPin));
 assert.equal(manifest.originalWildBattleButton.officialSourceSha,manifest.authoredSourceLabPin);
 assert.doesNotMatch(loader,/8318220b6a9b883aeced1d4bf693f906b0f36d3d/);
});
