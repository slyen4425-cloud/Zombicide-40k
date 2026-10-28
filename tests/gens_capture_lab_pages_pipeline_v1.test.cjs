'use strict';
// Real GitHub Pages pipeline contract. This is a release guard, not a second
// Combat engine; it must be RED until the canonical Pages pipeline is wired.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const gitblob=bytes=>crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');

test('Pages release resolves the single immutable official Combat and visual SHA',()=>{
 const workflow=read('.github/workflows/main.yml');
 const standalone=read('.github/workflows/capture-lab-delivery.yml');
 const source=read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
 const pins=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
 assert.equal(pins.authoredSourceLabPin,'65e21792ff74aea9862e528c8dbfdb22797b6693');
 assert.equal(pins.authoredAssetsPin,'b3d46ce6f2639ebb59a2984aeff17f97cbcd7377');
 assert.ok(source.includes(pins.authoredSourceLabPin));
 assert.ok(workflow.includes('id: capture_pages_pins'),'Pages must resolve from source manifest');
 assert.ok(workflow.includes("console.log('combat='+COMBAT_LAB_SOURCE_V1.sha)"));
 assert.ok(workflow.includes("console.log('visuals='+manifest.authoredAssetsPin)"));
 assert.ok(workflow.includes('repository: slyen4425-cloud/GenSrpg_labo_combat_dynamique'));
 assert.ok(workflow.includes('capture_pages_pins.outputs.combat'),'Lab checkout must use pinned commit output');
 assert.ok(workflow.includes('capture_pages_pins.outputs.visuals'),'visual checkout must use pinned commit output');
 assert.ok(workflow.includes('sparse-checkout:'),'do not clone the complete media repository');
 assert.ok(standalone.includes('node tools/stage_capture_lab_delivery.mjs combat-lab combat-assets _site'));
});

test('Pages uses same verified payload publisher AFTER site preparation and BEFORE upload',()=>{
 const y=read('.github/workflows/main.yml');
 const at=s=>y.indexOf(s);
 const staging='node tools/stage_capture_lab_delivery.mjs combat-lab combat-assets _site';
 const verify='node --test tests/gens_capture_lab_delivery_v1.test.cjs';
 const guard='node --test tests/gens_capture_lab_pages_pipeline_v1.test.cjs';
 const publish='uses: actions/upload-pages-artifact@v3';
 for(const item of ['- name: Préparer le site',staging,verify,guard,publish]){
  assert.ok(at(item)>=0,'Pages workflow missing '+item);
 }
 assert.ok(at('- name: Préparer le site')<at(staging),'stage only after copying the site');
 assert.ok(at(staging)<at(verify)&&at(verify)<at(publish),'never publish unverified vendor');
 assert.ok(at(guard)<at(publish),'guard before release artifact');
 assert.ok(y.includes("if: github.event_name != 'pull_request'"),'never deploy production from PR');
});

test('staged payload stays dormant; historic public index, SW and real profiles unchanged',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'));
 const sw=read('service-worker.js');
 assert.equal(gitblob(index),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646');
 assert.ok(!index.includes(Buffer.from('vendor/combat-lab/')),'no automatic Combat install');
 assert.ok(!index.includes(Buffer.from('runtime-data/')),'no extra public UI owner');
 assert.ok(!sw.includes('vendor/combat-lab/'),'no premature PWA precache');
 assert.ok(!sw.includes('runtime-data/'),'no orphan author cache keys');
 assert.equal(fs.existsSync(path.join(root,'vendor/combat-lab')),false,'no vendored duplicate engine in git');
 const builder=read('tools/stage_capture_lab_delivery.mjs');
 assert.ok(builder.includes("COMBAT_LAB_SOURCE_V1.sha"));
 assert.ok(builder.includes('productionActivated:false'));
});
