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

const dungeon=blocks.find(b=>b.id==='dungeonCore200Rebuild')?.body||'';
const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
const nativeGo=source.match(/function goMenu\(\)\{[\s\S]*?\n\}/)?.[0]||'';

assert.match(nativeGo,/GensShellScreenReturnV1/,
  'native Shell goMenu must keep the public screen-return registry');
assert.match(nativeGo,/returnToPrimaryView/,
  'native Shell goMenu must keep the semantic returnToPrimaryView dispatch');

assert.match(dungeon,/GensShellScreenReturnV1/,
  'Dungeon must register an owner-local screen-return provider');
assert.match(dungeon,/register\?\.\("dungeon"/,
  'Dungeon must register under the dungeon provider id');
assert.match(dungeon,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/,
  'Dungeon provider must preserve the historical active Dungeon guard as an early false return');
assert.match(dungeon,/return show\(\)===true/,
  'Dungeon provider must keep show() as the owner-local primary-view transition');

assert.doesNotMatch(dungeon,/const goOutside200=window\.goMenu/,
  'Dungeon S2 must no longer capture the global goMenu boundary');
assert.doesNotMatch(dungeon,/window\.goMenu\s*=/,
  'Dungeon S2 must remove the last inline global goMenu assignment');

assert.deepEqual(chainFor('goMenu'),[],
  'Dungeon S2 must leave no inline window.goMenu override');

assert.doesNotMatch(capture,/window\.goMenu\s*=/,
  'Capture S1 must remain migrated to the public Shell contract');
assert.match(capture,/GensShellScreenReturnV1/,
  'Capture provider must remain registered through the Shell contract');

console.log(JSON.stringify({
  scenario:'Phase 5 module screen-return Dungeon S2 raccord',
  goMenuOverrideChain:chainFor('goMenu'),
  shellOwner:'native goMenu + GensShellScreenReturnV1',
  providers:['capture','dungeon'],
  finalGlobalOverrideCount:0
},null,2));
