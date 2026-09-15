const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-polish-1678109.js'),'utf8');

const start=source.indexOf('function ensureStyle(rt=R){');
const end=source.indexOf('function builderWallTargets(rt=R){',start);
assert.ok(start>=0&&end>start,'V109 ensureStyle block missing');
const style=source.slice(start,end);

for(const forbidden of [/WALL_ASSET/,/gtv2Cell\.blocked/,/drc100Grid/,/dav167870WallCell/]){
  assert.doesNotMatch(style,forbidden,`V109 ensureStyle must no longer own wall CSS: ${forbidden}`);
}
for(const required of [/gtv2Hud/,/gtv2109Timeline/,/gtv2109TurnChip/,/gtv2109QuickAttack/,/@media\(max-width:540px\)/]){
  assert.match(style,required,`V109 non-wall presentation must remain intact: ${required}`);
}
assert.match(source,/function paintBuilderWalls\(rt=R\)/,'historical V109 wall painter must remain inspectable');
assert.match(source,/function normalizeRangedAttack\(attack\)/,'V109 range correction must remain');
assert.match(source,/function ensureUnarmedOption\(rt=R\)/,'V109 unarmed equipment UI must remain');
assert.match(source,/function ensureQuickAttack\(rt=R\)/,'V109 quick attack UI must remain');
assert.match(source,/function renderTimeline\(rt=R\)/,'V109 initiative timeline must remain');

console.log('GenSrpG V114.11: V109 residual wall CSS retired; timeline/range/unarmed/quick-attack presentation preserved');
