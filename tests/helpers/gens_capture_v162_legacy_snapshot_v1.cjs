'use strict';
// Read-only *reconstruction* for historical byte-pinned sentinels after the
// V16.162 seed owner moved to its synchronous external Capture module file.
// This does not change or mock the runtime under test: the separate extraction
// test and real-browser E2E assert the actual external loading path.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const external='<script id="builtinMonsterCapture162" src="assets/gensrpg/capture/builtin-seed-v1.js?v=1"></script>';
const oldOpen='<script id="builtinMonsterCapture162">';
const oldClose='</script>';
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
function legacyBytes(root=path.resolve(__dirname,'../..')){
  const index=fs.readFileSync(path.join(root,'index.html'));
  const seed=fs.readFileSync(path.join(root,'assets/gensrpg/capture/builtin-seed-v1.js'));
  assert.equal(index.length,7975990,'externalized index length');
  assert.equal(hash(index),'2f2edfa5a1e229e4630889e7f0d5442199e221eb','externalized index blob');
  assert.equal(seed.length,189500,'external Capture seed length');
  assert.equal(hash(seed),'15721cc9d1f13368aee2d1ea2e0de22945ed3960','external Capture seed blob');
  const key=Buffer.from(external);
  const at=index.indexOf(key);
  assert.ok(at>=0,'external seed load tag missing');
  assert.equal(index.indexOf(key,at+key.length),-1,'Capture seed loaded twice');
  assert.equal(index.indexOf(Buffer.from(oldOpen)),-1,'old runtime copy still active');
  const restored=Buffer.concat([index.subarray(0,at),Buffer.from(oldOpen),seed,Buffer.from(oldClose),index.subarray(at+key.length)]);
  assert.equal(restored.length,8165438,'legacy virtual index byte length');
  assert.equal(hash(restored),'1a61147d5a32889fa85e6a09e846049103b9f0bf','legacy virtual index must be byte-exact');
  return restored;
}
module.exports={legacyBytes};
