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
// Phase 9 root Hub is an unrelated Shell-only diff. Strip ONLY the audited
// root-family edits before reconstructing pre-extraction historical fixtures.
// The immutable pre-extraction fingerprints below remain unchanged.
function restoreHistoricalHubSnapshot(index,root){
 const h=hash(index);
 if(h==='b64eae3650081af624155c8a4b8e47e4a1791658')return index;
 const fixture=require('../fixtures/gens_phase9_capture_root_hub_exact_edits_v1.json');
 assert.equal(h,fixture.toBlob,'Capture root Hub exact patch fingerprint');
 assert.equal(fixture.fromBlob,'b64eae3650081af624155c8a4b8e47e4a1791658');
 let source=index.toString('utf8');
 for(const [before,after] of fixture.edits.slice().reverse()){
  assert.equal(source.split(after).length-1,1,'unique inverse Hub edit');
  source=source.replace(after,before);
 }
 const restored=Buffer.from(source,'utf8');
 assert.equal(hash(restored),fixture.fromBlob,'historical hub-to-base reconstruction');
 return restored;
}

// Historical sentinels consume the pre-combat index, not the new runtime owner.
// Rebuild it from the external module only after its physical extraction.
// This keeps all earlier hashes and their original expectations unchanged.
function restoreCombatCoreIfExtracted(index,root){
 const tag=Buffer.from('<script src="assets/gensrpg/capture/combat-core-v1.js?v=1"></script>\n');
 if(index.indexOf(tag)<0)return index;
 assert.equal(index.length,7932251,'Capture battle core extracted index bytes');
 assert.equal(hash(index),'b64eae3650081af624155c8a4b8e47e4a1791658','Capture battle core active index fingerprint');
 const owner=fs.readFileSync(path.join(root,'assets/gensrpg/capture/combat-core-v1.js'));
 assert.equal(owner.length,18894,'Capture battle core bytes');
 assert.equal(hash(owner),'129e0af81d7454ed9f7697d40454a5e32bb8e580','Capture battle core fingerprint');
 const header=Buffer.from('// GenSrpG Phase9 Capture battle core - identical legacy source relocation.\n// Classic script to retain original global lexical/function contract.\n// BEGIN_CAPTURE_BATTLE_CORE\n');
 const footer=Buffer.from('// END_CAPTURE_BATTLE_CORE\n');
 assert.ok(owner.subarray(0,header.length).equals(header));
 assert.ok(owner.subarray(-footer.length).equals(footer));
 const first=index.indexOf(tag);
 assert.equal(index.indexOf(tag,first+tag.length),-1,'one Capture core loader');
 index=Buffer.concat([index.subarray(0,first),index.subarray(first+tag.length)]);
 const end=Buffer.from('function gensRollLocationEncounter(locationId){\n');
 const at=index.indexOf(end);
 assert.ok(at>=0);assert.equal(index.indexOf(end,at+end.length),-1);
 const body=owner.subarray(header.length,owner.length-footer.length);
 index=Buffer.concat([index.subarray(0,at),body,index.subarray(at)]);
 assert.equal(index.length,7950873,'restore old team-roster index bytes');
 assert.equal(hash(index),'57415a1071475cc10f0c79e092897190577127e8','restore old team-roster index blob');
 return index;
}
function teamRosterPreExtractionIndexBytes(root=path.resolve(__dirname,'../..')){
 let index=restoreCombatCoreIfExtracted(restoreHistoricalHubSnapshot(fs.readFileSync(path.join(root,'index.html')),root),root);
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
module.exports={teamRosterPreExtractionIndexBytes,restoreHistoricalHubSnapshot};
