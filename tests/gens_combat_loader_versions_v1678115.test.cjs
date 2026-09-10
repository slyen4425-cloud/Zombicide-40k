const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js','utf8');
assert.match(src,/COMBAT_PERF_SRC="assets\/gensrpg\/gens-combat-runtime-performance-1678110\.js\?v=1678115"/);
assert.match(src,/COMBAT_FLOW_SRC="assets\/gensrpg\/gens-combat-flow-1678111\.js\?v=1678115"/);
assert.match(src,/GensCombatRuntimePerformance1678110\?\.APP_VERSION==="16\.78\.115"/);
assert.match(src,/GensCombatFlow1678111\?\.APP_VERSION==="16\.78\.114"/);
assert.doesNotMatch(src,/COMBAT_PERF_SRC="[^"]+\?v=1678110"/);
assert.doesNotMatch(src,/COMBAT_FLOW_SRC="[^"]+\?v=1678112"/);
console.log('V16.78.115 combat loader cache-busting/version guards OK');
