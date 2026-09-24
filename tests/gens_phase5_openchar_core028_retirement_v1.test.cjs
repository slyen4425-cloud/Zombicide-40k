'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

assert.equal(blocks.some(b=>b.id==='dungeonCore028HeroExploreGuard'),false,
  'Dungeon Core 0.28 compatibility block must be retired');
assert.doesNotMatch(source,/dc028RemoveHeroExplore/,
  'retired Core 0.28 remover must not remain in the runtime');

function strictChain(name){
  const re=new RegExp('window\\.'+name+'\\s*=(?!=)','g');
  return blocks.filter(b=>[...b.body.matchAll(re)].length).map(b=>b.id);
}
assert.deepEqual(strictChain('openChar'),[],
  'after Core 0.28 and Capture139 retirements, no global openChar wrapper may remain');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
assert.ok(capture,'Capture139 launch block must remain present');
assert.doesNotMatch(capture,/const openChar139=window\.openChar/);
assert.doesNotMatch(capture,/window\.openChar\s*=(?!=)/);
assert.doesNotMatch(capture,/return openChar139\.apply\(this,arguments\)/);

const native=source.match(/function openChar\(id\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(native,/document\.getElementById\("sheet"\)/,
  'native Shell openChar must remain the sheet owner');
assert.match(native,/render\(\)/,'native Shell openChar must retain canonical render');

console.log(JSON.stringify({
  scenario:'Phase 5 retire Dungeon Core 0.28 openChar wrapper',
  strictOpenCharChain:strictChain('openChar'),
  nativeOwner:'function openChar(id)',
  remainingWrapper:null,
  retired:['dungeonCore028HeroExploreGuard','captureFix139 global openChar']
},null,2));
