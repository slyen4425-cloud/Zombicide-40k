'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const testsRoot=path.join(root,'tests');
const exempt=new Set([
  'gens_phase5_capture135_retirement_stale_baseline_scan_v1.test.cjs'
]);
const stale=[];
for(const name of fs.readdirSync(testsRoot)){
  if(!name.endsWith('.test.cjs')||exempt.has(name))continue;
  const src=fs.readFileSync(path.join(testsRoot,name),'utf8');
  const markers=[];
  if(src.includes('8172687'))markers.push('pre-capture135-size');
  if(src.includes('e56f7b63963d991717e1738c3e5188011276a2b7'))markers.push('pre-capture135-blob');
  if(markers.length)stale.push({file:name,markers});
}
assert.deepEqual(stale,[],
  'active sentinels must not retain the pre-captureFix135-retirement index baseline: '+JSON.stringify(stale));
console.log(JSON.stringify({
  scenario:'Phase 5 captureFix135 retirement stale-baseline scan',
  current:{bytes:8171854,gitBlob:'97f0e060d8bffcde2baaf5aa42c1e16b8544263f'},
  exemptions:[...exempt],
  stale
},null,2));
