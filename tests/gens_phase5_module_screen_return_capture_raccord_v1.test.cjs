'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  return blocks.filter(b=>(b.body.match(re)||[]).length).map(b=>b.id);
}

const nativeGo=source.match(/function goMenu\(\)\{[\s\S]*?\n\}/)?.[0]||'';
const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
const dungeon=blocks.find(b=>b.id==='dungeonCore200Rebuild')?.body||'';

assert.match(source,/window\.GensShellScreenReturnV1\s*=\s*Object\.freeze\(/,
  'Shell must expose one public screen-return registry API');
assert.match(source,/function gensShellActiveModuleV1\(\)/,
  'Shell must own active-module routing for screen return');
assert.match(source,/gensContentFamilyForProfile/,
  'Shell active-module routing must use public profile/content-family data');
assert.doesNotMatch(
  source.match(/function gensShellActiveModuleV1\(\)[\s\S]*?\n\}/)?.[0]||'',
  /isCaptureContext138|DungeonCore01|captureWorldState|gensrpg_dungeon_runtime_v2/,
  'Shell router must not inspect Capture/Dungeon private runtime state'
);

assert.match(nativeGo,/GensShellScreenReturnV1/,
  'native Shell goMenu must dispatch through the public screen-return contract');
assert.match(nativeGo,/returnToPrimaryView/,
  'native Shell goMenu must call the semantic returnToPrimaryView boundary');
assert.match(nativeGo,/handled/,
  'native Shell goMenu must honor the handled:boolean contract');

assert.match(capture,/GensShellScreenReturnV1/,
  'Capture must register an owner-local screen-return provider');
assert.match(capture,/captureEnterWorld139\(\)/,
  'Capture provider must keep Capture-owned world/hub rendering');
assert.doesNotMatch(capture,/const oldMenu139=window\.goMenu/,
  'Capture must no longer capture the global goMenu boundary');
assert.doesNotMatch(capture,/window\.goMenu\s*=/,
  'Capture must no longer assign global goMenu');

assert.deepEqual(chainFor('goMenu'),['dungeonCore200Rebuild'],
  'Capture S1 must reduce the inline goMenu override chain to Dungeon only');
assert.match(dungeon,/const goOutside200=window\.goMenu/,
  'Dungeon wrapper must remain untouched in Capture S1');

console.log(JSON.stringify({
  scenario:'Phase 5 module screen-return Capture S1 raccord',
  goMenuOverrideChain:chainFor('goMenu'),
  shellOwner:'native goMenu + GensShellScreenReturnV1',
  migratedProvider:'capture',
  deferredProvider:'dungeon'
},null,2));
