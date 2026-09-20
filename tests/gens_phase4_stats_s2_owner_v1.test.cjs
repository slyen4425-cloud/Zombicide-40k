const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const corePath=path.join(root,'assets','gensrpg','core','stats-v1.js');
const legacyPath=path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js');
const previewPath=path.join(root,'preview.html');

assert.ok(fs.existsSync(corePath),'Core Stats S2 service must exist');

const core=fs.readFileSync(corePath,'utf8');
const legacy=fs.readFileSync(legacyPath,'utf8');
const preview=fs.readFileSync(previewPath,'utf8');

assert.match(core,/ROOT\.GensStatsV1=Object\.freeze\(/,'Core Stats API export missing');
for(const name of ['slug','canon','number','clamp','normalizeDefinition','targetValid','normalizeEffect','compare','effectContribution']){
  assert.match(core,new RegExp('\\b'+name+'\\b'),'Core Stats API missing '+name);
}

for(const forbidden of [
  /document\b/,/localStorage\b/,/MutationObserver\b/,/setTimeout\b/,/setInterval\b/,
  /currentRpgProfile\b/,/loadGameProfiles\b/,/dungeonEquipmentBonus\b/,/dungeonSkillEffectTotal\b/,
  /dungeonChallengeDebuffTotal067\b/,/renderEditor\b/,/saveProfile\b/
]){
  assert.equal(forbidden.test(core),false,'Core Stats S2 must stay pure: '+forbidden);
}

const coreTag='assets/gensrpg/core/stats-v1.js';
const legacyTag='assets/gensrpg/gens-rpg-stats-clean-167874.js';
const corePos=preview.indexOf(coreTag);
const legacyPos=preview.indexOf(legacyTag);
assert.ok(corePos>=0,'preview must load Core Stats S2');
assert.ok(legacyPos>=0,'preview legacy Stats tag missing');
assert.ok(corePos<legacyPos,'Core Stats must load before legacy Stats owner');

assert.match(legacy,/const CORE_STATS=R\.GensStatsV1/,'legacy Stats must bind explicit Core Stats dependency');
assert.match(legacy,/if\(!CORE_STATS\)throw new Error\(/,'legacy Stats must fail explicitly when Core Stats is absent');

for(const pattern of [
  /const ALIAS=\{/,
  /function normDef\(/,
  /function normEffect\(/,
  /function compare\(/,
  /const slug=v=>/,
  /const canon=id=>/,
  /const num=\(v,f=0\)=>/,
  /clamp=\(n,a,b\)=>/
]){
  assert.equal(pattern.test(legacy),false,'legacy Stats must no longer own pure S2 implementation: '+pattern);
}

assert.match(
  legacy,
  /effectContribution\(e,value\(hero,e\.source,seen\)\)/,
  'legacy effectAmount must delegate elemental contribution to Core Stats'
);
assert.equal(
  /Math\.floor\(v\/Math\.max\(1,e\.step\)\)\*e\.gain/.test(legacy),
  false,
  'legacy Stats must not duplicate step contribution formula'
);

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S2 authority',
  core:'GensStatsV1',
  previewOrder:'core-before-legacy',
  duplicatePureImplementation:false
},null,2));
