const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const storage=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');

assert.doesNotMatch(storage,/captureCreatureProgress|gensrpg_capture_progress|starterLimit|healCenterCost|dayHealPct/,'Core storage must remain generic and own no Capture business rule');
assert.match(index,/function captureCreatureProgressRulesKey\(\)/,'Capture keeps ownership of its dynamic key');
assert.match(index,/function captureCreatureProgressRules\(\)/,'Capture keeps ownership of defaults and normalization');
assert.match(index,/function captureSaveCreatureProgressRulesFromUi\(\)/,'Capture keeps ownership of its editor writer');
for(const id of ['capturePlaytestFix128','captureFix130','captureFix134','captureFix137','captureFix140']){
  assert.ok(index.includes('<script id="'+id+'">'),id+' must remain a Capture layer');
}
assert.match(index,/localStorage\.setItem\(captureMjRulesKey137\(\),JSON\.stringify\(r\)\)/,'adjacent MJ family must remain untouched in this lot');
assert.match(index,/localStorage\.setItem\(captureTrainerDifficultyKey134\(\),String\(/,'trainer difficulty scalar family must remain untouched');
assert.doesNotMatch(index,/function\s+captureProgressStorage|captureProgressStorage\s*=/,'no competing Capture storage wrapper may be introduced');
console.log(JSON.stringify({scenario:'Phase 4 Capture progress owner guard',coreOwner:'generic JSON serialization only',businessOwner:'Capture',adjacentFamiliesUntouched:true},null,2));
