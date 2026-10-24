const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const testDir=path.join(root,'tests');
const offenders=[];

for(const name of fs.readdirSync(testDir)){
  if(!/\.test\.cjs$/i.test(name))continue;
  if(name==='gens_phase4_stats_dependency_order_v1.test.cjs')continue;
  const src=fs.readFileSync(path.join(testDir,name),'utf8');
  if(!src.includes('gens-rpg-stats-clean-167874.js'))continue;
  if(!src.includes('vm.runInContext'))continue;
  if(!src.includes('stats-normalization-v1.js'))offenders.push(name);
}

assert.deepEqual(
  offenders,
  [],
  'Tests executing gens-rpg-stats-clean must load stats-normalization-v1 first:\n'+offenders.join('\n')
);

console.log(JSON.stringify({
  scenario:'Core Stats explicit test dependency order',
  offenders
},null,2));
