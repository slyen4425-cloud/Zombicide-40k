const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const R=require(path.join(root,'assets','gensrpg','gens-rpg-dungeon-interaction-wall-reset-167811413.js'));

assert.equal(R.APP_VERSION,'16.78.114.13');
assert.equal(R.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.ok(Math.max(...R.RETRIES)>600,'reset must run after V114.12 wall-hook retries');
assert.ok(R.NAV_RETRIES.length>=3,'hero/quit routes need post-click verification');

function native(){return 'native'}
function oldWall(){return 'old-wall'}
oldWall.__gtv271WallPatch=true;oldWall.__original=native;
function postWall(){return oldWall()}
postWall.__gensRpg11412WallPostRender=true;postWall.__original=oldWall;
const unwrapped=R.unwrapMarked(postWall,['__gensRpg11412WallPostRender','__gtv271WallPatch']);
assert.equal(unwrapped.fn,native);
assert.equal(unwrapped.count,2,'both accumulated wall wrappers must be removable');

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-dungeon-interaction-wall-reset-167811413.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.doesNotMatch(source,/MutationObserver|setInterval\s*\(/,'reset must not add another observer or interval');
assert.match(source,/background-image:url\('\$\{WALL_ASSET\}'\)!important/,'wall texture must be a direct cell background like floor');
assert.match(source,/\.dc047Cell\.wall>\*\{visibility:hidden!important/,'old floor/image children cannot cover exploration walls');
assert.match(source,/\.gtv2Cell\.blocked>\.gtv2WallTile[^\n]*display:none!important/,'old tactical wall IMG cannot remain a visible owner');
assert.match(source,/restoreNativeMapRenderer/);
assert.match(source,/restoreDungeonRenderers/);
assert.match(source,/stopImmediatePropagation/,'hero card capture route must bypass stale click owners');
assert.match(source,/forceRootHome/,'save/quit must have a deterministic root-home fallback');
assert.match(source,/verifyQuitRoute/);
assert.match(integration,/gens-rpg-dungeon-interaction-wall-reset-167811413\.js\?v=16\.78\.114\.13/,'V114.13 reset must load last after tactical UX');
assert.ok(integration.indexOf('loadVisualDice11412')<integration.indexOf('loadReset11413')||integration.includes('loadReset11413()'),'V114.13 reset loader must be chained after V114.12');
assert.match(sw,/gensrpg-cache-16\.78\.114\.13-interaction-wall-reset/,'PWA cache must rotate');
assert.match(sw,/gens-rpg-dungeon-interaction-wall-reset-167811413\.js/,'reset module must be cached');

console.log('V16.78.114.13 wall renderer reset + hero sheet + save/quit navigation guards OK');
