// Single existing GitHub Pages publisher: the approved immutable candidate is
// staged only under /preview/capture-v2-pr225/. No second runtime/publisher.
// The exact Combat and Exploration owners are both read from the candidate's
// canonical pins and checked against their published main branch SHAs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertOfficialMainHistoryPin} from './verify_official_main_pin.mjs';
import {stageOfficialCaptureEncounterBridge} from './stage_capture_v2_encounter_bridge.mjs';
import {releasePreviewPwaForCommit,enableAutomaticPreviewActivation} from './capture_v2_pwa_release.mjs';

const [sourceArg,combatArg,explorationArg,siteArg,visualsArg]=process.argv.slice(2);
if(!sourceArg||!combatArg||!explorationArg||!siteArg||!visualsArg)
  throw Error('Usage: stage_capture_v2_pages_preview.mjs <capture-pr-SHA> <combat-main> <exploration-main> <_site> <approved-visuals>');
const source=path.resolve(sourceArg),combat=path.resolve(combatArg),
  exploration=path.resolve(explorationArg),site=path.resolve(siteArg),visuals=path.resolve(visualsArg);
const trial=path.join(site,'preview','capture-v2-pr225');
const previewPin=JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),
  'capture_v2_pages_preview_pin.json'),'utf8'));
if(previewPin.schema!=='gensrpg-capture-v2-pages-source-pin-v1'||
   previewPin.repository!=='slyen4425-cloud/Zombicide-40k'||
   previewPin.publicPath!=='/preview/capture-v2-pr225/'||
   !/^[a-f0-9]{40}$/.test(previewPin.sha))throw Error('Invalid canonical preview pin');
const expectedPreviewSha=previewPin.sha;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const head=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const bytes=(dir,rel)=>fs.readFileSync(path.join(dir,rel));
const sourcePin=JSON.parse(bytes(source,'assets/gensrpg/capture-v2/source-pins-v1.json'));
const owners={combat,exploration};
if(head(source)!==expectedPreviewSha)
  throw Error('Capture V2 preview may use only the approved immutable candidate SHA');
if(sourcePin.legacyCaptureRuntime!==false)
  throw Error('Old Capture cannot enter isolated preview');
for(const [owner,dir] of Object.entries(owners)){
  const pin=sourcePin[owner];
  if(pin.ref!=='main'||!/^[a-f0-9]{40}$/.test(pin.sha)||head(dir)!==pin.sha)
    throw Error(owner+' checkout does not match the certified preview main pin');
  assertOfficialMainHistoryPin({repository:pin.repository,sha:pin.sha});
}
if(!fs.existsSync(path.join(site,'index.html')))
  throw Error('Canonical Pages production root must be assembled first');
const preserved={};
for(const rel of ['index.html','service-worker.js','manifest.webmanifest']){
  preserved[rel]=digest(bytes(site,rel));
}
const relative=path.relative(site,trial);
if(relative!==path.join('preview','capture-v2-pr225'))
  throw Error('Preview escaped its isolated subdirectory');
fs.rmSync(trial,{recursive:true,force:true});
fs.mkdirSync(path.join(trial,'assets'),{recursive:true});
const copyFile=(rel,dst=rel)=>{
  const input=path.join(source,rel),output=path.join(trial,dst);
  if(!fs.statSync(input).isFile())throw Error('Missing original GenSrpg file: '+rel);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.copyFileSync(input,output);
};
for(const rel of ['index.html','service-worker.js','manifest.webmanifest'])
  copyFile(rel);
// The immutable Capture source is NOT the release version. Every main or PR
// deploy must install a new worker and publish matching HTML version markers
// even if tools/capture_v2_pages_preview_pin.json is unchanged. Cache scopes
// remain isolated on the shared github.io origin (no other PWA's cache deletion).
const publisherCommit=process.env.GITHUB_SHA;
const stagedPwa=releasePreviewPwaForCommit(
  bytes(source,'service-worker.js').toString('utf8'),
  bytes(source,'index.html').toString('utf8'),
  publisherCommit
);
fs.writeFileSync(path.join(trial,'service-worker.js'),stagedPwa.worker);
fs.writeFileSync(path.join(trial,'index.html'),enableAutomaticPreviewActivation(stagedPwa.html));
for(const filename of fs.readdirSync(source).filter(x=>/^sound_.*\.mp3$/.test(x)))
  copyFile(filename);
for(const filename of ['icon-192.png','icon-512.png']){
  if(!fs.existsSync(path.join(source,filename)))continue;
  copyFile(filename);
  copyFile(filename,'icons/'+filename);
}
// Copy ONLY the original candidate's static assets. Exclude the retired
// Capture runtime; no invented rule/data registry is allowed in this stage.
const assetsRoot=path.join(source,'assets');
fs.cpSync(assetsRoot,path.join(trial,'assets'),{
  recursive:true,force:true,errorOnExist:false,
  filter(p){
    if(fs.lstatSync(p).isSymbolicLink())
      throw Error('Symlink in preview assets: '+p);
    const rel=path.relative(assetsRoot,p).split(path.sep).join('/');
    return rel!=='gensrpg/capture'&&!rel.startsWith('gensrpg/capture/');
  }
});
const exploreDest=path.join(trial,'vendor/exploration-lab');
fs.mkdirSync(exploreDest,{recursive:true});
for(const folder of ['src','assets'])
  fs.cpSync(path.join(exploration,folder),path.join(exploreDest,folder),
    {recursive:true,filter(p){
      if(fs.lstatSync(p).isSymbolicLink())throw Error('Symlink in official Exploration: '+p);
      return true;
    }});
for(const filename of ['index.html','builder.html','world-assembler.html','sculpt-lab.html','play.html','manifest.webmanifest']){
  const from=path.join(exploration,filename);
  if(fs.existsSync(from))fs.copyFileSync(from,path.join(exploreDest,filename));
}
// Delegate the native Combat transport and the derived official Showcase to
// the candidate staging script, at the SAME exact immutable SHA.
const officialStage=path.join(source,'tools/stage_capture_v2_labs.mjs');
execFileSync(process.execPath,[officialStage,combat,exploration,trial],
  {stdio:'inherit',timeout:180000});
const delivery=JSON.parse(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json'));
if(delivery.combat.sha!==sourcePin.combat.sha||
   delivery.exploration.sha!==sourcePin.exploration.sha||
   delivery.legacyCaptureRuntime!==false)
  throw Error('Certified native delivery differs from approved pins');
// Complete the original Lab Exploration handoff contract. Exploration owns
// integration/combat-bridge and Combat owns its original runtime. Never
// invent the missing page or redirect to another engine/legacy renderer.
// Visual art has its OWN official immutable author branch, separate from
// Combat main's rule authority. The preview release pin is its single
// explicitly certified source. Never borrow the older production catalog
// whose Heriplante IDs are absent, and never read a moving branch at runtime.
const mediaAuthority=previewPin.officialVisuals;
const approvedVisuals=mediaAuthority?.sha;
if(mediaAuthority?.repository!==sourcePin.combat.repository||
   mediaAuthority.ref!=='global-assets'||
   !Number.isInteger(mediaAuthority.certifiedCiRun)||mediaAuthority.certifiedCiRun<=0||
   !/^[a-f0-9]{40}$/.test(approvedVisuals)||head(visuals)!==approvedVisuals)
  throw Error('Encounter media must use the single certified immutable official visual library SHA');
const bridge=stageOfficialCaptureEncounterBridge({
  previewRoot:trial,combatRoot:combat,explorationRoot:exploration,visualsRoot:visuals,
  combatSha:sourcePin.combat.sha,explorationSha:sourcePin.exploration.sha,
  visualsSha:approvedVisuals
});
const provenance={
  schema:'gensrpg-capture-v2-isolated-pages-preview-v1',
  publicPath:previewPin.publicPath,
  publisherCommit,
  source:{repository:'slyen4425-cloud/Zombicide-40k',
    ref:'approved-immutable-commit',commit:expectedPreviewSha},
  combat:{repository:sourcePin.combat.repository,ref:'main',sha:sourcePin.combat.sha},
  exploration:{repository:sourcePin.exploration.repository,ref:'main',sha:sourcePin.exploration.sha},
  legacyCaptureRuntime:false,
  productionRootSha256:preserved['index.html'],
  productionServiceWorkerSha256:preserved['service-worker.js'],
  previewServiceWorkerSha256:digest(bytes(trial,'service-worker.js')),
  productionManifestSha256:preserved['manifest.webmanifest'],
  previewIndexSha256:digest(bytes(trial,'index.html')),
  deliveryManifestSha256:digest(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json')),
  encounterBridgeManifestSha256:digest(bytes(trial,'bridge-transport-manifest.v1.json'))
};
fs.writeFileSync(path.join(trial,'release-provenance.v1.json'),JSON.stringify(provenance,null,2)+'\n');
for(const [rel,hash] of Object.entries(preserved))
  if(digest(bytes(site,rel))!==hash)
    throw Error('Preview mutated the protected production root: '+rel);
if(fs.existsSync(path.join(trial,'assets/gensrpg/capture')))
  throw Error('Retired Capture was transported into preview');
console.log('Immutable Capture V2 staged under '+provenance.publicPath+
  ' with two official main-only Lab owners and production root protected');
