const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const index=read('index.html');
const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const art=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const policy=read('assets/gensrpg/gens-stat-upgrade-policy-167898.js');

// Native editor remains the historical checkbox-only fallback in the monolith.
assert.match(index,/statsHost\.innerHTML=Object\.entries\(labels\).*smodPoolRow/s,'native RPG editor fallback must remain characterized as checkbox-only');

// Canonical stats module owns the complete editor model.
for(const token of ['data-stat-card','data-name','data-desc','data-add-effect','data-effect-target','damage:melee','damage:ranged','hit:ranged']){
  assert.ok(stats.includes(token),`canonical stats editor missing ${token}`);
}
assert.match(stats,/wrap\("renderRpgUniverseEditor"/,'canonical stats module must wrap the native editor lifecycle');

// Hero-art is visual only and must stay out of the stats editor lifecycle.
const hookAll=art.match(/function hookAll\(\)\{([\s\S]*?)\nfunction install/);
assert.ok(hookAll,'hero-art hookAll must remain inspectable');
assert.doesNotMatch(hookAll[1],/renderRpgUniverseEditor|saveRpgUniverseStats/,'hero-art bridge must not participate in stats editor rendering or saving');

// Upgrade policy is allowed to decorate the canonical cards, but must not replace their HTML.
assert.ok(policy.includes('"renderRpgUniverseEditor"'),'upgrade-policy must still decorate editor renders');
assert.match(policy,/function injectEditor\(\)/,'upgrade-policy editor decorator must remain explicit');
assert.doesNotMatch(policy,/rpgStatsList[^\n]{0,120}innerHTML\s*=/,'upgrade-policy must never replace the canonical stats list');

console.log('GenSrpG stats editor authority characterization OK: native checkbox fallback, canonical rich renderer, scoped policy decorator');
