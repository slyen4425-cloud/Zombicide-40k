'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8172118,'Capture139 openChar preaudit must target the validated Phase 5 exit runtime');
assert.equal(blob,'198207e3f52730498831f196caa35c4a0283e934','runtime blob drifted before Capture139 openChar retirement');

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
assert.match(native,/document\.getElementById\("sheet"\)/,'native Shell openChar must own the shared hero sheet');
assert.match(native,/render\(\)/,'native Shell openChar must keep canonical rendering');

assert.deepEqual(strictChain('openChar'),['captureFix139'],
  'Capture139 must be the unique remaining global openChar wrapper before retirement');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
assert.match(capture,/const\s+openChar139\s*=\s*window\.openChar/);
assert.match(capture,/window\.openChar\s*=\s*function\s*\(\)\s*\{/);
assert.match(capture,/window\._captureStarting139\s*&&\s*isCaptureContext138\(\)/);
assert.match(capture,/return\s+openChar139\.apply\(this,arguments\)/);

assert.deepEqual(strictChain('startConfiguredGame'),['captureFix138','captureFix139','gensDungeonCore01Js'],
  'startConfiguredGame chain must stay frozen in the openChar-only lot');

assert.match(index,/window\.GensShellModuleLaunchV1\s*=\s*Object\.freeze/);
assert.match(index,/GensShellModuleLaunchV1\.register\(["']capture["']/);
assert.match(index,/GensShellModuleLaunchV1\.register\(["']dungeon["']/);

console.log(JSON.stringify({
  scenario:'Phase 5 Capture139 openChar retirement preaudit',
  runtime:{bytes:bytes.length,blob},
  nativeHeroSheetOwner:'function openChar(id)',
  remainingGlobalOpenCharOwner:'captureFix139',
  frozenLaunchOwners:strictChain('startConfiguredGame'),
  requiredRuntimeChange:'remove only Capture139 window.openChar wrapper after browser proof'
},null,2));
