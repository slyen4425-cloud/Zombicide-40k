const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const E=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2.js'));
const V=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'));

assert.equal(V.APP_VERSION,'16.78.114.9');
assert.equal(V.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(V.status().observer,false,'V114.9 must not run the broad body observer that froze combat opening');

const chance=36,threshold=65;
assert.equal(V.thresholdForChance(chance,true),threshold);
for(const roll of [65,66,80,92,95,100])assert.equal(V.displayHit(roll,chance,true),true,`${roll} must hit D100 >= ${threshold}`);
for(const roll of [1,20,50,64])assert.equal(V.displayHit(roll,chance,true),false,`${roll} must miss D100 >= ${threshold}`);

const rt={GensRpgTacticalCombatV2:E};
V.patchHitResolver(rt);
function make(){const s=E.createBattle({grid:{width:5,height:4},actors:[
  {id:'h',side:'hero',x:1,y:1,hp:20,initiative:20,attacks:[{id:'a',range:1,hit:36,power:3}]},
  {id:'e',side:'enemy',x:2,y:1,hp:20,initiative:1,defense:0,dodge:0,attacks:[{id:'x',range:1,hit:70,power:1}]}
]});s.config.rollHighToHit=true;return s}
for(const displayRoll of [65,80,92,95,100]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);
  assert.equal(r.hitTarget,65);
  assert.equal(r.hit,true,`visible ${displayRoll} must resolve as a hit`);
}
for(const displayRoll of [1,20,50,64]){
  const s=make(),legacyForced=101-displayRoll,r=E.resolveAttack(s,'h','e','a',legacyForced);
  assert.equal(r.roll,displayRoll);
  assert.equal(r.hit,false,`visible ${displayRoll} must resolve as a miss`);
}

{
  const props={};const fake={style:{setProperty:(p,v,prio)=>{props[p]=[v,prio]}}};
  V.styleWallTile(fake);
  assert.deepEqual(props.visibility,['visible','important']);
  assert.deepEqual(props.opacity,['1','important']);
  assert.deepEqual(props['object-fit'],['cover','important']);
  assert.deepEqual(props['z-index'],['2147483000','important'],'wall bitmap must sit above old pseudo/background layers');
}
{
  const props={};const fake={style:{setProperty:(p,v,prio)=>{props[p]=[v,prio]}}};
  V.styleWallContainer(fake);
  assert.deepEqual(props['background-color'],['#171512','important'],'wall fallback must be dark, never white');
  assert.deepEqual(props.visibility,['visible','important']);
}
{
  let textWrites=0,menuAttr='1';
  const btn={
    hasAttribute:n=>n==='data-close'?false:n==='data-v1143-menu',
    removeAttribute(){},getAttribute:n=>n==='data-v1143-menu'?menuAttr:null,setAttribute:(n,v)=>{if(n==='data-v1143-menu')menuAttr=v},
    get textContent(){return '🏠 Retour menu'},set textContent(v){textWrites++;},
    classList:{remove(){},add(){}}
  };
  const fake={document:{querySelector:()=>btn}};
  assert.equal(V.decorateCombatUi(fake),true);assert.equal(V.decorateCombatUi(fake),true);
  assert.equal(textWrites,0,'idempotent combat decoration must not create endless childList mutations');
}

const visual=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.ok(V.stabilizeWalls,'stable wall IMG installer missing');
assert.ok(V.patchDungeonMapHtml,'pre-DOM Dungeon wall patch missing');
assert.doesNotMatch(visual,/new\s+(?:rt\?\.)?MutationObserver|new\s+MutationObserver/,'V114.9 must not install a broad DOM observer');
assert.match(visual,/z-index","2147483000"/,'wall IMG must be topmost over old wall CSS layers');
assert.match(visual,/dav167870WallCell\.\$\{WALL_CLASS\}>\.\$\{TILE_CLASS\}/,'authored Dungeon wall selector must explicitly override old child hiding');
assert.match(visual,/if\(str\(b\.textContent\)\.trim\(\)!=="🏠 Retour menu"\)/,'menu decoration must be idempotent');
assert.match(visual,/const name=typeof U\.openCurrentEncounter===/,'only one tactical open entry point may be wrapped');
assert.match(integration,/gens-rpg-tactical-visual-dice-16781142\.js\?v=16\.78\.114\.9/,'runtime loader must cache-bust to V114.9');
assert.match(sw,/gensrpg-cache-16\.78\.114\.9-wall-engagement-freeze/,'PWA cache must advance to V114.9');
console.log('V16.78.114.9 visible touch + no engagement observer loop + topmost wall bitmap regression OK');