'use strict';
// Restore the exact pre-team-extraction bytes for historical sentinels.
// This is a read-only test helper, never a runtime fallback or second owner.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const TAG=Buffer.from('<script src="assets/gensrpg/capture/team-roster-v1.js?v=1"></script>\n');
const HEADER='// GenSrpG Phase 9 Capture Team / Reserve V1: physically moved legacy owner.\n'
  +'// Classic synchronous script: original global API, persisted keys, and rules unchanged.\n';
const END=[
 'function captureXpForDefeat(',
 'function captureCreatureDerivedStats(',
 'function gensPureCaptureSheetMode(){',
 'function renderCaptureHeroInventory(){',
 'function openCreatureCapture(){'
];
function teamRosterPreExtractionIndexBytes(root=path.resolve(__dirname,'../..')){
 let index=fs.readFileSync(path.join(root,'index.html'));
 const module=fs.readFileSync(path.join(root,'assets/gensrpg/capture/team-roster-v1.js'));
 assert.equal(index.length,7950873,'Capture team extracted index bytes');
 assert.equal(hash(index),'57415a1071475cc10f0c79e092897190577127e8','Capture team index fingerprint');
 assert.equal(module.length,8761,'Capture team module exact length');
 assert.equal(hash(module),'297e1e1624bacb0f288403294c1b56aa6f26e66b','Capture team module fingerprint');
 const at=index.indexOf(TAG);
 assert.ok(at>=0);assert.equal(index.indexOf(TAG,at+TAG.length),-1);
 index=Buffer.concat([index.subarray(0,at),index.subarray(at+TAG.length)]);
 let rest=module.toString('utf8');
 assert.ok(rest.startsWith(HEADER));rest=rest.slice(HEADER.length);
 const sections=[];
 for(let i=1;i<=5;i++){
  const begin='// BEGIN_CAPTURE_TEAM_SECTION_'+i+'\n';
  const end='// END_CAPTURE_TEAM_SECTION_'+i+'\n';
  assert.ok(rest.startsWith(begin),'section '+i);
  rest=rest.slice(begin.length);
  const pos=rest.indexOf(end);assert.ok(pos>=0);
  sections.push(Buffer.from(rest.slice(0,pos),'utf8'));
  rest=rest.slice(pos+end.length);
 }
 assert.equal(rest,'');
 for(let i=4;i>=0;i--){
  const key=Buffer.from(END[i]);
  const p=index.indexOf(key);
  assert.ok(p>=0,'restore target '+i);
  assert.equal(index.indexOf(key,p+key.length),-1,'single restore target '+i);
  index=Buffer.concat([index.subarray(0,p),sections[i],index.subarray(p)]);
 }
 assert.equal(index.length,7959089,'pre-team extracted index length');
 assert.equal(hash(index),'e777d484ab10049650440fee04f47cf2dfdc3043','pre-team index source blob');
 return index;
}
module.exports={teamRosterPreExtractionIndexBytes};
