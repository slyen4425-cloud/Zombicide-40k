'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const source=read('index.html');
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const e2e=read('tests/gens_phase5_gomenu_e2e_browser_v1.test.cjs');
const survivalE2e=read('tests/gens_phase5_gomenu_survival_e2e_browser_v1.test.cjs');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2],offset:m.index}));

function block(id){
  const rec=blocks.find(x=>x.id===id);
  assert.ok(rec,'missing inline block '+id);
  return rec;
}
function lastOwnerRow(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}
function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  return blocks.filter(x=>(x.body.match(re)||[]).length).map(x=>x.id);
}

assert.deepEqual(lastOwnerRow('goMenu'),{count:4,last:'dungeonCore200Rebuild'});
assert.deepEqual(chainFor('goMenu'),[
  'captureFix139',
  'gensDungeonCore01Js',
  'dungeonCore023StabilityFix',
  'dungeonCore200Rebuild'
],'current goMenu chain must remain the post-Core-0.30 four-owner chain');

const core023=block('dungeonCore023StabilityFix');
const core200=block('dungeonCore200Rebuild');
assert.ok(core200.offset>core023.offset,'Core 2.00 must load after Core 0.23');

assert.match(core023.body,/const oldGo023=window\.goMenu;/);
assert.match(core023.body,/window\.goMenu=function\(\)\{[\s\S]*const r=oldGo023\?\.apply\(this,arguments\);/);
assert.match(core023.body,/if\(window\.DungeonCore01\?\.active\)/);
assert.match(core023.body,/document\.body\.style\.overflow=""/);
assert.match(core023.body,/specialDiceModal[\s\S]*classList\.remove\("open"\)/);
assert.match(core023.body,/dc01Modal[\s\S]*classList\.remove\("open"\)/);
assert.match(core023.body,/DungeonCore01\.show\(\)/);

assert.match(core023.body,/const oldOpenHero=window\.DungeonCore01\.openHero;/);
assert.match(core023.body,/window\.DungeonCore01\.openHero=function\(id\)/,
  'Core 0.23 historical openHero cleanup must remain characterized');

assert.match(core200.body,/window\.DungeonCore01=\{eligible:[\s\S]*openHero[\s\S]*quit\};/,
  'Core 2.00 must still replace the public DungeonCore01 object after Core 0.23');
assert.match(core200.body,/Object\.defineProperty\(window\.DungeonCore01,'active',\{get:\(\)=>active200\}\)/);

assert.match(core200.body,/const goOutside200=window\.goMenu;/);
assert.match(core200.body,/window\.goMenu=function\(\)\{if\(active200&&isDungeonMode\?\.\(\)\)\{[\s\S]*return show\(\)\}return goOutside200\?\.apply\(this,arguments\)\}/,
  'Core 2.00 must short-circuit nominal active Dungeon goMenu');

const go200=core200.body.match(/const goOutside200=window\.goMenu;([\s\S]*?)window\.dungeonDebug200/);
assert.ok(go200,'Core 2.00 goMenu tail must remain inspectable');
assert.doesNotMatch(go200[1],/specialDiceModal|dc01Modal|body\.style\.overflow/,
  'Core 2.00 goMenu does not explicitly duplicate the legacy Core 0.23 cleanup');

assert.match(e2e,/specialDiceOpen/);
assert.match(e2e,/dc01ModalOpen/);
assert.match(e2e,/stale Dungeon save must not steal Capture goMenu/);
assert.match(survivalE2e,/Survival goMenu must not enter Dungeon/);

const forcesLegacyOpenBeforeGoMenu=
  /specialDiceModal[^\n]{0,180}classList\.add\(['"]open/.test(e2e) ||
  /dc01Modal[^\n]{0,180}classList\.add\(['"]open/.test(e2e);
assert.equal(forcesLegacyOpenBeforeGoMenu,false,
  'existing E2E still checks clean postconditions without proving a real path that opens the legacy overlays first');

console.log(JSON.stringify({
  scenario:'Phase 5 Core 0.23 goMenu revalidation on current GREEN runtime',
  chain:chainFor('goMenu'),
  nominalDungeon:'Core 2.00 intercepts before Core 0.23',
  core023Remaining:'post-delegation cleanup if current DungeonCore01.active is true',
  openHero023:'historical wrapper is superseded by later Core 2.00 DungeonCore01 replacement',
  evidenceGap:'real reachability of legacy overlay/overflow cleanup before goMenu',
  runtimeChanged:false,
  decision:'no retirement before dedicated browser characterization'
},null,2));
