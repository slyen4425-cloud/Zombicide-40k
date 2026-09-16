const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const stats=read('assets/gensrpg/gens-rpg-stats-clean-167874.js');
const art=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const policy=read('assets/gensrpg/gens-stat-upgrade-policy-167898.js');

assert.match(stats,/wrap\("renderRpgUniverseEditor"/,'canonical stats module must remain the sole wrapper of renderRpgUniverseEditor');
assert.doesNotMatch(art,/\["ensureDungeonHeroes"[\s\S]*?"renderRpgUniverseEditor"/,'hero-art bridge must not wrap the stats editor lifecycle');
assert.doesNotMatch(art,/\["ensureDungeonHeroes"[\s\S]*?"saveRpgUniverseStats"/,'hero-art bridge must not wrap stats saving');
assert.doesNotMatch(policy,/\["renderRpgUniverseEditor","saveRpgUniverseStats"/,'upgrade-policy decorator must not wrap the canonical stats editor lifecycle');
assert.match(stats,/GensStatUpgradePolicy167898\?\.injectEditor/,'canonical rich renderer must explicitly invite the upgrade-policy decorator');
assert.match(stats,/GensDungeonHeroArtRepair167874\?\.cleanupLegacyRpgEditor/,'canonical rich renderer must explicitly invite scoped legacy cleanup');

for(const token of ['data-stat-card','data-name','data-desc','data-add-effect','data-effect-target','damage:melee','damage:ranged']){
  assert.ok(stats.includes(token),`final canonical editor must retain ${token}`);
}

console.log('GenSrpG stats editor single-authority contract OK');
