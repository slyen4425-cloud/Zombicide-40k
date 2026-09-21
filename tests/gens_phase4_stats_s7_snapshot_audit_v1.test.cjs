const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const index=read('index.html');
const adapter=read('assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js');
const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const graph=read('tests/gens_phase2_runtime_load_graph_v11411.test.cjs');

const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1')
  .update(Buffer.concat([Buffer.from('blob '+bytes.length+'\\0'),bytes]))
  .digest('hex');

assert.equal(bytes.length,8174580,'S7 must audit the exact verified index');
assert.equal(blob,'5b9b9ae780f735eadef049afeb10acf0b57441fe','S7 index blob must remain the Rule 26 verified source');

assert.match(index,/function dungeonCombatHeroSnapshot\\(heroId\\)\\{/,'inline Dungeon hero snapshot owner must exist');
assert.match(index,/force:dungeonAttributeValue\\("force"\\)/,'Dungeon snapshot must read canonical attribute seam');
assert.match(index,/defense:dungeonDerivedDefense\\(\\)/,'Dungeon snapshot must read Defense before Tactical');
assert.match(index,/armor:dungeonArmorScore\\(\\)/,'Dungeon snapshot must read Armor before Tactical');
assert.match(index,/maxMana:dungeonMaxMana\\(\\)/,'Dungeon snapshot must read max mana before Tactical');

assert.match(adapter,/function heroSnapshot\\(rt,id\\)\\{/,'Adapter heroSnapshot owner must exist');
assert.match(adapter,/typeof rt\\?\\.dungeonCombatHeroSnapshot==="function"/,'Adapter must prefer the inline Dungeon snapshot');
assert.match(adapter,/const rec=heroRecord\\(rt,id\\),s=heroSnapshot\\(rt,id\\)/,'heroActor must consume the first snapshot');
assert.match(adapter,/canonicalStat\\(rt,id,"movement",3\\)/,'Adapter must still expose its historical canonical fallback');
assert.match(adapter,/function weaponHitProfile\\(/,'attack hit construction must remain a separate Adapter concern');

assert.match(v110,/function buildHeroSnapshot\\(rt=R,heroId="",actor=null\\)\\{/,'V110 second snapshot builder must exist');
assert.match(v110,/api\\.value\\(id,sid\\)/,'V110 must reread canonical Stats in its snapshot builder');
for(const seam of [
  'effectiveMaxWounds','dungeonDerivedInitiative','dungeonDerivedDefense','dungeonArmorScore',
  'dungeonDodgeChance','dungeonCriticalChance','dungeonMagicResistance','dungeonMaxMana',
  'dungeonPhysicalDamageBonus','dungeonMagicDamageBonus'
]){
  assert.ok(v110.includes(seam),'V110 snapshot must retain characterized read: '+seam);
}
assert.match(v110,/function applyHeroSnapshot\\(actor,snap,/,'V110 apply snapshot owner must exist');
for(const field of ['movement','initiative','defense','armor','dodge']){
  assert.ok(v110.includes('actor.'+field),'V110 must reapply actor '+field);
}
assert.match(v110,/return decorateBattle\\(rt,b,\\{force:true\\}\\)/,'V110 must decorate after Adapter createBattle');
assert.match(v110,/dirtyHeroes\\.has\\(id\\)/,'V110 cached snapshot invalidation must remain characterized');
assert.match(v110,/actor\\?\\.meta\\?\\.rpgStats\\?\\.version!==SNAPSHOT_VERSION/,'V110 versioned snapshot reuse must remain characterized');

assert.match(integration,/gens-rpg-tactical-combat-v2-stats-1678110\\.js\\?v=16\\.78\\.110/,'active integration must load V110');
assert.ok(graph.includes("'assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js'"),'V114.5 snapshot repair must remain explicitly inventoried');
const nonReachableStart=graph.indexOf('assert.deepEqual(notReachablePhase2');
const nonReachableEnd=graph.indexOf("],'Phase 2 non-reachable production JS inventory drifted'",nonReachableStart);
assert.ok(nonReachableStart>=0&&nonReachableEnd>nonReachableStart,'Phase 2 non-reachable inventory block missing');
assert.ok(graph.slice(nonReachableStart,nonReachableEnd).includes('gens-rpg-tactical-wall-dice-stats-16781145.js'),'V114.5 must remain production-unreachable');

for(const rel of [
  'assets/gensrpg/core/stats-value-engine-v1.js',
  'assets/gensrpg/core/stats-hero-values-v1.js',
  'assets/gensrpg/core/stats-modifier-provider-v1.js',
  'assets/gensrpg/core/stats-derived-values-v1.js'
]){
  assert.ok(graph.includes("'"+rel+"'"),'existing Core Stats service must remain classified: '+rel);
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S7 snapshot-chain audit',
  verifiedInlineSource:true,
  dungeonSnapshotFirst:true,
  adapterConsumesDungeonSnapshot:true,
  v110SecondSnapshot:true,
  v110ReappliesActorStats:true,
  v110CachedAfterBuild:true,
  v1145Dormant:true,
  attackPathExcluded:true
},null,2));
