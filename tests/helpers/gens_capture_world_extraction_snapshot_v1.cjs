'use strict';
// Preserve byte-pinned historical sentinels while running the actual external module.
// The dedicated physical extraction test checks the active external script path.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const hash = b => crypto.createHash('sha1').update(Buffer.from('blob ' + b.length + '\0')).update(b).digest('hex');
const LOAD = Buffer.from('<script src="assets/gensrpg/capture/world-exploration-v1.js?v=1"></script>\n');
const HEADER = '// GenSrpG Capture World / Exploration V1 - byte-identical source relocation.\n// Classic script intentionally retains historical global API / function scope.\n';
const SEAMS = [
 'function captureCloseModal(id)',
 'function captureParticipantIds(){',
 'function captureXpForDefeat(',
 'const GENS_CAPTURE_NEXT_BATTLE_RULES_KEY='
];
function seedEraIndexBytes(root=path.resolve(__dirname,'../..')){
  let index=require('./gens_capture_editor_boundary_snapshot_v1.cjs').worldExtractedIndexBytes(root);
  const module=fs.readFileSync(path.join(root,'assets/gensrpg/capture/world-exploration-v1.js'));
  assert.equal(index.length,7958968);
  assert.equal(hash(index),'42583858f0df0f1b3bcd65ca6a282c8ba27b1c07');
  assert.equal(module.length,17511);
  assert.equal(hash(module),'ecfe276ba1a73b0a164c09f698ab17010289b7ee');
  assert.equal(index.indexOf(LOAD)>=0,true);
  assert.equal(index.indexOf(LOAD,index.indexOf(LOAD)+1),-1);
  index=Buffer.concat([index.subarray(0,index.indexOf(LOAD)),index.subarray(index.indexOf(LOAD)+LOAD.length)]);
  const content=module.toString('utf8');
  assert.ok(content.startsWith(HEADER));
  let rest=content.slice(HEADER.length);
  const chunks=[];
  for(let i=1;i<=4;i++){
    const begin='// BEGIN_CAPTURE_WORLD_SECTION_'+i+'\n';
    const end='// END_CAPTURE_WORLD_SECTION_'+i+'\n';
    assert.ok(rest.startsWith(begin));
    rest=rest.slice(begin.length);
    const pos=rest.indexOf(end);assert.ok(pos>=0);
    chunks.push(Buffer.from(rest.slice(0,pos)));
    rest=rest.slice(pos+end.length);
  }
  assert.equal(rest,'');
  for(let i=3;i>=0;i--){
    const needle=Buffer.from(SEAMS[i]);
    const at=index.indexOf(needle);assert.ok(at>=0);
    assert.equal(index.indexOf(needle,at+1),-1);
    index=Buffer.concat([index.subarray(0,at),chunks[i],index.subarray(at)]);
  }
  assert.equal(index.length,7975990);
  assert.equal(hash(index),'2f2edfa5a1e229e4630889e7f0d5442199e221eb');
  return index;
}
module.exports={seedEraIndexBytes};
