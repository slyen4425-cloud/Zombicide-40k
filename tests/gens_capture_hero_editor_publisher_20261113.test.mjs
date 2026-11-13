import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('GenSRPG Pages stages exactly the native hero-editor.html owned by immutable Exploration main',()=>{
 const publisher=read('tools/stage_capture_v2_pages_preview.mjs');
 assert.match(publisher,/for\(const filename of \['index\.html','builder\.html','world-assembler\.html','sculpt-lab\.html','hero-editor\.html'/);
 assert.match(publisher,/fs\.copyFileSync\(from,path\.join\(exploreDest,filename\)\)/);
 assert.match(publisher,/const exploreDest=path\.join\(trial,'vendor\/exploration-lab'\)/);
 assert.doesNotMatch(publisher,/hero-editor\.html.*(?:legacy|local-copy|duplicate)/);
});
