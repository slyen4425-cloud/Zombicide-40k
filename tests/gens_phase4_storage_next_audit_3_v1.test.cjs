const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
const text=rel=>read(rel).toString('utf8');

const manifest=JSON.parse(text('docs/GENSRPG_PHASE2_STORAGE_OWNERS.json'));
assert.deepEqual(manifest.totals,{
  totalAccesses:203,
  resolvedAccesses:138,
  unresolvedAccesses:65,
  distinctResolvedKeys:27
},'Phase 4 storage totals must match post-Primary-Selection GREEN state');

assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:171,resolved:121,unresolved:50,distinctKeys:19
},'Dungeon storage totals drifted');

const index=read('index.html');
const header=Buffer.from('blob '+index.length+'\0');
const blobSha=crypto.createHash('sha1').update(Buffer.concat([header,index])).digest('hex');
assert.equal(index.length,8174618,'index.html byte size drifted from audited checkpoint');
assert.equal(blobSha,'5d2b0a6da51fd70bd36f087cb9ab82a1af308226','index.html blob must remain the exact audited source');


const deckStart=index.toString('utf8').indexOf('const DUNGEON_DECK_KEY="gensrpg_dungeon_deck_v1";');
const deckEnd=index.toString('utf8').indexOf('function dungeonEligibleLootItemsForRarity',deckStart);
assert.ok(deckStart>=0&&deckEnd>deckStart,'Dungeon deck storage block must remain locatable');
const deckBlock=index.toString('utf8').slice(deckStart,deckEnd);
assert.equal((deckBlock.match(/localStorage\.getItem\(DUNGEON_DECK_KEY\)/g)||[]).length,1,'Dungeon deck candidate must have exactly one direct read before migration');
assert.equal((deckBlock.match(/localStorage\.setItem\(DUNGEON_DECK_KEY/g)||[]).length,2,'Dungeon deck candidate must have exactly two direct writes before migration');
assert.match(deckBlock,/JSON\.parse\(localStorage\.getItem\(DUNGEON_DECK_KEY\)\|\|"null"\)/,'Dungeon deck read fallback must remain null before migration');
assert.match(deckBlock,/if\(!ds\|\|!ds\.remaining\)ds=\{remaining:\{\},createdAt:Date\.now\(\)\}/,'Dungeon remains owner of deck initialization');
assert.equal(deckBlock.includes('gensrpg_dungeon_runtime_v2'),false,'Dungeon deck candidate must not touch deferred runtime_v2');

const keys=new Map((manifest.resolvedKeys||[]).map(x=>[x.key,x]));
for(const key of [
  'gensrpg_dungeon_deck_v1',
  'gensrpg_dungeon_economy_rules_160',
  'gensrpg_manual_mj_effects_v1',
  'gensrpg_rpg_gameplay_by_profile_v1',
  'gensrpg_challenge_library_v1'
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
  candidates:[
    'gensrpg_dungeon_deck_v1',
    'gensrpg_dungeon_economy_rules_160',
    'gensrpg_manual_mj_effects_v1',
    'gensrpg_rpg_gameplay_by_profile_v1',
    'gensrpg_challenge_library_v1'
  ],
  deferred:['gensrpg_dungeon_runtime_v2','Stats dynamic state','Tactical mixed state','Runtime Repair mixed scalar/JSON']
},null,2));
