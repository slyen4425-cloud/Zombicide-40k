import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The selected Capture candidate is an immutable commit, not a moving branch.
// The actual CI-verified candidate is approved by the release PR; the existing
// publisher checks out that exact SHA, validates Lab owners and proves HTTPS
// provenance. Never hardcode a former release SHA as a second release authority.
const file=JSON.parse(fs.readFileSync(new URL('../tools/capture_v2_pages_preview_pin.json',import.meta.url),'utf8'));
test('Monster Capture release pins one immutable candidate and proves the selected SHA throughout staging',()=>{
 assert.equal(file.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(file.repository,'slyen4425-cloud/Zombicide-40k');
 assert.match(file.sha,/^[0-9a-f]{40}$/,'approved candidate must be an immutable Git commit SHA');
 assert.equal(file.publicPath,'/preview/capture-v2-pr225/');
 const workflow=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
 assert.equal((workflow.match(/ref: \$\{\{ steps\.preview_pin\.outputs\.sha \}\}/g)||[]).length,2,
  'build and review must both checkout the single source pin');
 const stage=fs.readFileSync(new URL('../tools/stage_capture_v2_pages_preview.mjs',import.meta.url),'utf8');
 assert.match(stage,/if\(head\(source\)!==expectedPreviewSha\)/,
  'the real staged checkout must match the selected candidate exactly');
 assert.match(stage,/release-provenance\.v1\.json/,
  'publish the selected SHA in the inspectable release manifest');
});
test('published Monster Capture stays isolated and retains exact certified original visual author',()=>{
 assert.equal(file.officialVisuals.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(file.officialVisuals.ref,'global-assets');
 assert.equal(file.officialVisuals.sha,'64577c0620f952483825537a4bbcb2bfd952c8b7',
  'new certified descendant must retain prior authored sprites and register all 80 approved icons');
 assert.equal(file.officialVisuals.certifiedCiRun,42586781298,
  'same immutable visual SHA must be certified by the official Laboratory CI before promotion');
 const workflow=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
 assert.match(workflow,/steps\.preview_labs\.outputs\.combat/);
 assert.match(workflow,/steps\.preview_labs\.outputs\.exploration/);
 assert.equal((workflow.match(/ref: \$\{\{ steps\.preview_pin\.outputs\.visuals \}\}/g)||[]).length,2,
  'Pages build and PR review must both consume the ONE certified visual SHA');
 assert.doesNotMatch(workflow,/ref: aded6a9bc571dd1dd557889d35ad4e513f6f27dd/,
  'an obsolete visual SHA must not survive independently in the workflow');
 assert.match(workflow,/node --test tests\/gens_capture_v2_owned_stats_pages_promotion_20261105\.test\.mjs/);
 assert.doesNotMatch(workflow,/ref: 53890e1383b33f7a0ec5bb2fafed59acf1d7a163|ref: 7155516b51db9892183cc043837037c4c87a0315/);
});
