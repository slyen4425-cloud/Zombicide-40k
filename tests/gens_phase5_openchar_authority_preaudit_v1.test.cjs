'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=fs.readFileSync(path.join(root,'index.html'));

function gitBlob(buf){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}

assert.equal(bytes.length,8172500,'openChar preaudit must target the exact Dungeon S2 runtime');
assert.equal(gitBlob(bytes),'7b586e9fb14b7a93a0edb069e115fd6d48cbda97',
  'openChar preaudit runtime blob drifted');

const native=source.match(/function openChar\(id\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(native,/closeTurnPopup\(\)/,'native Shell openChar must close stale turn popup');
assert.match(native,/heroParticipatesInCurrentGame/,'native Shell openChar must enforce active-session participation');
assert.match(native,/document\.getElementById\("sheet"\)/,'native Shell openChar must own opening the shared sheet');
assert.match(native,/render\(\)/,'native Shell openChar must invoke the canonical render path');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function strictAssignments(name){
  const re=new RegExp('window\\.'+name+'\\s*=(?!=)','g');
  const out=[];
  for(const b of blocks){
    const count=[...b.body.matchAll(re)].length;
    if(count)out.push({id:b.id,count,body:b.body});
  }
  return out;
}

const chain=strictAssignments('openChar');
assert.deepEqual(chain.map(x=>x.id),['captureFix139','dungeonCore028HeroExploreGuard'],
  'openChar strict wrapper chain must contain Capture 139 then Dungeon Core 0.28 only');
assert.equal(chain.reduce((n,x)=>n+x.count,0),2,
  'openChar must have exactly two true window assignments after excluding comparison operators');

const capture=chain.find(x=>x.id==='captureFix139')?.body||'';
assert.match(capture,/window\._captureStarting139=false/);
assert.match(capture,/if\(window\._captureStarting139 && isCaptureContext138\(\)\)/,
  'Capture wrapper must only suppress sheet opening during active Capture startup');
assert.match(capture,/return openChar139\.apply\(this,arguments\)/,
  'Capture wrapper must delegate every non-startup openChar call');

const dungeon=chain.find(x=>x.id==='dungeonCore028HeroExploreGuard')?.body||'';
assert.match(dungeon,/function dc028RemoveHeroExplore\(\)/,
  'Dungeon Core 0.28 must expose its real remaining responsibility');
assert.match(dungeon,/new MutationObserver\(\(\)=>dc028RemoveHeroExplore\(\)\)/,
  'Dungeon Core 0.28 currently owns a targeted sheet observer');
assert.match(dungeon,/setTimeout\(dc028RemoveHeroExplore,0\)/);
assert.match(dungeon,/setTimeout\(dc028RemoveHeroExplore,100\)/);
assert.match(dungeon,/window\.openChar=function\(\)/,
  'Dungeon Core 0.28 currently owns the final global openChar wrapper');

assert.ok(source.includes('function render(){\n  try{applyDungeonSheetIdentity();renderDungeonHeroStats();renderDungeonSkillTree();updateDungeonSearchUi()}catch(e){}'),
  'current canonical render must apply Dungeon sheet identity synchronously before shared sheet render');

for(const file of [
  'tests/gens_rpg_sheet_survival_flash_browser_v11411.test.cjs',
  'tests/gens_single_hero_sheet_art_authority_v11411.test.cjs',
  'tests/gens_v167899_ui_sheet_guard.test.cjs'
]){
  assert.ok(fs.existsSync(path.join(root,file)),file+' must remain available for hero-sheet authority');
}

console.log(JSON.stringify({
  scenario:'Phase 5 openChar authority preaudit',
  runtime:{size:bytes.length,blob:gitBlob(bytes)},
  nativeOwner:'function openChar(id)',
  strictWrapperChain:chain.map(x=>x.id),
  historicalCartographyWarning:'window.openChar===function comparisons must not count as assignments',
  firstSubtractiveCandidate:'dungeonCore028HeroExploreGuard',
  capture139RetirementCandidate:false
},null,2));
