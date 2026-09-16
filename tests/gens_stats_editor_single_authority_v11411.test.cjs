const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const art=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const policy=read('assets/gensrpg/gens-stat-upgrade-policy-167898.js');

assert.match(stats,/wrap\("renderRpgUniverseEditor"/,'canonical stats module must remain the renderer wrapper for renderRpgUniverseEditor');
const hookAll=art.match(/function hookAll\(\)\{([\s\S]*?)\nfunction install/);
assert.ok(hookAll,'hero-art hookAll must remain inspectable');
assert.doesNotMatch(hookAll[1],/renderRpgUniverseEditor|saveRpgUniverseStats/,'hero-art bridge must not wrap the stats editor lifecycle');

// The upgrade policy may decorate after the canonical renderer, but it must not own the list HTML.
assert.match(policy,/\["renderRpgUniverseEditor","saveRpgUniverseStats","renderDungeonAttributes","renderDungeonHeroStats"\]/,'upgrade policy must remain an explicit post-render decorator');
assert.match(policy,/setTimeout\(\(\)=>\{try\{injectEditor\(\);decorateGame\(\);wrapChange\(\)\}/,'policy wrapper must delegate then decorate');
assert.doesNotMatch(policy,/rpgStatsList[^\n]{0,120}innerHTML\s*=/,'policy must never replace the canonical stats list');

for(const token of ['data-stat-card','data-name','data-desc','data-add-effect','data-effect-target','damage:melee','damage:ranged']){
  assert.ok(stats.includes(token),`final canonical editor must retain ${token}`);
}

console.log('GenSrpG stats editor single-renderer contract OK: canonical stats renderer + scoped policy decorator');
