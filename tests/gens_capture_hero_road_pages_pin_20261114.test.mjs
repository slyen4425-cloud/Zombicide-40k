import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const sha40=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);

test('single Pages publisher consumes the ONE immutable selected Capture and official visual source',()=>{
 const manifest=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));
 assert.equal(manifest.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(manifest.repository,'slyen4425-cloud/Zombicide-40k');
 assert.ok(sha40(manifest.sha),'Capture source must be an immutable full commit SHA');
 assert.equal(manifest.publicPath,'/preview/capture-v2-pr225/');
 assert.equal(manifest.officialVisuals.repository,
  'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(manifest.officialVisuals.ref,'global-assets');
 assert.ok(sha40(manifest.officialVisuals.sha),
  'Official visual media must be an immutable full commit SHA');
 assert.ok(Number.isSafeInteger(manifest.officialVisuals.certifiedCiRun)&&
  manifest.officialVisuals.certifiedCiRun>0,
  'Visual source requires the one certified CI run');
 const workflow=read('.github/workflows/main.yml');
 // Protect real GitHub checkout, native owner staging and output integrity.
 // Never maintain a second stale SHA whitelist or overwrite the author pin.
 assert.match(workflow,/ref: \$\{\{ steps\.preview_pin\.outputs\.sha \}\}/);
 assert.match(workflow,/ref: \$\{\{ steps\.preview_pin\.outputs\.visuals \}\}/);
 assert.match(workflow,/node tools\/resolve_capture_v2_preview_sources\.mjs capture-v2-source\/assets\/gensrpg\/capture-v2\/source-pins-v1\.json/);
 assert.match(workflow,/node tools\/stage_capture_v2_pages_preview\.mjs capture-v2-source preview-combat-lab preview-exploration-lab _site/);
 assert.match(workflow,/release\.source\.commit!==pin\.sha/);
 assert.match(workflow,/release\.deliveryManifestSha256!==hash\(manifestBytes\)/);
 assert.match(workflow,/bridge\.legacyCaptureRuntime!==false/);
});
