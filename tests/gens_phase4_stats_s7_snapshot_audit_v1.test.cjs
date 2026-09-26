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
  .update(Buffer.concat([Buffer.from('blob '+bytes.length),Buffer.from([0]),bytes]))
  .digest('hex');

assert.equal(bytes.length,8170350,'S7 must audit the exact verified Phase 7 index');
assert.equal(blob,'e513d23c7a8c7aef9a187202bbcc34ab540e856f','S7 index blob must remain the current Phase 7 verified source');

for(const text of [
  'function dungeonCombatHeroSnapshot(heroId){',
  'force:dungeonAttributeValue("force")',
  'defense:dungeonDerivedDefense()',
  'armor:dungeonArmorScore()',
  'maxMana:dungeonMaxMana()'
]){
  assert.ok(index.includes(text),'inline Dungeon snapshot contract missing: '+text);
}

for(const text of [
  'function heroSnapshot(rt,id){',
  'typeof rt?.dungeonCombatHeroSnapshot==="function"',
  'const rec=heroRecord(rt,id),s=heroSnapshot(rt,id)',
  'canonicalStat(rt,id,"movement",3)',
  'function weaponHitProfile('
]){
  assert.ok(adapter.includes(text),'Adapter snapshot contract missing: '+text);
}

for(const text of [
  'function buildHeroSnapshot(rt=R,heroId="",actor=null){',
  'api.coreSnapshot(id)',
  'core.canonical',
  'core.values',
  'core.derived',
  'effectiveMaxWounds','dungeonDerivedInitiative','dungeonDerivedDefense',
  'dungeonArmorScore',
  'function applyHeroSnapshot(actor,snap,',
  'return decorateBattle(rt,b,{force:true})',
  'dirtyHeroes.has(id)',
  'actor?.meta?.rpgStats?.version!==SNAPSHOT_VERSION'
]){
  assert.ok(v110.includes(text),'V110 snapshot contract missing: '+text);
}
for(const removed of [
  'dungeonDodgeChance','dungeonCriticalChance','dungeonMagicResistance',
  'dungeonMaxMana','dungeonPhysicalDamageBonus','dungeonMagicDamageBonus'
]){
  assert.equal(v110.includes(removed),false,'S11 raccord must remove redundant V110 Dungeon read: '+removed);
}

for(const field of ['movement','initiative','defense','armor','dodge']){
  assert.ok(v110.includes('actor.'+field),'V110 must reapply actor '+field);
}

assert.ok(
  integration.includes('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js?v=16.78.110'),
  'active integration must load V110'
);

const dormant='assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js';
assert.ok(graph.includes("'"+dormant+"'"),'V114.5 snapshot repair must remain inventoried');
const nonReachableStart=graph.indexOf('assert.deepEqual(notReachablePhase2');
const nonReachableEnd=graph.indexOf("],'Phase 2 non-reachable production JS inventory drifted'",nonReachableStart);
assert.ok(nonReachableStart>=0&&nonReachableEnd>nonReachableStart,'Phase 2 non-reachable inventory block missing');
assert.ok(graph.slice(nonReachableStart,nonReachableEnd).includes(dormant),'V114.5 must remain production-unreachable');

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
  v110ConsumesCoreSnapshot:true,
  v110ReappliesActorStats:true,
  v110CachedAfterBuild:true,
  v1145Dormant:true,
  attackPathExcluded:true
},null,2));
