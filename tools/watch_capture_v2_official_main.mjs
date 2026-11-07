// Capture V2 official-main certification watcher + draft PR proposer.
// It stages immutable, minimal manifest-only source candidates and a separate
// review-only publisher PR. Never merges or deploys; C2 CI, HTTPS and Android
// checks are mandatory before a human promotes a candidate. Legacy V1 unchanged.
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

// One immutable candidate for all independently certified upstream changes.
// Preserve the other Lab, gameplay data, legacy flag and every user-facing rule.
export function planCertifiedCaptureV2SourceUpdate({release,pins,labs}){
  const proposals=planCaptureV2UpstreamReviews({release,pins,labs});
  if(!proposals.length)return null;
  const nextPins=JSON.parse(JSON.stringify(pins));
  for(const change of proposals){
    nextPins[change.lab].sha=change.officialSha;
    nextPins[change.lab].certifiedCiRun=change.certifiedCiRun;
  }
  return Object.freeze({proposals,nextPins});
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

// Each Git tree update targets a new dedicated branch; production main is
// checked before and after staging. The only source code touched is one
// versioned manifest. No binary assets, duplicate engine or IndexedDB writes.
function readContents(path,ref){
  const file=api('repos/'+OWN+'/contents/'+path+'?ref='+ref);
  ensure(file.encoding==='base64' && isSha(file.sha) &&
    typeof file.content==='string','Cannot read immutable file '+path);
  return {sha:file.sha,text:Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8')};
}
function createRef(branch,sha){
  ensure(isSha(sha) && /^automation\/capture-v2-labs-[a-z0-9-]+$/.test(branch),
    'Unexpected automated ref');
  apiPost('repos/'+OWN+'/git/refs',
    ['-f','ref=refs/heads/'+branch,'-f','sha='+sha]);
}
function apiPost(endpoint,fields){
  return JSON.parse(gh('api',endpoint,'--method','POST',...fields));
}
function putFile(path,branch,sha,content,message){
  const result=JSON.parse(gh('api','repos/'+OWN+'/contents/'+path,
    '--method','PUT','-f','branch='+branch,'-f','sha='+sha,
    '-f','message='+message,
    '-f','content='+Buffer.from(content,'utf8').toString('base64')));
  ensure(isSha(result?.commit?.sha),'GitHub rejected immutable update to '+path);
  return result.commit.sha;
}
function planBranchNames(release,nextPins){
  const label=[release.sha.slice(0,8),nextPins.combat.sha.slice(0,8),
    nextPins.exploration.sha.slice(0,8)].join('-');
  return Object.freeze({
    source:'automation/capture-v2-labs-source-'+label,
    publisher:'automation/capture-v2-labs-publish-'+label
  });
}
function stageCertifiedDraftPR({release,pins,proposals,nextPins,initial}){
  const branches=planBranchNames(release,nextPins);
  const open=api('repos/'+OWN+'/pulls?state=open&per_page=100');
  ensure(Array.isArray(open)&&open.length<100,'Review PR census is incomplete');
  if(open.some(pr=>pr.head?.ref===branches.publisher)){
    console.log('ALREADY OPEN review PR '+branches.publisher);
    return;
  }
  ensure(mainSha(OWN)===initial,'Publisher main moved before candidate staging');
  for(const p of proposals)
    ensure(mainSha(p.repository)===p.officialSha,
      p.lab+' main changed after certification');
  const sourcePath='assets/gensrpg/capture-v2/source-pins-v1.json';
  const originalSource=readContents(sourcePath,release.sha);
  ensure(JSON.stringify(JSON.parse(originalSource.text))===JSON.stringify(pins),
    'Current published source differs from certified read');
  const releasePath='tools/capture_v2_pages_preview_pin.json';
  const originalRelease=readContents(releasePath,initial);
  ensure(JSON.parse(originalRelease.text).sha===release.sha,
    'Publisher main release pin changed during review');
  createRef(branches.source,release.sha);
  const sourceSha=putFile(sourcePath,branches.source,originalSource.sha,
    JSON.stringify(nextPins,null,2)+'\n',
    'build(capture): pin certified official Combat and Exploration mains');
  ensure(mainSha(OWN)===initial,'Publisher main moved after source candidate');
  for(const p of proposals)
    ensure(mainSha(p.repository)===p.officialSha,
      p.lab+' main moved after source candidate');
  createRef(branches.publisher,initial);
  const updatedRelease=JSON.parse(originalRelease.text);
  updatedRelease.sha=sourceSha;
  const publisherSha=putFile(releasePath,branches.publisher,originalRelease.sha,
    JSON.stringify(updatedRelease,null,2)+'\n',
    'chore(capture): propose immutable certified Lab source for review');
  ensure(mainSha(OWN)===initial,
    'Publisher main moved during proposal; review must rebase');
  const title='[Capture V2] Intégration automatique proposée '+nextPins.combat.sha.slice(0,8)+' / '+nextPins.exploration.sha.slice(0,8);
  const body=[
    '## Proposition automatique, jamais une publication',
    '',
    '- Base publisher main exacte : '+initial,
    '- Source Capture précédente : '+release.sha,
    '- Candidat source, manifest-only : '+sourceSha,
    '- Branche de source isolée : '+branches.source,
    '- Combat officiel main GREEN : '+nextPins.combat.sha+' (run '+nextPins.combat.certifiedCiRun+')',
    '- Exploration officiel main GREEN : '+nextPins.exploration.sha+' (run '+nextPins.exploration.certifiedCiRun+')',
    '',
    'Cette PR ne modifie que tools/capture_v2_pages_preview_pin.json ; le candidat source ne modifie que ses SHA/provenances officielles.',
    'Aucune mutation du root, du service worker, des données de jeu, des sprites ni des sauvegardes.',
    '',
    'NE PAS FUSIONNER sans CI intégration complète au SHA '+publisherSha+
    ', contrôle Pages HTTPS et essai Android/PWA ; aucun auto-merge ni déploiement de ce robot.'
  ].join('\n');
  const pr=apiPost('repos/'+OWN+'/pulls',
    ['-f','head='+branches.publisher,'-f','base=main',
     '-f','title='+title,'-f','body='+body,'-F','draft=true']);
  ensure(pr.draft===true && typeof pr.html_url==='string',
    'A draft review PR was not created');
  console.log('AUTOMATIC DRAFT PR '+pr.html_url);
  // A PR created by the default GITHUB_TOKEN does NOT trigger pull_request
  // workflows. Explicit dispatch is mandatory; never deploy from this bot.
  for(const workflow of [
    'main.yml','gensrpg-architecture-sentinels.yml',
    'gensrpg-firefox-wall-sentinel.yml',
    'gensrpg-tactical-dock-sentinel.yml',
    'capture-lab-runtime.yml','capture-lab-delivery.yml'
  ]){
    gh('workflow','run',workflow,'--ref',branches.publisher);
  }
  console.log('DISPATCHED independent C2 review gates on '+publisherSha);
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
  const plan=planCertifiedCaptureV2SourceUpdate({release,pins,labs});
  if(!plan){
    console.log('NOOP: official Lab main sources unchanged or not certified');
    return;
  }
  try{
    stageCertifiedDraftPR({release,pins,...plan,initial});
  }catch(error){
    // GitHub Actions installations may deny workflow-created PRs. Fail safe:
    // never merge, never update main, and record a bounded actionable issue.
    console.error('::warning::Automatic review PR could not be staged: '+error.message);
    const titles=existingIssueTitles();
    for(const p of plan.proposals){
      const title=titleFor(p);
      if(titles.has(title)){console.log('ALREADY OPEN '+title);continue}
      const issue=apiPost('repos/'+OWN+'/issues',
        ['-f','title='+title,'-f','body='+issueBody(p)+
          '\n\nAutomated PR attempt failed: '+error.message]);
      ensure(Boolean(issue.html_url),'Could not create fallback review issue');
      titles.add(title);
      console.log('FALLBACK REVIEW '+issue.html_url);
    }
  }
}

if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  main().catch(error=>{console.error('::error::'+error.message);process.exitCode=1});
}
