const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const main=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const clean=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-clean-167874.js'),'utf8');
const v110=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');
const graph=fs.readFileSync(path.join(root,'tests','gens_phase2_runtime_load_graph_v11411.test.cjs'),'utf8');

const modules=[
  'stats-value-engine-v1.js',
  'stats-hero-values-v1.js',
  'stats-modifier-provider-v1.js',
  'stats-derived-values-v1.js',
  'stats-snapshot-v1.js'
];

function before(text,a,b,label){
  const ia=text.indexOf(a),ib=text.indexOf(b);
  assert.ok(ia>=0,label+' missing '+a);
  assert.ok(ib>=0,label+' missing '+b);
  assert.ok(ia<ib,label+' must load '+a+' before '+b);
}

for(const name of modules){
  assert.ok(main.includes(name),'Pages composition must load '+name);
  assert.ok(preview.includes(name),'preview composition must load '+name);
  before(main,name,'gens-rpg-stats-clean-167874.js','Pages');
  before(preview,name,'gens-rpg-stats-clean-167874.js','preview');
}

assert.match(clean,/function coreSnapshot\(/,'Stats owner must expose one runtime adapter into Core S3-S7');
assert.ok(clean.includes('GensStatsValueEngineV1'));
assert.ok(clean.includes('GensStatsHeroValuesV1'));
assert.ok(clean.includes('GensStatsModifierProviderV1'));
assert.ok(clean.includes('GensStatsDerivedValuesV1'));
assert.ok(clean.includes('GensStatsSnapshotV1'));
assert.match(clean,/coreSnapshot[^\n]*installRuntime|installRuntime[^\n]*coreSnapshot/,'public Stats API must expose coreSnapshot');

assert.match(v110,/api\?\.coreSnapshot|api\.coreSnapshot/,'V110 must receive canonical values and stable derived fields from the Stats/Core adapter');
for(const forbidden of [
  'dungeonPhysicalDamageBonus',
  'dungeonMagicDamageBonus',
  'dungeonMaxMana',
  'dungeonCriticalChance',
  'dungeonDodgeChance',
  'dungeonMagicResistance'
]){
  assert.equal(v110.includes(forbidden),false,'V110 must stop rereading Dungeon derived helper: '+forbidden);
}
assert.ok(v110.includes('physicalDamageBonus'));
assert.ok(v110.includes('magicDamageBonus'));
assert.match(v110,/core\.values|core\?\.values/);

const connectedStart=graph.indexOf('const phase4ConnectedServices=[');
const inertStart=graph.indexOf('const phase4InertServices=[');
for(const name of modules){
  const rel='assets/gensrpg/core/'+name;
  const pos=graph.indexOf("'"+rel+"'");
  assert.ok(pos>connectedStart&&pos<inertStart,'runtime graph must classify connected Core service: '+name);
}

console.log(JSON.stringify({
  scenario:'Phase 4 S11 Core Snapshot authority raccord',
  productionLoadsCoreS3S7:true,
  statsOwnerProvidesCoreSnapshot:true,
  v110ConsumesCoreSnapshot:true,
  dungeonDerivedRereadsRemoved:6,
  initiativeMigrationDeferred:true
},null,2));
