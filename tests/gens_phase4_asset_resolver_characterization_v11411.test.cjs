const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');

function block(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\']'+id+'["\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'inline block missing: '+id);
  return m[1];
}

const b164=block('dungeonGithubArts164');
const b165=block('dungeonArtRenderFix165');
const b166=block('dungeonDirectImageBinding166');
const b168=block('dungeonHeroItemAssets168Marker');
const heroRepair=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const authoredVisual=read('assets/dungeon/dungeon-authored-cache-visual-167852.js');
const sourceStability=read('assets/dungeon/dungeon-source-render-stability-167877.js');
const tacticalUi=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');

assert.match(b164,/window\.dungeonAutoArtPath164=function\(id\)/);
assert.match(b164,/assets\/dungeon\/creatures\/["']?\+id\+["']?\.png/);
assert.match(b164,/custom\s*\|\|\s*dungeonAutoArtPath164\(id\)/);

assert.match(b165,/const artPath=id=>["']assets\/dungeon\/creatures\//);
assert.match(b165,/window\.gensDungeonCreatureArt165=function\(defOrId\)/);
assert.match(b165,/customOverride\(id\)\|\|artPath\(id\)/);

assert.match(b166,/const dungeonPath166=id=>["']assets\/dungeon\/creatures\//);
assert.match(b166,/function customArt166\(id,def\)/);
assert.match(b166,/return customArt166\(id,def\)\|\|dungeonPath166\(id\)/);

assert.match(b168,/GENSRPG_DUNGEON_ASSET_ROOT_168=["']assets\/dungeon\/creatures\//);

assert.match(heroRepair,/const HERO_ART=\{dungeon_aldren:["']assets\/dungeon\/creatures\/dng_aldren\.png/);
assert.match(authoredVisual,/const FLOOR_ROOT=["']assets\/dungeon\/creatures\//);
assert.match(sourceStability,/const FLOOR_ROOT=["']assets\/dungeon\/creatures\//);
assert.match(sourceStability,/gensDungeonCreatureArt165/);
assert.match(tacticalUi,/const WALL_ASSET=["']assets\/dungeon\/creatures\/dng_wall_block\.jpg/);
assert.match(tacticalUi,/const HERO_ART=\{/);
assert.match(tacticalUi,/return ["']assets\/dungeon\/creatures\/["']\+enemyId\+["']\.png/);

assert.equal(index.includes('assets/gensrpg/core/asset-resolver-v1.js'),false,'Core asset resolver must not exist in the baseline characterization');

console.log(JSON.stringify({
  scenario:'Phase 4 asset resolver baseline characterization',
  inlineDuplicatePathOwners:[
    'dungeonGithubArts164',
    'dungeonArtRenderFix165',
    'dungeonDirectImageBinding166'
  ],
  moduleRootMarker:'dungeonHeroItemAssets168Marker',
  externalVisualConsumers:[
    'gens-dungeon-hero-art-repair-167874.js',
    'dungeon-authored-cache-visual-167852.js',
    'dungeon-source-render-stability-167877.js',
    'gens-rpg-tactical-combat-v2-ui.js'
  ],
  coreResolverPresent:false
},null,2));
