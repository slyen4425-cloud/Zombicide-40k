// Capture V2 read-only upstream certification watcher.
// This is NOT a repinner or publisher: official Lab updates require a new
// immutable GenSRPG source candidate, its full CI, a separate release PR and
// a public Pages/Android check. No legacy Capture V1 runtime is touched.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const OWN='slyen4425-cloud/Zombicide-40k';
const PREVIEW='/preview/capture-v2-pr225/';
const isSha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const validRun=value=>Number.isSafeInteger(value)&&value>0;

export const LAB_SPECS=Object.freeze({
  combat:Object.freeze({
    repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
    workflow:'Laboratory CI'
  }),
  exploration:Object.freeze({
    repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',
    workflow:'Exploration CI'
  })
});
function ensure(ok,message){if(!ok)throw Error('[capture-v2-upstream-watch] '+message)}
function certified(run,lab,sha){
  return Boolean(run && validRun(run.id) && run.name===lab.workflow &&
    run.head_sha===sha && run.head_branch==='main' &&
    run.status==='completed' && run.conclusion==='success');
}

// Pure decision layer. This never writes, repins, or creates any runtime owner.
export function planCaptureV2UpstreamReviews({release,pins,labs}){
  ensure(release && isSha(release.sha)&&release.publicPath===PREVIEW,
    'Release must be the immutable certified public V2 preview source');
  ensure(pins?.schema==='gensrpg-capture-v2-official-main-pins-v1' &&
    pins.legacyCaptureRuntime===false,'V2 official pins or legacy disable are missing');
  ensure(labs && typeof labs==='object','Upstream observations are required');
  const proposals=[];
  for(const [name,spec] of Object.entries(LAB_SPECS)){
    const pin=pins[name],upstream=labs[name];
    ensure(pin?.repository===spec.repository && pin.ref==='main' &&
      isSha(pin.sha) && validRun(pin.certifiedCiRun),
      name+': official pin has untrusted repository, ref, SHA or provenance');
    ensure(upstream && isSha(upstream.sha),name+': official main SHA missing');
    if(upstream.sha===pin.sha)continue;
    // On an unverified CI, defer; do not create a proposal.
    if(!certified(upstream.ciRun,spec,upstream.sha))continue;
    const comparison=upstream.comparison;
    ensure(comparison && comparison.status==='ahead' &&
      Number.isSafeInteger(comparison.ahead_by) && comparison.ahead_by>0 &&
      comparison.behind_by===0,
      name+': missing or non-fast-forward official main ancestry comparison');
    proposals.push(Object.freeze({
      status:'needs-review',lab:name,repository:spec.repository,
      releaseSha:release.sha,sourceSha:pin.sha,officialSha:upstream.sha,
      certifiedCiRun:upstream.ciRun.id
    }));
  }
  return proposals;
}

function gh(...args){
  return execFileSync('gh',args,{encoding:'utf8',
    env:process.env,stdio:['ignore','pipe','inherit'],maxBuffer:8*1024*1024}).trim();
}
function api(endpoint){return JSON.parse(gh('api',endpoint))}
function mainSha(repository){
  return api('repos/'+repository+'/git/ref/heads/main').object.sha;
}
function runForMain(repository,workflow,sha){
  const runs=api('repos/'+repository+'/actions/runs?branch=main&per_page=100').workflow_runs;
  ensure(Array.isArray(runs),'GitHub returned no upstream CI data for '+repository);
  return runs.find(run=>run.name===workflow && run.head_sha===sha) || null;
}
function readPublishedSource(release){
  const endpoint='repos/'+OWN+'/contents/assets/gensrpg/capture-v2/source-pins-v1.json?ref='+release.sha;
  const file=api(endpoint);
  ensure(file.encoding==='base64' && typeof file.content==='string',
    'Cannot verify real immutable preview source manifest');
  return JSON.parse(Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8'));
}
function existingIssueTitles(){
  const titles=new Set();
  for(let page=1;page<=10;page++){
    const items=api('repos/'+OWN+'/issues?state=open&per_page=100&page='+page);
    ensure(Array.isArray(items),'Unable to read existing review issues');
    for(const item of items)if(!item.pull_request)titles.add(item.title);
    if(items.length<100)return titles;
  }
  throw Error('[capture-v2-upstream-watch] Issue list exceeded bounded review; refusing duplicates');
}
function titleFor(proposal){
  return '[Capture V2] Review '+proposal.lab+' main '+proposal.officialSha;
}
function issueBody(p){
  return [
    '## Automatic official upstream alert — review required',
    '',
    'This is NOT a gameplay promotion or approval to deploy. The current published Capture V2 preview is intentionally immutable.',
    '',
    '- Published GenSRPG source: `'+p.releaseSha+'`',
    '- Official '+p.lab+' main: `'+p.officialSha+'`',
    '- Previously pinned official '+p.lab+': `'+p.sourceSha+'`',
    '- Upstream repo: https://github.com/'+p.repository,
    '- Certified main CI: https://github.com/'+p.repository+'/actions/runs/'+p.certifiedCiRun,
    '- Git comparison: https://github.com/'+p.repository+'/compare/'+p.sourceSha+'...'+p.officialSha,
    '',
    '## Next authorized sequence',
    '',
    '1. Dedicated GenSRPG source branch + START checkpoint from the currently published V2 candidate. No direct main write.',
    '2. Repin ONLY the official laboratory contract and its exact CI, without copying engine rules or editor assets.',
    '3. RED/GREEN for native Combat/Exploration integration, browser mobile landscape, storage compatibility and all relevant CI.',
    '4. Separate publisher PR changing the immutable preview source only after certification, then HTTPS proof and Pixel manual test.',
    '5. Never auto-merge, modify root PWA/SW or rewrite existing saves. Reject any new upstream drift before promotion.',
    '',
    'GitHub Actions currently rejects PR creation on this repository; this issue preserves an actionable notification until approved PR permissions are available.'
  ].join('\n');
}

async function main(){
  ensure(process.env.GITHUB_REPOSITORY===OWN && process.env.GITHUB_REF==='refs/heads/main',
    'Run only from published GenSRPG main');
  ensure(process.env.GH_TOKEN && isSha(process.env.GITHUB_SHA),
    'GitHub Actions token and exact commit are mandatory');
  const initial=process.env.GITHUB_SHA;
  ensure(mainSha(OWN)===initial,'Publisher main moved during watcher execution');
  const release=JSON.parse(fs.readFileSync('tools/capture_v2_pages_preview_pin.json','utf8'));
  ensure(release.repository===OWN,'Unexpected publisher repository');
  const pins=readPublishedSource(release);
  const labs={};
  for(const [name,spec] of Object.entries(LAB_SPECS)){
    const sha=mainSha(spec.repository);
    const pin=pins[name];
    labs[name]={sha};
    if(sha!==pin?.sha){
      const ciRun=runForMain(spec.repository,spec.workflow,sha);
      if(ciRun)labs[name].ciRun=ciRun;
      if(certified(ciRun,spec,sha)){
        labs[name].comparison=api('repos/'+spec.repository+'/compare/'+pin.sha+'...'+sha);
      }
    }
  }
  const proposals=planCaptureV2UpstreamReviews({release,pins,labs});
  if(!proposals.length){
    console.log('NOOP: both official main sources unchanged or no new certified fast-forward');
    return;
  }
  const titles=existingIssueTitles();
  for(const proposal of proposals){
    ensure(mainSha(OWN)===initial,
      'Publisher main changed during observation: no issue created');
    ensure(mainSha(proposal.repository)===proposal.officialSha,
      proposal.lab+' main changed after certification: no issue created');
    const title=titleFor(proposal);
    if(titles.has(title)){console.log('ALREADY OPEN '+title);continue}
    const created=JSON.parse(gh('api','repos/'+OWN+'/issues','--method','POST',
      '-f','title='+title,'-f','body='+issueBody(proposal)));
    ensure(Boolean(created.html_url),'Could not create review issue');
    titles.add(title);
    console.log('UPSTREAM REVIEW '+proposal.lab+' '+created.html_url);
  }
}

if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  main().catch(error=>{console.error('::error::'+error.message);process.exitCode=1});
}
