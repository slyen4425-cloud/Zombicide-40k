// Automated maintainer of the approved Combat main pin.
// Runs only in GitHub Actions on GenSrpg main, never in client runtime.
// An unsuccessful or incompatible update leaves main and public Pages unchanged.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {COMBAT_LAB_SOURCE_V1} from '../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs';
const combat='slyen4425-cloud/GenSrpg_labo_combat_dynamique';
const own=process.env.GITHUB_REPOSITORY;
const token=process.env.GH_TOKEN;
const initial=process.env.GITHUB_SHA;
function fail(message){throw Error('[main-only auto-sync] '+message)}
function cmd(command,...args){return execFileSync(command,args,{encoding:'utf8',stdio:['ignore','pipe','inherit'],env:process.env}).trim()}
function gh(...args){return cmd('gh',...args)}
function api(endpoint){return JSON.parse(gh('api',endpoint))}
function shaRef(repo,branch){return api('repos/'+repo+'/git/ref/heads/'+branch).object.sha}
function ensure(condition,message){if(!condition)fail(message)}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
const workflows=[
 'capture-lab-runtime.yml',
 'capture-lab-delivery.yml',
 'main.yml',
 'gensrpg-architecture-sentinels.yml',
 'gensrpg-firefox-wall-sentinel.yml',
 'gensrpg-tactical-dock-sentinel.yml',
];
async function waitForRuns(branch,head,files,maxAttempts=170,periodMs=20000){
 for(let i=0;i<maxAttempts;i++){
  let all=true;
  for(const workflow of files){
   const results=JSON.parse(gh('run','list','--repo',own,'--workflow',workflow,'--branch',branch,
    '--event','workflow_dispatch','--limit','15','--json','headSha,status,conclusion,databaseId'));
   const current=results.find(result=>result.headSha===head);
   if(!current){all=false;continue}
   if(current.status==='completed'){
    if(current.conclusion!=='success')fail(workflow+' failed on candidate '+head+': '+JSON.stringify(current));
   }else all=false;
  }
  if(all)return;
  await delay(periodMs);
 }
 fail('Required CI did not finish successfully. Candidate remains in PR, main unchanged.');
}
async function run(){
 ensure(own==='slyen4425-cloud/Zombicide-40k','Wrong source repository');
 ensure(token && initial,'GitHub Actions token and exact source SHA required');
 ensure(process.env.GITHUB_REF==='refs/heads/main','Only GenSrpg main may coordinate automatic release');
 ensure(cmd('git','rev-parse','HEAD')===initial,'Workspace source SHA mismatch');
 ensure(shaRef(own,'main')===initial,'GenSrpg main advanced before synchronization');
 const official=shaRef(combat,'main');
 ensure(/^[a-f0-9]{40}$/.test(official),'Malformed Combat main HEAD');
 const pins=JSON.parse(fs.readFileSync('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json','utf8'));
 ensure(pins.authoredSourceLabPin===COMBAT_LAB_SOURCE_V1.sha &&
   pins.originalWildBattleButton?.officialSourceSha===COMBAT_LAB_SOURCE_V1.sha,'Source manifest and engine pin disagree');
 if(official===COMBAT_LAB_SOURCE_V1.sha){console.log('NOOP: GenSrpg already uses official Combat main '+official);return}
 const labRuns=api('repos/'+combat+'/actions/runs?branch=main&per_page=100').workflow_runs;
 const certified=labRuns.find(x=>x.head_sha===official && x.name==='Laboratory CI' &&
   x.status==='completed' && x.conclusion==='success');
 ensure(certified,'Combat main '+official+' has no exact successful Laboratory CI: no update');
 ensure(shaRef(combat,'main')===official,'Combat main changed during certification');
 const short=official.slice(0,12);
 const branch='work/gensrpg-combat-main-sync-'+short;
 const checkpoint='checkpoint/gensrpg-start-combat-main-sync-'+short;
 // Never force-update a previous candidate or overwrite an already-open review.
 const branches=cmd('git','ls-remote','--heads','origin',branch);
 ensure(!branches,'Existing candidate '+branch+' requires review; no overwrite');
 cmd('git','config','user.name','github-actions[bot]');
 cmd('git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 cmd('git','push','origin',initial+':refs/heads/'+checkpoint);
 cmd('git','switch','-c',branch,initial);
 cmd('node','tools/sync_capture_combat_main_pin.mjs',official,String(certified.id));
 for(const args of [
  ['--test','tests/gens_capture_combat_main_autosync_20261030.test.mjs'],
  ['--test','tests/gens_capture_combat_main_only_guard_20261030.test.cjs'],
  ['--test','tests/gens_capture_kitsune_author_12_gate_v1.test.cjs'],
  ['tests/gens_phase9_capture_exit_gate_evidence_v1.test.cjs']
 ])cmd('node',...args);
 const {FILES}=await import('./sync_capture_combat_main_pin.mjs');
 cmd('git','add','--',...FILES);
 ensure(cmd('git','diff','--cached','--name-only').split('\n').length===FILES.length,'Partial source update');
 cmd('git','commit','-m','sync(capture): approved Combat main '+official+' CI '+certified.id);
 const candidate=cmd('git','rev-parse','HEAD');
 cmd('git','push','origin','HEAD:refs/heads/'+branch);
 const pr=gh('pr','create','--repo',own,'--base','main','--head',branch,
  '--title','sync(capture): approved Combat main '+short,
  '--body','Official Combat main '+official+' validated by Laboratory CI '+certified.id+
  '. Full independent PR-browser/Pages verification required. No gh-pages, no implicit author promotion.');
 console.log('CANDIDATE: '+pr+' @'+candidate);
 for(const workflow of workflows)gh('workflow','run',workflow,'--repo',own,'--ref',branch);
 await waitForRuns(branch,candidate,workflows);
 ensure(shaRef(combat,'main')===official,'Combat advanced; candidate now stale');
 ensure(shaRef(own,'main')===initial,'GenSrpg advanced; candidate must be rebased and recertified');
 ensure(shaRef(own,branch)===candidate,'Candidate source SHA changed');
 gh('pr','merge',pr,'--repo',own,'--merge','--delete-branch');
 const merged=shaRef(own,'main');
 ensure(merged!==initial,'Merge did not update GenSrpg main');
 // GITHUB_TOKEN-generated merges do not emit push-triggered Actions;
 // explicitly dispatch main build/deploy and verify production green.
 gh('workflow','run','main.yml','--repo',own,'--ref','main');
 await waitForRuns('main',merged,['main.yml'],105,15000);
 gh('workflow','run','capture-2v2-pages-public-smoke.yml','--repo',own,'--ref','main');
 await waitForRuns('main',merged,['capture-2v2-pages-public-smoke.yml'],55,15000);
 console.log('PUBLISHED: GenSrpg main '+merged+
  ' uses approved Combat main '+official+
  '. https://slyen4425-cloud.github.io/Zombicide-40k/');
}
run().catch(error=>{console.error('::error::'+error.message);process.exitCode=1});
