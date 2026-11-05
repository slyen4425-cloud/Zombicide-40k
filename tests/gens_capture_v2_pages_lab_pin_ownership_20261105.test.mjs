import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveCaptureV2PreviewSourcesV1} from '../tools/resolve_capture_v2_preview_sources.mjs';

const combat='a'.repeat(40),exploration='b'.repeat(40);
const manifest={
 schema:'gensrpg-capture-v2-official-main-pins-v1',
 combat:{repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
  ref:'main',sha:combat,path:'vendor/combat-lab/',certifiedCiRun:123},
 exploration:{repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',
  ref:'main',sha:exploration,path:'vendor/exploration-lab/',certifiedCiRun:456},
 legacyCaptureRuntime:false,featuresDeferred:[]
};
test('publisher obtains immutable official Combat and Exploration pins from selected V2 candidate alone',()=>{
 assert.deepEqual(resolveCaptureV2PreviewSourcesV1(manifest),{
  combat,exploration
 });
});
test('never accept lab forks, floating refs, missing green provenance or legacy runtime',()=>{
 for(const change of [
  p=>{p.combat.ref='gh-pages'},
  p=>{p.exploration.sha='main'},
  p=>{p.combat.repository='unapproved/fork'},
  p=>{p.exploration.certifiedCiRun=0},
  p=>{p.legacyCaptureRuntime=true},
  p=>{p.schema='v2'}
 ]){
  const p=structuredClone(manifest);change(p);
  assert.throws(()=>resolveCaptureV2PreviewSourcesV1(p));
 }
});
test('single real publisher and PR-review use exactly the SAME source-pinned SHAs, not old hardcoded Lab refs',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
 assert.equal((workflow.match(/Resolve official Combat and Exploration from selected Capture V2 source/g)||[]).length,2);
 assert.equal((workflow.match(/node tools\/resolve_capture_v2_preview_sources\.mjs capture-v2-source\/assets\/gensrpg\/capture-v2\/source-pins-v1\.json/g)||[]).length,2);
 assert.equal((workflow.match(/ref: \$\{\{ steps\.preview_labs\.outputs\.combat \}\}/g)||[]).length,2);
 assert.equal((workflow.match(/ref: \$\{\{ steps\.preview_labs\.outputs\.exploration \}\}/g)||[]).length,2);
 assert.doesNotMatch(workflow,/ref: 53890e1383b33f7a0ec5bb2fafed59acf1d7a163|ref: 7155516b51db9892183cc043837037c4c87a0315/);
 assert.match(workflow,/test "\$\(git -C preview-combat-lab rev-parse HEAD\)" = "\$\{\{ steps\.preview_labs\.outputs\.combat \}\}"/);
 assert.match(workflow,/test "\$\(git -C preview-exploration-lab rev-parse HEAD\)" = "\$\{\{ steps\.preview_labs\.outputs\.exploration \}\}"/);
 assert.match(workflow,/node --test tests\/gens_capture_v2_pages_lab_pin_ownership_20261105\.test\.mjs/);
});
