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
const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  const out=[];
  for(const block of blocks){
    const hits=block.body.match(re);
    if(hits?.length)out.push({id:block.id,count:hits.length,body:block.body});
  }
  return out;
}

function lastOwnerRow(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing Phase 2 last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}

const chain=chainFor('goMenu');
assert.deepEqual(chain.map(x=>x.id),[
  'captureFix139',
  'gensDungeonCore01Js',
  'dungeonCore023StabilityFix',
  'dungeonCore200Rebuild'
],'Core 0.23 pre-audit requires the post-Core-0.30 four-owner chain');
assert.deepEqual(lastOwnerRow('goMenu'),{count:4,last:'dungeonCore200Rebuild'});

const core023=blocks.find(x=>x.id==='dungeonCore023StabilityFix')?.body||'';
assert.match(core023,/const oldGo023=window\.goMenu;/,
  'Core 0.23 must capture the preceding goMenu owner');
assert.match(core023,/window\.goMenu=function\(\)\{[\s\S]*const r=oldGo023\?\.apply\(this,arguments\);/,
  'Core 0.23 must delegate before its Dungeon cleanup');
assert.match(core023,/if\(window\.DungeonCore01\?\.active\)/,
  'Core 0.23 post-delegation cleanup is conditional on the live DungeonCore01 active getter');
assert.match(core023,/document\.body\.style\.overflow=""/);
assert.match(core023,/specialDiceModal[\s\S]*classList\.remove\("open"\)/);
assert.match(core023,/dc01Modal[\s\S]*classList\.remove\("open"\)/);
assert.match(core023,/DungeonCore01\.show\(\)/,
  'Core 0.23 can still re-show Dungeon after the delegated owner returns');
assert.match(core023,/window\.DungeonCore01\.openHero=function/,
  'Core 0.23 has non-goMenu responsibilities that must remain untouched by any future retirement');

const core200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
assert.match(core200,/Object\.defineProperty\(window\.DungeonCore01,'active',\{get:\(\)=>active200\}\)/,
  'Core 0.23 reads the Core 2.00 active state through the replaced public Dungeon API');
assert.match(core200,/const goOutside200=window\.goMenu;/);
assert.match(core200,/window\.goMenu=function\(\)\{if\(active200&&isDungeonMode\?\.\(\)\)[\s\S]*return show\(\)[\s\S]*return goOutside200\?\.apply\(this,arguments\)\}/,
  'Core 2.00 must short-circuit nominal active Dungeon goMenu and delegate outside Dungeon');

const capture=blocks.find(x=>x.id==='captureFix139')?.body||'';
assert.match(capture,/if\(hasActiveSession\(\)&&isCaptureContext138\(\)\)\{[\s\S]*captureEnterWorld139\(\);return;/,
  'Capture 139 must remain the active Capture goMenu owner');

assert.match(e2e,/specialDiceOpen/);
assert.match(e2e,/dc01ModalOpen/);
assert.match(e2e,/old Dungeon save must coexist with Capture/);
assert.match(e2e,/stale Dungeon save must not steal Capture goMenu/);
assert.match(survivalE2e,/Survival goMenu must not enter Dungeon/);
assert.match(workflow,/Caractériser goMenu Dungeon et Capture/);
assert.match(workflow,/Caractériser goMenu Survie/);

const forcesLegacyOpenBeforeGoMenu=
  /specialDiceModal[^\n]{0,180}classList\.add\(['"]open/.test(e2e) ||
  /dc01Modal[^\n]{0,180}classList\.add\(['"]open/.test(e2e);

assert.equal(forcesLegacyOpenBeforeGoMenu,false,
  'Current E2E checks legacy overlays are closed after goMenu but does not force them open first; this gap must stay explicit in the pre-audit');

console.log(JSON.stringify({
  scenario:'Phase 5 goMenu Core 0.23 pre-audit',
  chain:chain.map(x=>x.id),
  classification:{
    nominalDungeon:'Core 2.00 short-circuits before Core 0.23',
    outsideDungeon:'Core 2.00 delegates; Core 0.23 can still post-process if DungeonCore01.active is true',
    core023:'post-delegation Dungeon cleanup, not a pure transit wrapper'
  },
  existingE2e:{
    dungeonReturn:true,
    captureWithStaleDungeonSave:true,
    survivalReturn:true,
    forcesLegacyOverlayOpenBeforeGoMenu:false
  },
  runtimeChanged:false,
  decision:'No Core 0.23 retirement before targeted browser characterization of its remaining post-delegation responsibility'
},null,2));
