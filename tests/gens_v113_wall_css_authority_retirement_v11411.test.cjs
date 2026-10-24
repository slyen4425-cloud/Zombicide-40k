const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');

const start=source.indexOf('function ensureStyle(rt=R){');
const end=source.indexOf('function wallTargets(rt=R){',start);
assert.ok(start>=0&&end>start,'V113 ensureStyle block missing');
const style=source.slice(start,end);

for(const forbidden of [/WALL_ASSET/,/gtv2Cell\.blocked/,/drc100Grid/,/dav167870WallCell/,/gtv2112WallCell/]){
  assert.doesNotMatch(style,forbidden,`V113 ensureStyle must no longer own wall CSS: ${forbidden}`);
}
for(const required of [/gtv2113DiceRow/,/@keyframes gtv2113DiceShake/,/@keyframes gtv2113DiceLand/]){
  assert.match(style,required,`V113 D100 presentation must remain intact: ${required}`);
}
assert.match(source,/function paintWalls\(rt=R\)/,'historical V113 wall painter must remain inspectable');
assert.match(source,/function ensureDetectionHooks\(rt=R\)/,'V113 detection authority must remain');
assert.match(source,/function selectCombatants\(rt=R,options=\{\}\)/,'V113 participant scope authority must remain');

console.log('GenSrpG V114.11: V113 residual wall CSS retired; D100 and detection/scope authority preserved');
