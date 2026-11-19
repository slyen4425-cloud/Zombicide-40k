import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const png='assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png';
test('the certified Monster InvoC default comes from the exact Combat main PNG, only inside Capture',()=>{
 const shell=read('assets/gensrpg/capture-v2/shell-entry-v1.js');
 const app=read('assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const css=read('assets/gensrpg/capture-v2/adventure-style-v1.css');
 const shellCss=read('assets/gensrpg/capture-v2/shell-style-v1.css');
 for(const src of [shell,app,css,shellCss])assert.ok(src.includes('vendor/combat-lab/'+png));
 assert.match(css,/background-size:contain,cover/);
 assert.match(shellCss,/background-size:contain/);
 assert.doesNotMatch(shell,/document\.body\.append\(overlay\)/);
});
test('the visual transport certifies one immutable author blob and the right main',()=>{
 const pin=JSON.parse(read('assets/gensrpg/capture-v2/source-pins-v1.json'));
 assert.equal(pin.combat.sha,'61f704ac24f828721ff7ec24baed351078a409aa');
 assert.equal(pin.combat.certifiedCiRun,44521372520);
 const stage=read('tools/stage_capture_v2_labs.mjs');
 assert.ok(stage.includes('787a24def6d8c1865f337ce6d5fd485a7274bf02'));
 assert.ok(stage.includes("copy(captureLoadingInput,captureLoadingOutput)"));
 assert.ok(stage.includes('captureLoadingBytes.length!==3195270'));
 assert.ok(!stage.includes("copy(path.join(combat,'assets')"));
});
