'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

const blocks=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function strictChain(name){
  const re=new RegExp('window\\.'+name+'\\s*=(?!=)','g');
  const out=[];
  for(const block of blocks){
    for(const _ of block.body.matchAll(re))out.push(block.id);
  }
  return out;
}

const native=index.match(/function openChar\(id\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(native,/document\.getElementById\("sheet"\)/,'native Shell openChar must remain the shared hero-sheet owner');
assert.match(native,/render\(\)/,'native Shell openChar must retain canonical rendering');

assert.deepEqual(strictChain('openChar'),[],
  'Phase 5 exit requires zero inline global openChar wrapper after Capture139 retirement');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
assert.ok(capture,'captureFix139 block must remain present');
assert.doesNotMatch(capture,/const\s+openChar139\s*=\s*window\.openChar/);
assert.doesNotMatch(capture,/window\.openChar\s*=(?!=)/);
assert.doesNotMatch(capture,/return\s+openChar139\.apply\(this,arguments\)/);

assert.deepEqual(strictChain('startConfiguredGame'),['captureFix138','captureFix139','gensDungeonCore01Js'],
  'openChar-only retirement must not alter historical startConfiguredGame ownership');
assert.match(capture,/window\.startConfiguredGame\s*=\s*async function\(\)/);
assert.match(capture,/gensCaptureStartConfiguredGame139V1/);
assert.match(capture,/GensShellModuleLaunchV1\.register\(["']capture["']/);

console.log(JSON.stringify({
  scenario:'Phase 5 Capture139 openChar retirement',
  globalOpenCharOwners:strictChain('openChar'),
  nativeHeroSheetOwner:'function openChar(id)',
  preservedStartConfiguredGameOwners:strictChain('startConfiguredGame'),
  captureProviderPreserved:true
},null,2));
