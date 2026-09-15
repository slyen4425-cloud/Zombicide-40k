const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');

const start=source.indexOf('function ensureStyle(rt=R){');
const end=source.indexOf('function markWallCells(rt=R){',start);
assert.ok(start>=0&&end>start,'V112 ensureStyle block missing');
const style=source.slice(start,end);

for(const forbidden of [/WALL_ASSET/,/gtv2Cell\.blocked/,/drc100Grid/,/dav167870WallCell/,/gtv2112WallCell/]){
  assert.doesNotMatch(style,forbidden,`V112 ensureStyle must no longer own wall CSS: ${forbidden}`);
}
for(const required of [/gtv2111Dock/,/gtv2112TrueSheet/,/gtv2112StatGrid/,/gtv2112Explain/,/@media\(max-width:430px\)/]){
  assert.match(style,required,`V112 non-wall presentation must remain intact: ${required}`);
}
assert.match(source,/function markWallCells\(rt=R\)/,'historical V112 wall marker must remain inspectable');
assert.match(source,/function patchDetail\(rt=R\)/,'V112 detail sheet behavior must remain');
assert.match(source,/function patchDice\(rt=R\)/,'V112 damage explanation behavior must remain');
assert.match(source,/function applyRuntimePositions\(rt=R,battle=null,selection=null\)/,'V112 spatial behavior must remain');

console.log('GenSrpG V114.11: V112 residual wall CSS retired; spatial/detail/explanation presentation preserved');
