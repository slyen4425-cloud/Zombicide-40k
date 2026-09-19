const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function block(id){
  const start=index.indexOf('id="'+id+'"');
  assert.ok(start>=0,'missing inline block '+id);
  const end=index.indexOf('</script>',start);
  assert.ok(end>start,'unterminated inline block '+id);
  return index.slice(start,end);
}

const b213=block('dungeonCore213Stability');
const b214=block('dungeonCore214SingleAuthority');
const b309=block('dungeonCore309VisualFixes');
const b310=block('dungeonCore310PersistenceAndTokens');

for(const [id,b] of [['2.13',b213],['2.14',b214],['3.10',b310]]){
  assert.doesNotMatch(
    b,
    /dungeon_aldren\s*:\s*(?:ROOT\+)?["']dng_aldren\.png["']/,
    'Core '+id+' must not duplicate the built-in Dungeon hero asset map'
  );
  assert.match(
    b,
    /GensAssetResolverV1\.dungeonHeroPath\(/,
    'Core '+id+' must delegate built-in Dungeon hero paths to the Core resolver'
  );
}

for(const [id,b] of [['3.09',b309],['3.10',b310]]){
  assert.doesNotMatch(
    b,
    /ROOT\+String\(e\.enemyId\)\+["']\.png["']/,
    'Core '+id+' must not synthesize built-in Dungeon enemy paths'
  );
  assert.match(
    b,
    /GensAssetResolverV1\.dungeonCreaturePath\(/,
    'Core '+id+' must delegate built-in Dungeon enemy paths to the Core resolver'
  );
}

assert.match(b213,/if\(c\.image\|\|c\.avatar\)return c\.image\|\|c\.avatar/,'Core 2.13 custom hero art must remain first');
assert.match(b214,/if\(c\.image\|\|c\.avatar\)return c\.image\|\|c\.avatar/,'Core 2.14 custom hero art must remain first');
assert.match(b310,/return d\.image\|\|d\.avatar\|\|/,'Core 3.10 custom hero art must remain first');
assert.match(b309,/return d\?\.art\|\|d\?\.image_data\|\|d\?\.image\|\|d\?\.avatar\|\|/,'Core 3.09 enemy definition art priority must remain unchanged');
assert.match(b310,/gensDungeonCreatureArt165/,'Core 3.10 must retain the historical custom creature override resolver ahead of the Core fallback');

console.log(JSON.stringify({
  scenario:'Phase 4 B.5 late token asset resolver owner',
  heroOwners:['dungeonCore213Stability','dungeonCore214SingleAuthority','dungeonCore310PersistenceAndTokens'],
  enemyOwners:['dungeonCore309VisualFixes','dungeonCore310PersistenceAndTokens']
},null,2));
