'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const policy=JSON.parse(fs.readFileSync(path.join(root,'tools/pages_release_budget.v1.json'),'utf8'));
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
function inventory(dir,rel='',acc={bytes:0,files:0,captureRoots:[],top:[]}){
 const entries=fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name));
 for(const entry of entries){
  const relative=rel?rel+'/'+entry.name:entry.name;
  const full=path.join(dir,entry.name);
  if(entry.isSymbolicLink())throw new Error('Pages artifact symlink not allowed: '+relative);
  if(entry.isDirectory()){
   if(entry.name==='capture-assets')acc.captureRoots.push(relative);
   inventory(full,relative,acc);
  }else if(entry.isFile()){
   const size=fs.statSync(full).size;
   acc.files++;acc.bytes+=size;
   if(size>30*1024*1024)acc.top.push({path:relative,bytes:size});
  }else throw new Error('Unsupported Pages artifact member '+relative);
 }
 return acc;
}
test('the exact assembled Pages artifact is under a documented size budget with at most one canonical Capture media root',t=>{
 assert.equal(policy.schema,'gensrpg-pages-release-budget-v1');
 assert.equal(policy.version,1);
 assert.equal(policy.maxUncompressedBytes,900*1024*1024);
 if(!fs.existsSync(site)){
  if(process.env.GENSRPG_REQUIRE_PAGES_SITE==='1')throw new Error('Pages artifact missing; refusing a false GREEN');
  t.skip('This audit runs on the assembled Pages artifact, not source files');
  return;
 }
 for(const rel of policy.forbiddenLegacyRoots)
  assert.equal(fs.existsSync(path.join(site,rel)),false,'legacy full-Lab copy survived: '+rel);
 assert.equal(fs.existsSync(path.join(site,policy.requiredPreview)),true,
  'the actual approved Capture V2 preview must be preserved');
 const report=inventory(site);
 assert.ok(report.bytes>0&&Number.isSafeInteger(report.bytes),'invalid Pages byte inventory');
 assert.ok(report.captureRoots.length<=policy.maxPhysicalCaptureAssetRoots,
  'duplicate complete Capture assets roots: '+JSON.stringify(report.captureRoots));
 console.log('GENSRPG_PAGES_BUDGET '+JSON.stringify({
  bytes:report.bytes,files:report.files,captureRoots:report.captureRoots,
  maxBytes:policy.maxUncompressedBytes,largeFiles:report.top.sort((a,b)=>b.bytes-a.bytes).slice(0,12)
 }));
 assert.ok(report.bytes<=policy.maxUncompressedBytes,
  'Pages artifact too large; remove redundant copies by provenance and tests, not by raising the budget');
});
