import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// The immutable Adventure candidate passed architecture, browser, Combat, Runtime and Builder gates.
// PR #289 composes the original full Aventure UI with the verified archival guard.
const sha='7d7f1f20eb16f10fc28f75f15b68d287954f2a13';
const file=JSON.parse(fs.readFileSync(new URL('../tools/capture_v2_pages_preview_pin.json',import.meta.url),'utf8'));
test('Monster Capture illustrated in-game sheets and fullscreen release pins the exact certified candidate, not a moving branch',()=>{
 assert.equal(file.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(file.repository,'slyen4425-cloud/Zombicide-40k');
 assert.equal(file.sha,sha,'Do not republish stale gameplay');
 assert.equal(file.publicPath,'/preview/capture-v2-pr225/');
});
test('published Monster Capture stays isolated and retains exact certified original visual author',()=>{
 assert.equal(file.officialVisuals.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(file.officialVisuals.ref,'global-assets');
 assert.equal(file.officialVisuals.sha,'aded6a9bc571dd1dd557889d35ad4e513f6f27dd');
 assert.equal(file.officialVisuals.certifiedCiRun,41558880085);
 const workflow=fs.readFileSync(new URL('../.github/workflows/main.yml',import.meta.url),'utf8');
 assert.match(workflow,/steps\.preview_labs\.outputs\.combat/);
 assert.match(workflow,/steps\.preview_labs\.outputs\.exploration/);
 assert.match(workflow,/node --test tests\/gens_capture_v2_owned_stats_pages_promotion_20261105\.test\.mjs/);
 assert.doesNotMatch(workflow,/ref: 53890e1383b33f7a0ec5bb2fafed59acf1d7a163|ref: 7155516b51db9892183cc043837037c4c87a0315/);
});
