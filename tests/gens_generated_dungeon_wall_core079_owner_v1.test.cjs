'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Core 0.79 IS the sole owner of procedural Dungeon floor/cover/wall art.
// Exercise the real inline script without monkey-patching it or borrowing the
// Builder's runtime wall painter as a competing authority.
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script id="dungeonCore079MapPolish">([\s\S]*?)<\/script>/);
assert.ok(script,'canonical 0.79 visual owner is present in the exact assembled HTML');
const style=html.match(/<style id="dungeonCore079MapCss">([\s\S]*?)<\/style>/);
assert.ok(style,'canonical 0.79 style remains present');
assert.match(script[1],/dng_wall_block\.jpg/,'walls must reuse the existing Builder wall material');
assert.match(style[1],/dc079WallBlock/,'procedural walls need their own sizing without changing themed covers');

function fakeCell(kind){
  const names=new Set([kind]);
  return {
    classList:{contains:x=>names.has(x),add:x=>names.add(x),remove:x=>names.delete(x)},
    style:{backgroundImage:''},
    dataset:{},
    classes:names
  };
}
function scenario(theme){
  const cells=['wall','cover','floor'].map(fakeCell);
  const ctx={console,document:{readyState:'loading',querySelectorAll:()=>cells,addEventListener(){}},
    loadDungeonConfig:()=>({environment:theme}),
    loadDungeonState:()=>({room:3}),
    MutationObserver:class{observe(){}},
    requestAnimationFrame:()=>{}};
  ctx.window=ctx;
  vm.runInNewContext(script[1],ctx,{timeout:2500});
  assert.equal(typeof ctx.applyDungeonMapPolish079,'function');
  ctx.applyDungeonMapPolish079();
  assert.match(cells[0].style.backgroundImage,/\/dng_wall_block\.jpg"/,'generated wall uses Builder validated block material');
  assert.ok(cells[0].classList.contains('dc079WallBlock'),'wall gets its unique material class');
  assert.ok(!cells[0].classList.contains('dc079TerrainCover'),'wall never masquerades as a cover');
  assert.match(cells[1].style.backgroundImage,/\/dng_floor_(?:stone|cave|forest|water|ice|lava)_\d\d\.png"/,'cover keeps its themed texture');
  assert.ok(cells[1].classList.contains('dc079TerrainCover'),'cover remains a cover');
  assert.ok(!cells[1].classList.contains('dc079WallBlock'),'cover never acquires wall material');
  assert.match(cells[2].style.backgroundImage,/\/dng_floor_\w+_\d\d\.png"/,'normal floor remains themed floor');
  assert.ok(!cells[2].classList.contains('dc079WallBlock'),'floor does not acquire wall class');
  const first=cells.map(c=>c.style.backgroundImage);
  ctx.applyDungeonMapPolish079();
  assert.deepEqual(cells.map(c=>c.style.backgroundImage),first,'a repeated canonical repaint is stable');
}
for(const theme of ['stone','cave','forest','water','ice','lava'])scenario(theme);
const authoredSource=fs.readFileSync(path.join(__dirname,'..','assets/dungeon/dungeon-source-render-stability-167877.js'),'utf8');
assert.match(authoredSource,/const WALL_ASSET=FLOOR_ROOT\+"dng_wall_block\.jpg"/,'Builder keeps exactly the same material');
assert.match(authoredSource,/if\(isWall\)/,'authored wall path remains unchanged');
console.log('Core 0.79 one terrain owner: generated walls share Builder JPEG, covers and floors stay themed, authored owner intact');
