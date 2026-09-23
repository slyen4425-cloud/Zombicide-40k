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
assert.deepEqual(strictChain('openChar'),['captureFix139'],
  'after Core 0.28 retirement, Capture 139 must be the only global openChar wrapper');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
assert.match(capture,/const openChar139=window\.openChar/);
assert.match(capture,/window\._captureStarting139 && isCaptureContext138\(\)/);
assert.match(capture,/return openChar139\.apply\(this,arguments\)/,
  'Capture 139 must keep delegating non-startup openChar calls');

const native=source.match(/function openChar\(id\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(native,/document\.getElementById\("sheet"\)/,
  'native Shell openChar must remain the sheet owner');
assert.match(native,/render\(\)/,'native Shell openChar must retain canonical render');

console.log(JSON.stringify({
  scenario:'Phase 5 retire Dungeon Core 0.28 openChar wrapper',
  strictOpenCharChain:strictChain('openChar'),
  nativeOwner:'function openChar(id)',
  remainingWrapper:'captureFix139',
  retired:'dungeonCore028HeroExploreGuard'
},null,2));
