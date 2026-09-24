const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
const text=rel=>read(rel).toString('utf8');

const manifest=JSON.parse(text('docs/GENSRPG_PHASE2_STORAGE_OWNERS.json'));
assert.deepEqual(manifest.totals,{
  totalAccesses:181,
  resolvedAccesses:116,
  unresolvedAccesses:65,
  distinctResolvedKeys:19
},'Phase 4 storage totals must match post-Economy-Rules state');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:151,resolved:101,unresolved:50,distinctKeys:11
},'Dungeon storage totals drifted');

const index=read('index.html');
const header=Buffer.from('blob '+index.length+'\0');
const blobSha=crypto.createHash('sha1').update(Buffer.concat([header,index])).digest('hex');
assert.equal(index.length,8170730,'index.html byte size drifted from Phase 6 Survival wave-rules extraction baseline');
assert.equal(blobSha,'7663392f163aac32c4c3b918cbce67472856b3b6','index.html blob must remain the Phase 6 Survival wave-rules extraction source');


const deckStart=index.toString('utf8').indexOf('const DUNGEON_DECK_KEY="gensrpg_dungeon_deck_v1";');
const deckEnd=index.toString('utf8').indexOf('function dungeonEligibleLootItemsForRarity',deckStart);
assert.ok(deckStart>=0&&deckEnd>deckStart,'Dungeon deck storage block must remain locatable');
const deckBlock=index.toString('utf8').slice(deckStart,deckEnd);
assert.equal((deckBlock.match(/localStorage\.getItem\(DUNGEON_DECK_KEY\)/g)||[]).length,0,'Migrated Dungeon deck must have no direct read');
assert.equal((deckBlock.match(/localStorage\.setItem\(DUNGEON_DECK_KEY/g)||[]).length,0,'Migrated Dungeon deck must have no direct write');
assert.equal((deckBlock.match(/GensStorageV1\.readJson\(localStorage,DUNGEON_DECK_KEY,null\)/g)||[]).length,1,'Dungeon deck must use one Core JSON read');
assert.equal((deckBlock.match(/GensStorageV1\.writeJson\(localStorage,DUNGEON_DECK_KEY,ds\)/g)||[]).length,2,'Dungeon deck must use two Core JSON writes');
assert.match(deckBlock,/if\(!ds\|\|!ds\.remaining\)ds=\{remaining:\{\},createdAt:Date\.now\(\)\}/,'Dungeon remains owner of deck initialization');
assert.equal(deckBlock.includes('gensrpg_dungeon_runtime_v2'),false,'Dungeon deck raccord must not touch deferred runtime_v2');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
assert.equal(keys.has('gensrpg_dungeon_deck_v1'),false,'migrated Dungeon deck key must leave direct-storage manifest');
assert.equal(keys.has('gensrpg_manual_mj_effects_v1'),false,'migrated Manual MJ key must leave direct-storage manifest');
assert.equal(keys.has('gensrpg_dungeon_economy_rules_160'),false,'migrated Economy rules key must leave direct-storage manifest');
assert.equal(keys.has('gensrpg_challenge_library_v1'),false,'migrated Challenge Library key must leave direct-storage manifest');
for(const key of [
  'gensrpg_rpg_gameplay_by_profile_v1'
]){
  assert.ok(keys.has(key),'candidate key missing from storage manifest: '+key);
}
for(const key of [
  'gensrpg_dungeon_runtime_v2',
  'gensrpg_forced_mode_reload_155',
  'gensrpg_game_profile_active_v1',
  'gensrpg_last_html_build'
]){
  assert.ok(keys.has(key),'deferred/excluded key missing from storage manifest: '+key);
}

const runtime=keys.get('gensrpg_dungeon_runtime_v2');
assert.ok(runtime.sources.length>20,'Dungeon runtime remains a broad shared storage family requiring dedicated audit');

const stats=text('assets/gensrpg/gens-rpg-stats-clean-167874.js');
assert.match(stats,/localStorage\.setItem\(R\.key\(hero\)/,'Stats dynamic hero persistence must remain deferred to Stats lot');

const tactical=text('assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js');
assert.match(tactical,/gensrpg_dungeon_runtime_v2/,'Tactical adapter must remain coupled to deferred Dungeon runtime in this audit');
assert.match(tactical,/rt\.key\(id\)/,'Tactical adapter dynamic hero state remains outside storage-only audit');

const repair=text('assets/gensrpg/gens-rpg-runtime-repair-1678106.js');
assert.match(repair,/gensrpg_game_profiles_v1/);
assert.match(repair,/gensrpg_game_profile_active_v1/);
assert.match(repair,/gensrpg_session_family_guard_v1/);

console.log(JSON.stringify({
  scenario:'Phase 4 storage next audit 3',
  indexBlob:blobSha,
  totals:manifest.totals,
  migrated:['gensrpg_dungeon_deck_v1','gensrpg_manual_mj_effects_v1','gensrpg_dungeon_economy_rules_160','gensrpg_challenge_library_v1'],
  candidates:[
    'gensrpg_rpg_gameplay_by_profile_v1'
  ],
  deferred:['gensrpg_dungeon_runtime_v2','Stats dynamic state','Tactical mixed state','Runtime Repair mixed scalar/JSON']
},null,2));
