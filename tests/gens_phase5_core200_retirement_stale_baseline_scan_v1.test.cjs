'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const testsRoot=path.join(root,'tests');
const exempt=new Set([
  'gens_phase5_startconfiguredgame_core200_global_retirement_v1.test.cjs',
  'gens_phase5_core200_retirement_stale_baseline_scan_v1.test.cjs'
]);
const stale=[];
for(const name of fs.readdirSync(testsRoot)){
  if(!name.endsWith('.test.cjs')||exempt.has(name))continue;
  const src=fs.readFileSync(path.join(testsRoot,name),'utf8');
  const markers=[];
  if(src.includes('8172742'))markers.push('old-size');
  if(src.includes('95f8c96e7e221eb743f7c8013ffa8af499eca1c8'))markers.push('old-blob');
  if(markers.length)stale.push({file:name,markers});
}
assert.deepEqual(stale,[],
  'active sentinels must not retain the pre-Core200-retirement index baseline: '+JSON.stringify(stale));
console.log(JSON.stringify({
  scenario:'Phase 5 Core200 retirement stale-baseline scan',
  current:{bytes:8172687,gitBlob:'e56f7b63963d991717e1738c3e5188011276a2b7'},
  exemptions:[...exempt],
  stale
},null,2));
