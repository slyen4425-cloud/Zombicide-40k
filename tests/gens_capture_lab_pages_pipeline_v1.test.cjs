'use strict';
// Deployment contract, not a second game runtime. The official static delivery
// must be built by the same already-tested publisher as the Capture release CI.
// This test runs RED until the real Pages pipeline is wired at the source.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const gitblob=bytes=>{
 const crypto=require('node:crypto');
 return crypto.createHash('sha1').update('blob '+bytes.length+'\\0').update(bytes).digest('hex');
};
test('Pages release resolves the single immutable official Combat and visual SHA',()=>{
 const workflow=read('.github/workflows/main.yml');
 const standalone=read('.github/workflows/capture-lab-delivery.yml');
 const source=read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
 const pins=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
 assert.equal(pins.authoredSourceLabPin,'65e21792ff74aea9862e528c8dbfdb22797b6693');
 assert.equal(pins.authoredAssetsPin,'b3d46ce6f2639ebb59a2984aeff17f97cbcd7377');
 assert.ok(source.includes(pins.authoredSourceLabPin));
 assert.match(workflow,/id: capture_pages_pins/);
 assert.match(workflow,/console\\.log\\('combat='\\+COMBAT_LAB_SOURCE_V1\\.sha\\)/);
 assert.match(workflow,/console\\.log\\('visuals='\\+manifest\\.authoredAssetsPin\\)/);
 assert.match(workflow,/repository: slyen4425-cloud\\/GenSrpg_labo_combat_dynamique/);
 assert.match(workflow,/ref: \\$\\{\\{ steps\\.capture_pages_pins\\.outputs\\.combat \\}\\}/);
 assert.match(workflow,/ref: \\$\\{\\{ steps\\.capture_pages_pins\\.outputs\\.visuals \\}\\}/);
 assert.ok(workflow.includes('sparse-checkout:'));
 assert.ok(standalone.includes('node tools/stage_capture_lab_delivery.mjs combat-lab combat-assets _site'));
});
test('Pages build stages official payload after site preparation, validates it before publishing',()=>{
 const y=read('.github/workflows/main.yml');
 const at=(s)=>y.indexOf(s);
 const staging='node tools/stage_capture_lab_delivery.mjs combat-lab combat-assets _site';
 const verify='node --test tests/gens_capture_lab_delivery_v1.test.cjs';
 const guard='node --test tests/gens_capture_lab_pages_pipeline_v1.test.cjs';
 const publish='uses: actions/upload-pages-artifact@v3';
 for(const item of ['- name: Préparer le site',staging,verify,guard,publish]){
  assert.ok(at(item)>=0,'Pages workflow missing '+item);
 }
 assert.ok(at('- name: Préparer le site')<at(staging),'stage only after copying entire site');
 assert.ok(at(staging)<at(verify)&&at(verify)<at(publish),'never publish unverified vendor');
 assert.ok(at(guard)<at(publish),'guard before release artifact');
 assert.ok(y.includes('if: github.event_name != \'pull_request\''),'no Pages production deployment from PR');
});
test('static payload remains dormant and the immutable historic public entry and SW stay untouched',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'));
 const sw=read('service-worker.js');
 assert.equal(gitblob(index),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646');
 assert.ok(!index.includes(Buffer.from('vendor/combat-lab/')),'no public engine auto-install');
 assert.ok(!index.includes(Buffer.from('runtime-data/')),'no public UI override');
 assert.ok(!sw.includes('vendor/combat-lab/'),'do not precache payload before real Hub activation');
 assert.ok(!sw.includes('runtime-data/'),'do not add stale author cache keys');
 assert.equal(fs.existsSync(path.join(root,'vendor/combat-lab')),false,'do not vendor a second owner in git');
 const builder=read('tools/stage_capture_lab_delivery.mjs');
 assert.ok(builder.includes('git'), 'official publisher must enforce pinned Git commits');
 assert.ok(builder.includes('COMBAT_LAB_SOURCE_V1.sha'));
 assert.ok(builder.includes("productionActivated:false"));
});
