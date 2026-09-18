const assert=require('node:assert/strict');
const fs=require('node:fs');

const src=fs.readFileSync('index.html','utf8');
const start=src.indexOf('<script id="dungeonCore202ContentDensity">');
const end=src.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'Core 2.02 inline block must exist');
const block=src.slice(start,end);

assert.match(block,/function authored202\(x\)\{return !!x\?\.last\?\.authoredRuntime167839\}/,'Core 2.02 must recognize the dedicated authored runtime');
assert.match(block,/function ensureEncounter202\(x\)\{\s*if\(authored202\(x\)\|\|/,'legacy encounter regeneration must be disabled for authored worlds');
assert.match(block,/function ensureTrap202\(x\)\{\s*if\(authored202\(x\)\|\|/,'legacy random trap creation must be disabled for authored worlds');
assert.match(block,/function ensurePuzzle202\(x\)\{\s*if\(authored202\(x\)\|\|/,'legacy random puzzle cadence must be disabled for authored worlds');
assert.match(block,/function maybeForceCombatRoom202\(x\)\{\s*if\(authored202\(x\)\|\|/,'legacy forced-combat cadence must be disabled for authored worlds');
assert.match(block,/const x=rt202\(\);\s*if\(authored202\(x\)\)return r;\s*const transition=/,'Core 2.02 explore hook must exit before authored content-density mutation');
assert.match(block,/if\(authored202\(x\)\)\{paintTrap202\(\);return\}/,'authored renders may only reuse detected-trap painting, never legacy content generation');

console.log('Core 2.02 authored boundary: random encounter/trap/puzzle density disabled, detected-trap paint retained: OK');
