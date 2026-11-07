import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planCertifiedCaptureV2SourceUpdate, LAB_SPECS}
  from '../tools/watch_capture_v2_official_main.mjs';

const a='a'.repeat(40), b='b'.repeat(40), c='c'.repeat(40), d='d'.repeat(40), e='e'.repeat(40);
const release={sha:a,publicPath:'/preview/capture-v2-pr225/'};
const pins={
  schema:'gensrpg-capture-v2-official-main-pins-v1',
  combat:{repository:LAB_SPECS.combat.repository,ref:'main',sha:b,
    path:'vendor/combat-lab/',certifiedCiRun:21},
  exploration:{repository:LAB_SPECS.exploration.repository,ref:'main',sha:c,
    path:'vendor/exploration-lab/',certifiedCiRun:22},
  legacyCaptureRuntime:false,
  featuresDeferred:['XP','merchant']
};
const certified=(name,sha,id)=>({id,name,head_sha:sha,head_branch:'main',
  status:'completed',conclusion:'success'});
const ahead={status:'ahead',ahead_by:2,behind_by:0};

test('RED: certify both official mains and write ONLY two immutable manifest pins',()=>{
  const original=structuredClone(pins);
  const result=planCertifiedCaptureV2SourceUpdate({release,pins,labs:{
    combat:{sha:d,ciRun:certified('Laboratory CI',d,99),comparison:ahead},
    exploration:{sha:e,ciRun:certified('Exploration CI',e,100),comparison:ahead}
  }});
  assert.deepEqual(result.proposals.map(x=>x.lab),['combat','exploration']);
  assert.deepEqual(result.nextPins,{
    ...pins,
    combat:{...pins.combat,sha:d,certifiedCiRun:99},
    exploration:{...pins.exploration,sha:e,certifiedCiRun:100}
  });
  assert.deepEqual(pins,original,'never mutate original published source');
  assert.deepEqual(result.nextPins.featuresDeferred,['XP','merchant']);
});

test('no official update produces no candidate and a single changed Lab never alters the other',()=>{
  assert.equal(planCertifiedCaptureV2SourceUpdate({release,pins,labs:{
    combat:{sha:b},exploration:{sha:c}
  }}),null);
  const out=planCertifiedCaptureV2SourceUpdate({release,pins,labs:{
    combat:{sha:d,ciRun:certified('Laboratory CI',d,99),comparison:ahead},
    exploration:{sha:c}
  }});
  assert.deepEqual(out.nextPins.exploration,pins.exploration);
});

test('wrong SHA, unapproved CI, divergence and moving refs fail closed',()=>{
  for(const invalid of [
    {sha:d,ciRun:certified('Laboratory CI',b,99),comparison:ahead},
    {sha:d,ciRun:{...certified('Laboratory CI',d,99),conclusion:'failure'},comparison:ahead}
  ])assert.equal(planCertifiedCaptureV2SourceUpdate({release,pins,labs:{
    combat:invalid,exploration:{sha:c}
  }}),null);
  assert.throws(()=>planCertifiedCaptureV2SourceUpdate({release,pins,labs:{
    combat:{sha:d,ciRun:certified('Laboratory CI',d,99),
      comparison:{status:'diverged',ahead_by:3,behind_by:1}},
    exploration:{sha:c}
  }}),/ancestry|fast-forward|comparison/i);
  assert.throws(()=>planCertifiedCaptureV2SourceUpdate({release,pins:{
    ...pins,combat:{...pins.combat,ref:'gh-pages'}
  },labs:{combat:{sha:b},exploration:{sha:c}}}));
});

test('automation may create a DRAFT review PR but must never auto-merge or deploy',()=>{
  const workflow=fs.readFileSync(new URL('../.github/workflows/gensrpg-capture-v2-main-watch.yml',import.meta.url),'utf8');
  const source=fs.readFileSync(new URL('../tools/watch_capture_v2_official_main.mjs',import.meta.url),'utf8');
  assert.match(workflow,/pull-requests: write/);
  assert.match(workflow,/contents: write/);
  assert.match(workflow,/issues: write/);
  assert.match(workflow,/node --test tests\/gens_capture_v2_certified_autopropose_20261107\.test\.mjs/);
  assert.match(source,/draft=true|draft: true/);
  assert.match(source,/source-pins-v1\.json/);
  assert.match(source,/capture_v2_pages_preview_pin\.json/);
  assert.doesNotMatch(source,/gh\('pr','merge'/);
  assert.match(source,/gh\('workflow','run'/,'default GITHUB_TOKEN PRs must explicitly dispatch independent CI runs');
  assert.doesNotMatch(workflow,/deploy-pages|upload-pages-artifact/);
});
