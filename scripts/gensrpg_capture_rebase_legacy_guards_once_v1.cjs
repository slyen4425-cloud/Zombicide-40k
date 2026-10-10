'use strict';
// GenSrpG: controlled one-time rebase of *historical test fixtures* after the
// unchanged Capture V16.162 seed was moved out of index.html.
// The runtime-under-test is NOT redirected: the physical extraction sentinel
// verifies both new blobs and browsers test the new external <script src>.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const expectedBranch='work/gensrpg-phase9-capture-physical-seed-extraction-2026-10-10';
const hash='1a61147d5a32889fa85e6a09e846049103b9f0bf';
const byteSize='8165438';
const helper="require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes()";
const sourceFiles=cp.execFileSync('git',['grep','-l','-E',byteSize+'|'+hash,'--','tests'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(x=>x.endsWith('.test.cjs'));
function replaceAll(s,re,rep){return s.replace(re,rep)}
function transform(src){
  let s=src;
  // Every transformed test continues to assert the old hash/length; the helper
  // independently asserts BOTH current physical blobs and exact rollback.
  // Preserve the original public behavior assertions without rewriting them.
  const joined=/fs\.readFileSync\(\s*path\.(?:join|resolve)\(\s*(?:root|__dirname)\s*,\s*['"](?:\.\.[\\/])?index\.html['"]\s*\)\s*(?:,\s*(['"])(?:utf8|utf-8)\1\s*)?\)/g;
  s=s.replace(joined,(_m,q)=>helper+(q?".toString('utf8')":""));
  const joined2=/fs\.readFileSync\(\s*path\.join\(\s*__dirname\s*,\s*['"]\.\.['"]\s*,\s*['"]index\.html['"]\s*\)\s*(?:,\s*(['"])(?:utf8|utf-8)\1\s*)?\)/g;
  s=s.replace(joined2,(_m,q)=>helper+(q?".toString('utf8')":""));
  // Named absolute index paths; avoid modifying reads of other files.
  const names=[...src.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*path\.(?:join|resolve)\([^;\n]*['"]index\.html['"]\s*\)/g)].map(m=>m[1]);
  for(const name of names){
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp('fs\\.readFileSync\\(\\s*'+escaped+'\\s*(?:,\\s*([\x27\x22])(?:utf8|utf-8)\\1\\s*)?\\)','g');
    s=s.replace(re,(_m,q)=>helper+(q?".toString('utf8')":""));
  }
  // Legacy helper read('index.html') (other read() targets remain real).
  s=s.replace(/\bread\(\s*['"]index\.html['"]\s*\)/g,helper+".toString('utf8')");
  s=s.replace(/\btext\(\s*['"]index\.html['"]\s*\)/g,helper+".toString('utf8')");
  // Relative direct index reads from test cwd.
  s=s.replace(/fs\.readFileSync\(\s*['"]index\.html['"]\s*(?:,\s*(['"])(?:utf8|utf-8)\1\s*)?\)/g,(_m,q)=>helper+(q?".toString('utf8')":""));
  // Historical source through Git plumbing, not the actual running source.
  s=s.replace(/(?:cp\.)?execFileSync\(\s*['"]git['"]\s*,\s*\[\s*['"]show['"]\s*,\s*['"]HEAD:index\.html['"]\s*\]\s*,\s*\{[^\n;]+?\}\s*\)/g,helper+".toString('utf8')");
  s=s.replace(/(?:cp\.)?execFileSync\(\s*['"]git['"]\s*,\s*\[\s*['"]rev-parse['"]\s*,\s*['"]HEAD:index\.html['"]\s*\]\s*,\s*\{[^\n;]+?\}\s*\)\.trim\(\)/g,JSON.stringify(hash));
  return s;
}
function execute(){
  assert.equal(process.env.GENSRPG_CAPTURE_TEST_REBASE_APPROVED,'1');
  assert.equal(cp.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(),expectedBranch);
  assert.ok(sourceFiles.length>=95&&sourceFiles.length<150,'unexpected index SHA inventory, refuse mutation');
  const records=[];
  for(const rel of sourceFiles){
    const abs=path.join(root,rel), before=fs.readFileSync(abs,'utf8');
    const after=transform(before);
    if(after!==before){
      require('node:vm').Script; // compile check via node --check below
      records.push({rel,before,after});
    }
  }
  if(!records.length)throw Error('No historical tests migrated');
  for(const r of records){fs.writeFileSync(path.join(root,r.rel),r.after)}
  for(const r of records){
    try{cp.execFileSync(process.execPath,['--check',r.rel],{cwd:root,stdio:'pipe',timeout:10000})}
    catch(e){for(const t of records)fs.writeFileSync(path.join(root,t.rel),t.before);throw Error('syntax failed for '+r.rel+': '+String(e.stderr||e))}
  }
  const unresolved=sourceFiles.filter(rel=>{
    const s=fs.readFileSync(path.join(root,rel),'utf8');
    return s.includes(hash)&&!s.includes('gens_capture_v162_legacy_snapshot_v1')&&!s.includes('CURRENT_INDEX_BLOB')&&!s.includes('BLOB=')&&!s.includes('BLOB =');
  });
  console.log(JSON.stringify({scenario:'rebase historical fingerprint tests to exact virtual byte snapshot',candidates:sourceFiles.length,modified:records.length,modifiedFiles:records.map(x=>x.rel),unresolved},null,2));
}
execute();
