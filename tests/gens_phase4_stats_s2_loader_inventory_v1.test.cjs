const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const testsDir=path.join(root,'tests');
const needle='gens-rpg-stats-clean-167874.js';

const files=fs.readdirSync(testsDir)
  .filter(name=>name.endsWith('.test.cjs'))
  .filter(name=>fs.readFileSync(path.join(testsDir,name),'utf8').includes(needle))
  .sort();

assert.ok(files.length>0,'at least one direct legacy Stats loader must be inventoried');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S2 direct-loader inventory',
  needle,
  count:files.length,
  files
},null,2));
