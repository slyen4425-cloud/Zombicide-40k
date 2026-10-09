'use strict';
/* Diagnostic only. Never commits or writes files in the checked-out repository.
 * Classify hard-pins and simulate the 40-byte Capture138 fix in a separate
 * GitHub Actions ephemeral workspace. Historical rollback oracles MUST be reviewed manually.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const tests=path.join(root,'tests');
const old='18627cc0c5fc7945732c8a910504c59ef823b6ae',target='1a61147d5a32889fa85e6a09e846049103b9f0bf';
const oldLen=8165398,targetLen=8165438;
const needle='    setTimeout(()=>{\n      try{\n        document.getElementById("sheet")';
const replacement='    setTimeout(()=>{\n      if(!isCaptureContext138())return;\n      try{\n        document.getElementById("sheet")';
const hash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const original=fs.readFileSync(path.join(root,'index.html'));
assert.equal(original.length,oldLen);
assert.equal(hash(original),old);
const block=original.toString('utf8').match(/<script\b[^>]*\bid="captureFix138"[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(block&&block.includes(needle));
assert.equal(block.split(needle).length-1,1,'must patch only the original Capture138 callback');
const patched=Buffer.from(original.toString('utf8').replace(needle,replacement),'utf8');
assert.equal(patched.length,targetLen);
assert.equal(hash(patched),target);
assert.equal(hash(Buffer.from(patched.toString('utf8').replace(replacement,needle),'utf8')),old,'rollback');
const names=fs.readdirSync(tests).filter(n=>n.endsWith('.test.cjs')).sort();
const candidates=names.flatMap(n=>{
 const p=path.join(tests,n),src=fs.readFileSync(p,'utf8');
 if(!src.includes(String(oldLen))&&!src.includes(old))return [];
 const matches=src.split(/\r?\n/).flatMap((l,i)=>l.includes(String(oldLen))||l.includes(old)?[{line:i+1,text:l.trim().slice(0,260)}]:[]);
 let category='current-runtime-pin';
 if(/const (before|after)\s*=\s*\{\s*bytes:|const restored\s*=|oldBytes|rollback must be byte-exact/.test(src))category='mixed-runtime-and-historical-rollback';
 else if(/const allowed\s*=\s*new Map|const (allowed|known|fingerprints)\s*=\s*\[/.test(src))category='version-whitelist';
 else if(matches.every(x=>/targetBlob:|sourceBlob:|metadata|console\.log|const oldBlob=/.test(x.text)))category='output-only-or-rollback-reference';
 return {file:'tests/'+n,category,matchCount:matches.length,matches};
});
const classifyCount={};for(const x of candidates)classifyCount[x.category]=(classifyCount[x.category]||0)+1;
console.log('AUDIT_PREVIEW '+JSON.stringify({candidateTests:candidates.length,groups:classifyCount,
  oldBytes:oldLen,oldBlob:old,newBytes:targetLen,newBlob:target,onlyRuntimeChangeBytes:40}));
// GitHub Actions checkout is a disposable job-local workspace. Never commit it.
(async()=>{
try{
  fs.writeFileSync(path.join(root,'index.html'),patched);
  const work=root;
  const chk=fs.readFileSync(path.join(work,'index.html'));
  assert.equal(hash(chk),target);
  const results=[];
  let next=0;
  async function worker(){
    while(next<candidates.length){
      const entry=candidates[next++];
      const res=await new Promise(resolve=>{
        let output='',stderr='',ended=false;
        const child=spawn(process.execPath,[entry.file],{cwd:work,env:{...process.env,CI:'true'},stdio:['ignore','pipe','pipe']});
        const limit=setTimeout(()=>child.kill('SIGKILL'),20000);
        child.stdout.on('data',b=>{if(output.length<30000)output+=b.toString()});
        child.stderr.on('data',b=>{if(stderr.length<30000)stderr+=b.toString()});
        child.on('error',e=>{if(!ended){ended=true;clearTimeout(limit);resolve({ok:false,reason:'spawn-error',details:String(e)})}});
        child.on('close',(code,signal)=>{if(ended)return;ended=true;clearTimeout(limit);
          const errorText=(output+'\n'+stderr).slice(0,26000);
          let reason=code===0?'pass':signal==='SIGKILL'?'timeout':/AssertionError|ERR_ASSERTION/.test(errorText)?'assertion-failure':/Cannot find module|MODULE_NOT_FOUND/.test(errorText)?'missing-dependency':'other-failure';
          const snippet=errorText.split(/\r?\n/).filter(s=>/AssertionError|Error \[|ERR_ASSERTION|expected|actual|runtime|rollback|fingerprint/i.test(s)).slice(0,8).join(' | ').slice(0,550);
          resolve({ok:code===0,reason,exit:code,details:snippet});
        });
      });
      results.push({file:entry.file,category:entry.category,...res});
    }
  }
  await Promise.all(Array.from({length:6},()=>worker()));
  const summary={};for(const v of results)summary[v.reason]=(summary[v.reason]||0)+1;
  const byCategory={};for(const v of results){byCategory[v.category]??={pass:0,fail:0};byCategory[v.category][v.ok?'pass':'fail']++}
  const findings={baseline:{len:oldLen,blob:old},patched:{len:targetLen,blob:target},
    counts:{tested:results.length,categories:classifyCount,reasons:summary,byCategory},
    candidateTests:candidates,simulationResults:results};
  const outputFile=process.env.GITHUB_STEP_SUMMARY?path.join(os.tmpdir(),'gens-capture138-pin-simulation.json'):path.join(process.cwd(),'gens-capture138-pin-simulation.json');
  fs.writeFileSync(outputFile,JSON.stringify(findings,null,2)+'\n');
  console.log('PIN_SIMULATION_REPORT '+outputFile);
  console.log('PIN_SIMULATION_RESULT '+JSON.stringify(findings.counts));
  const failures=results.filter(x=>!x.ok);console.log('PIN_SIMULATION_FAILURES '+JSON.stringify(failures.slice(0,120)));
  console.log('PIN_SIMULATION_NOT_A_COMMIT: patched runtime exists only in ephemeral GitHub Actions checkout');
}finally{
  fs.writeFileSync(path.join(root,'index.html'),original);
  assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),old,'restore pristine runtime in runner');
}
})().catch(e=>{console.error(e);process.exitCode=1});
