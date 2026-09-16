const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const index=read('index.html');
const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const art=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const policy=read('assets/gensrpg/gens-stat-upgrade-policy-167898.js');

// Native editor is still the historical checkbox-only fallback.
assert.match(index,/statsHost\.innerHTML=Object\.entries\(labels\).*smodPoolRow/s,'native RPG editor fallback must remain characterized as checkbox-only');

// Canonical stats module still owns the complete editor model.
for(const token of ['data-stat-card','data-name','data-desc','data-add-effect','data-effect-target','damage:melee','damage:ranged','hit:ranged']){
  assert.ok(stats.includes(token),`canonical stats editor missing ${token}`);
}
assert.match(stats,/wrap\("renderRpgUniverseEditor"/,'canonical stats module must wrap the native editor lifecycle');

// Historical debt: two secondary modules currently re-wrap that same lifecycle.
assert.ok(art.includes('"renderRpgUniverseEditor"'),'hero-art bridge currently participates in the stats editor lifecycle');
assert.ok(policy.includes('"renderRpgUniverseEditor"'),'upgrade-policy decorator currently participates in the stats editor lifecycle');
assert.match(art,/tries\+\+<30.*setTimeout\(retry,100\)/s,'hero-art bridge retry loop must remain characterized before removal');
assert.match(policy,/tries\+\+<20.*setTimeout\(retry,100\)/s,'upgrade-policy retry loop must remain characterized before removal');

console.log('GenSrpG stats editor authority characterization OK: native checkbox fallback + canonical rich editor + competing retry wrappers identified');
