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
// Revert current single-owner subtractive refactor first; historical fixtures remain intact.
const OWNER_WRITER='  if(dungeonBtn)dungeonBtn.style.display=isRpg&&!window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.())?"":"none";\n';
const OWNER_LOOKUP='  const dungeonBtn=document.getElementById("dungeonAdvancedEditorBtn");\n';
const OWNER_BEFORE=[
 ['function applyModeEditorVisibility(){\n',
  'function gensShellDungeonEditorAllowed(){\n  try{const p=getActiveGameProfile?.();return !!p&&p.gameStyle==="dungeon"&&!window.GensCaptureV1?.isProfile?.(p)}catch(e){return false}\n}\nfunction applyModeEditorVisibility(){\n'],
 ['  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=dungeon&&!window.GensCaptureV1?.isProfile?.(activeProfile)?"":"none";',
  '  const dae=document.getElementById("dungeonAdvancedEditorBtn");if(dae)dae.style.display=gensShellDungeonEditorAllowed()?"":"none";'],
 ['function openDungeonAdvancedEditor(){\n  if(window.GensCaptureV1?.isProfile?.(getActiveGameProfile?.()))return;\n',
  'function openDungeonAdvancedEditor(){\n  if(!gensShellDungeonEditorAllowed())return;\n']
];
function worldExtractedIndexBytes(root=path.resolve(__dirname,'../..')){
 let bytes=require('./gens_capture_team_roster_snapshot_v1.cjs').teamRosterPreExtractionIndexBytes(root);
 assert.equal(bytes.length,7959089,'canonical single-owner index bytes');
 assert.equal(hash(bytes),'e777d484ab10049650440fee04f47cf2dfdc3043','canonical single-owner index blob');
 let str=bytes.toString('utf8');
 for(const [before,after] of [...OWNER_BEFORE].reverse()){
  assert.equal(str.split(after).length-1,1,'single-owner replacement must be unique');
  str=str.replace(after,before);
 }
 const beforeLookup='  if(survivalBtn)survivalBtn.style.display=isRpg?"none":"";\n';
 const beforeWriter='  if(rpgBtn)rpgBtn.style.display=isRpg?"":"none";\n';
 assert.equal(str.split(beforeLookup).length-1,1);
 assert.equal(str.split(beforeWriter).length-1,1);
 str=str.replace(beforeLookup,OWNER_LOOKUP+beforeLookup).replace(beforeWriter,beforeWriter+OWNER_WRITER);
 bytes=Buffer.from(str,'utf8');
 assert.equal(bytes.length,7959154,'previous technical boundary index size');
 assert.equal(hash(bytes),'d19fb899e646ee97ec21d055b5271ac2cbba91a2','previous boundary fingerprint');
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
