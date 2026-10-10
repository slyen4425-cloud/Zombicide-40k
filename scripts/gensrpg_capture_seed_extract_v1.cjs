'use strict';
// GenSrpG Phase 9 — controlled, reversible physical extraction of V16.162.
// The source is the byte-exact 8,165,438-byte index.html supplied for this SHA.
// This script only runs on the explicitly dedicated work branch.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const child=require('node:child_process');

const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
const assetPath=path.join(root,'assets/gensrpg/capture/builtin-seed-v1.js');
const branch='work/gensrpg-phase9-capture-physical-seed-extraction-2026-10-10';
const originalSha='1a61147d5a32889fa85e6a09e846049103b9f0bf';
const originalLength=8165438;
const seedSha='15721cc9d1f13368aee2d1ea2e0de22945ed3960';
const seedLength=189500;
const extractedSha='2f2edfa5a1e229e4630889e7f0d5442199e221eb';
const extractedLength=7975990;
const OPEN=Buffer.from('<script id="builtinMonsterCapture162">');
const CLOSE=Buffer.from('</script>');
const REPLACEMENT=Buffer.from('<script id="builtinMonsterCapture162" src="assets/gensrpg/capture/builtin-seed-v1.js?v=1"></script>');
const gitBlob=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\\0')).update(x).digest('hex');
function check(condition,message){assert.ok(condition,message)}
function verify(){
  const index=fs.readFileSync(indexPath);
  const src=fs.readFileSync(assetPath);
  assert.equal(index.length,extractedLength,'extracted index size');
  assert.equal(gitBlob(index),extractedSha,'extracted index Git blob');
  assert.equal(src.length,seedLength,'Capture source byte length');
  assert.equal(gitBlob(src),seedSha,'Capture source byte-exact content');
  assert.equal(index.indexOf(OPEN),-1,'old inline script removed');
  const offset=index.indexOf(REPLACEMENT);
  check(offset>=0,'external Capture V16.162 script loaded from same location');
  assert.equal(index.indexOf(REPLACEMENT,offset+1),-1,'external seed loaded exactly once');
  const restoration=Buffer.concat([index.subarray(0,offset),OPEN,src,CLOSE,index.subarray(offset+REPLACEMENT.length)]);
  assert.equal(restoration.length,originalLength,'rollback size parity');
  assert.equal(gitBlob(restoration),originalSha,'rollback must recover exact original index');
  check(src.includes(Buffer.from('window.ensureBuiltinMonsterCapture162=function()')),'original idempotent seed entry retained');
  check(src.includes(Buffer.from('ensureBuiltinMonsterCapture162();')),'synchronous seed bootstrap retained');
  return {file:assetPath,seedBytes:src.length,indexBytes:index.length,rollback:originalSha};
}
function apply(){
  assert.equal(process.env.GENSRPG_CAPTURE_EXTRACT_APPROVED,'1','explicit consent required');
  const current=child.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
  assert.equal(current,branch,'prohibit source modification outside work branch');
  check(!fs.existsSync(assetPath),'seed owner cannot already be duplicated');
  const index=fs.readFileSync(indexPath);
  assert.equal(index.length,originalLength,'source index size differs from user-provided source');
  assert.equal(gitBlob(index),originalSha,'source index differs from exact checked checkpoint');
  const start=index.indexOf(OPEN);
  check(start>=0,'original standalone Capture seed script missing');
  assert.equal(index.indexOf(OPEN,start+OPEN.length),-1,'seed has multiple owners');
  const end=index.indexOf(CLOSE,start+OPEN.length);
  check(end>start,'unterminated original seed script');
  const src=index.subarray(start+OPEN.length,end);
  assert.equal(src.length,seedLength,'original script size mismatch');
  assert.equal(gitBlob(src),seedSha,'original script blob mismatch');
  const next=Buffer.concat([index.subarray(0,start),REPLACEMENT,index.subarray(end+CLOSE.length)]);
  assert.equal(next.length,extractedLength,'transformed index size mismatch');
  assert.equal(gitBlob(next),extractedSha,'transformed index hash mismatch');
  const rollback=Buffer.concat([next.subarray(0,start),OPEN,src,CLOSE,next.subarray(start+REPLACEMENT.length)]);
  check(rollback.equals(index),'byte-exact rollback failed; abort before writes');
  fs.mkdirSync(path.dirname(assetPath),{recursive:true});
  fs.writeFileSync(assetPath,src,{flag:'wx'});
  fs.writeFileSync(indexPath,next);
  return verify();
}
const mode=process.argv[2];
if(mode!=='--apply'&&mode!=='--verify')throw Error('Use --apply with explicit branch/approval, or --verify');
const result=mode==='--apply'?apply():verify();
console.log(JSON.stringify({scenario:'Capture V16.162 physical extraction',mode,result}));
