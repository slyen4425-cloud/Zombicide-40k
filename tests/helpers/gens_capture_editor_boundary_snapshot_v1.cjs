'use strict';
// Reconstruct exact pre-boundary Capture world index for historical byte-pinned
// ownership tests. Runtime itself loads only the edited index, never this helper.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const EDITS=[
 ['  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon?"":"none";',
  '  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon&&!window.GensCaptureV1?.isProfile?.(activeProfile)?"":"none";'],
 ['  if(dungeonBtn)dungeonBtn.style.display=isRpg?"":"none";',
  '  if(dungeonBtn)dungeonBtn.style.display=isRpg&&!window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.())?"":"none";'],
 ['function openDungeonAdvancedEditor(){\n  if(hasActiveSession())',
  'function openDungeonAdvancedEditor(){\n  if(window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.()))return;\n  if(hasActiveSession())']
];
function worldExtractedIndexBytes(root=path.resolve(__dirname,'../..')){
 let bytes=fs.readFileSync(path.join(root,'index.html'));
 assert.equal(bytes.length,7959154);
 assert.equal(hash(bytes),'d19fb899e646ee97ec21d055b5271ac2cbba91a2');
 let str=bytes.toString('utf8');
 for(const [before,after] of [...EDITS].reverse()){
  assert.equal(str.split(after).length-1,1,'editor boundary replacement must be unique');
  str=str.replace(after,before);
 }
 bytes=Buffer.from(str,'utf8');
 assert.equal(bytes.length,7958968,'pre-boundary index size');
 assert.equal(hash(bytes),'42583858f0df0f1b3bcd65ca6a282c8ba27b1c07','pre-boundary source byte exact');
 return bytes;
}
module.exports={worldExtractedIndexBytes,EDITS};
