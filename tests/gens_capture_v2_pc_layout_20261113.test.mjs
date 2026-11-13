import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Adventure player UI gets larger on desktop without changing phone layout',async()=>{
  const source=await readFile(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
  const marker='/* Desktop-only Adventure HUD:';
  const start=source.indexOf(marker);
  assert.ok(start>0,'PC-only override is present');
  const pc=source.slice(start);
  assert.match(pc,/@media \(min-width: 1100px\) and \(min-height: 680px\) and \(pointer: fine\)/);
  for(const selector of ['#adventure-play-hud','#adventure-play-sheet','#adventure-sheet-content',
    '.sheet-profile-top','.sheet-stat-grid','.sheet-tabs button','#adventure-result-dialog']){
    assert.ok(pc.includes(selector),'PC rule includes '+selector);
  }
  assert.doesNotMatch(pc,/#adventure-play-frame\s*\{|\.arena\s*\{|transform:\s*scale/);
  // Preserve the original phone layout rules in the same authoritative sheet.
  assert.match(source.slice(0,start),/@media\(orientation:landscape\) and \(max-height:550px\)/);
  assert.match(source.slice(0,start),/@media\(max-width:480px\)/);
  assert.match(pc, /max-height: calc\(100dvh - 48px\)/);
});
