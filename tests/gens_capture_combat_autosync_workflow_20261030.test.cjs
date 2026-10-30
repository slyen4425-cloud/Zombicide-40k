'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('only an approved Combat main can cause a source update',()=>{
 const y=read('.github/workflows/gensrpg-capture-combat-main-autosync.yml');
 const runner=read('tools/run_capture_combat_main_autosync.mjs');
 assert.match(y,/schedule:/);
 assert.match(y,/workflow_dispatch:/);
 assert.match(y,/pull-requests: write/);
 assert.match(y,/concurrency:/);
 assert.match(runner,/git\/ref\/heads\/main/);
 assert.match(runner,/x\.head_sha===official && x\.name==='Laboratory CI'/);
 assert.match(runner,/x\.conclusion==='success'/);
 assert.match(runner,/shaRef\(combat,'main'\)===official/);
 assert.doesNotMatch(runner,/refs\/heads\/gh-pages|ref:\s*gh-pages/);
 assert.match(runner,/plan|sync_capture_combat_main_pin\.mjs/);
});
test('fail-closed CI requires immutable checkout, all browser/architecture checks and unchanged upstream',()=>{
 const source=read('tools/run_capture_combat_main_autosync.mjs');
 for(const workflow of [
 'capture-lab-runtime.yml','capture-lab-delivery.yml','main.yml',
 'gensrpg-architecture-sentinels.yml','gensrpg-firefox-wall-sentinel.yml',
 'gensrpg-tactical-dock-sentinel.yml'
 ])assert.ok(source.includes(workflow),'missing independent certification '+workflow);
 assert.match(source,/await waitForRuns\(branch,candidate,workflows\)/);
 assert.match(source,/ensure\(shaRef\(own,'main'\)===initial/);
 assert.match(source,/ensure\(shaRef\(own,branch\)===candidate/);
 assert.match(source,/gh\('pr','merge'/);
 assert.match(source,/gh\('workflow','run','main\.yml'/);
 assert.match(source,/await waitForRuns\('main',merged,\['main\.yml'\]/);
 const pages=read('.github/workflows/main.yml');
 assert.match(pages,/if: github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'/);
 assert.match(pages,/node --test tests\/gens_capture_combat_main_autosync_20261030\.test\.mjs/);
 for(const workflow of ['capture-lab-runtime.yml','capture-lab-delivery.yml'])
  assert.match(read('.github/workflows/'+workflow),/workflow_dispatch:/);
});
