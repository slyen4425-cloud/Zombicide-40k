import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planCaptureV2UpstreamReviews, LAB_SPECS} from '../tools/watch_capture_v2_official_main.mjs';

const a='1'.repeat(40), b='2'.repeat(40), c='3'.repeat(40), d='4'.repeat(40), e='5'.repeat(40);
const release={sha:a,publicPath:'/preview/capture-v2-pr225/'};
const pins={
  schema:'gensrpg-capture-v2-official-main-pins-v1',
  combat:{repository:LAB_SPECS.combat.repository,ref:'main',sha:b,certifiedCiRun:91},
  exploration:{repository:LAB_SPECS.exploration.repository,ref:'main',sha:c,certifiedCiRun:92},
  legacyCaptureRuntime:false
};
const certified=(name,sha,id)=>({name,head_sha:sha,head_branch:'main',status:'completed',conclusion:'success',id});
const ahead={status:'ahead',ahead_by:1,behind_by:0};
const oldLabs={
  combat:{sha:b},exploration:{sha:c}
};
test('published immutable Aventure source with two unchanged official main pins requires no proposal',()=>{
  assert.deepEqual(planCaptureV2UpstreamReviews({release,pins,labs:oldLabs}),[]);
});
test('newer independently certified main versions generate review proposals for BOTH labs, never an implicit promotion',()=>{
  const labs={
    combat:{sha:d,ciRun:certified('Laboratory CI',d,101),comparison:ahead},
    exploration:{sha:e,ciRun:certified('Exploration CI',e,102),comparison:ahead}
  };
  const result=planCaptureV2UpstreamReviews({release,pins,labs});
  assert.deepEqual(result.map(x=>x.lab),['combat','exploration']);
  assert.deepEqual(result.map(x=>x.officialSha),[d,e]);
  assert.deepEqual(result.map(x=>x.certifiedCiRun),[101,102]);
  assert.ok(result.every(x=>x.releaseSha===a && x.status==='needs-review'));
  assert.equal(pins.combat.sha,b,'pure planner never changes published pin');
});
test('missing, failed, branch-only or wrong-SHA CI must NOT produce an approved update',()=>{
  for(const run of [null,certified('Laboratory CI',b,9),
    {...certified('Laboratory CI',d,9),head_branch:'feature'},
    {...certified('Laboratory CI',d,9),conclusion:'failure'},
    {...certified('Laboratory CI',d,9),status:'in_progress'},
    {...certified('Exploration CI',d,9)}
  ]){
    const r=planCaptureV2UpstreamReviews({release,pins,labs:{
      ...oldLabs,combat:{sha:d,ciRun:run,comparison:ahead}
    }});
    assert.deepEqual(r,[]);
  }
});
test('reject rewritten, diverged or unverified main ancestry',()=>{
  for(const comparison of [undefined,{status:'diverged',ahead_by:1,behind_by:1},
    {status:'behind',ahead_by:0,behind_by:1},{status:'ahead',ahead_by:1,behind_by:1}]){
    assert.throws(()=>planCaptureV2UpstreamReviews({release,pins,labs:{
      ...oldLabs,combat:{sha:d,ciRun:certified('Laboratory CI',d,101),comparison}
    }}),/ancestry|fast-forward|comparison/i);
  }
});
test('reject invalid release path, unknown owner, floating ref or reactivated legacy source',()=>{
  for(const mutate of [
    p=>{p.combat.ref='gh-pages'},
    p=>{p.combat.repository='someone/unknown'},
    p=>{p.legacyCaptureRuntime=true},
    p=>{p.exploration.sha='main'}
  ]){
    const modified=structuredClone(pins);mutate(modified);
    assert.throws(()=>planCaptureV2UpstreamReviews({release,pins:modified,labs:oldLabs}));
  }
  assert.throws(()=>planCaptureV2UpstreamReviews({release:{...release,sha:'main'},pins,labs:oldLabs}));
});
test('scheduled V2 watcher proposes draft pinned review PRs only; legacy V1 updater stays manual-only',()=>{
  const watcher=fs.readFileSync(new URL('../.github/workflows/gensrpg-capture-v2-main-watch.yml',import.meta.url),'utf8');
  const legacy=fs.readFileSync(new URL('../.github/workflows/gensrpg-capture-combat-main-autosync.yml',import.meta.url),'utf8');
  assert.match(watcher,/schedule:/);
  assert.match(watcher,/workflow_dispatch:/);
  assert.match(watcher,/issues: write/);
  assert.match(watcher,/contents: write/);
  assert.match(watcher,/pull-requests: write/);
  assert.match(watcher,/actions: write/);
  assert.match(watcher,/node --test tests\/gens_capture_v2_upstream_watch_v1\.test\.mjs/);
  assert.match(watcher,/node --test tests\/gens_capture_v2_certified_autopropose_20261107\.test\.mjs/);
  assert.doesNotMatch(watcher,/gh pr merge|merge_pull_request|deploy-pages/);
  assert.doesNotMatch(legacy,/\bschedule:/,'old updater must not auto-merge obsolete runtime');
  assert.match(legacy,/workflow_dispatch:/);
});
