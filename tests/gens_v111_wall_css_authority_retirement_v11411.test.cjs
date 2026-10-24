const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-fixes-1678111.js'),'utf8');

const start=source.indexOf('function ensureStyle(rt=R){');
const end=source.indexOf('function paintWalls(rt=R){',start);
assert.ok(start>=0&&end>start,'V111 ensureStyle block missing');
const style=source.slice(start,end);

for(const forbidden of [/WALL_ASSET/,/WALL_SIZE/,/gtv2Cell\.blocked/,/drc100Grid/,/dav167870WallCell/]){
  assert.doesNotMatch(style,forbidden,`V111 ensureStyle must no longer own wall CSS: ${forbidden}`);
}
for(const required of [/gtv2109QuickAttack/,/gtv2110Dock/,/gtv2111Dock/,/gtv2111DiceRow/,/@media\(max-width:430px\)/]){
  assert.match(style,required,`V111 non-wall presentation must remain intact: ${required}`);
}
assert.match(source,/function paintWalls\(rt=R\)/,'historical V111 wall painter must remain inspectable');
assert.match(source,/function hookMultiDice\(rt=R\)/,'V111 multi-dice authority must remain');
assert.match(source,/function ensureDock\(rt=R\)/,'V111 action dock must remain');
assert.match(source,/function refreshBattleAttacks\(rt=R,battle=currentBattle\(rt\)\)/,'V111 attack refresh must remain');

console.log('GenSrpG V114.11: V111 residual wall CSS retired; multi-dice/dock/refresh presentation preserved');
