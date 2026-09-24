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

assert.equal(bytes.length,8171854,'openChar guard must target the current Core 0.28-retired runtime');
assert.equal(gitBlob(bytes),'97f0e060d8bffcde2baaf5aa42c1e16b8544263f',
  'openChar guard runtime blob drifted');

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
assert.deepEqual(chain.map(x=>x.id),[],
  'Phase 5 final authority must leave zero strict global openChar wrapper');
assert.equal(chain.reduce((n,x)=>n+x.count,0),0,
  'openChar must have zero true window assignment after Capture139 retirement');

const capture=blocks.find(x=>x.id==='captureFix139')?.body||'';
assert.ok(capture,'Capture139 launch block must remain present');
assert.match(capture,/window\._captureStarting139=false/);
assert.doesNotMatch(capture,/const openChar139=window\.openChar/);
assert.doesNotMatch(capture,/window\.openChar\s*=(?!=)/);
assert.doesNotMatch(capture,/return openChar139\.apply\(this,arguments\)/);

assert.equal(blocks.some(x=>x.id==='dungeonCore028HeroExploreGuard'),false,
  'Dungeon Core 0.28 block must remain retired');
assert.doesNotMatch(source,/dc028RemoveHeroExplore/,
  'retired Core 0.28 remover must not remain in runtime');

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
  scenario:'Phase 5 final openChar authority after Capture139 retirement',
  runtime:{size:bytes.length,blob:gitBlob(bytes)},
  nativeOwner:'function openChar(id)',
  strictWrapperChain:chain.map(x=>x.id),
  historicalCartographyWarning:'window.openChar===function comparisons must not count as assignments',
  retiredOwners:['dungeonCore028HeroExploreGuard','captureFix139 global openChar'],
  capture139Retired:true
},null,2));
