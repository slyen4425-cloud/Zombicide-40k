// Single existing GitHub Pages publisher: immutable PR #225 candidate is
// staged only under /preview/capture-v2-pr225/. No second runtime/publisher.
// The exact Combat and Exploration owners are both read from PR #225's
// canonical pins and checked against their published main branch SHAs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertOfficialMainHistoryPin} from './verify_official_main_pin.mjs';

const [sourceArg,combatArg,explorationArg,siteArg]=process.argv.slice(2);
if(!sourceArg||!combatArg||!explorationArg||!siteArg)
  throw Error('Usage: stage_capture_v2_pages_preview.mjs <capture-pr-SHA> <combat-main> <exploration-main> <_site>');
const source=path.resolve(sourceArg),combat=path.resolve(combatArg),
  exploration=path.resolve(explorationArg),site=path.resolve(siteArg);
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
  throw Error('Capture V2 preview may use only approved immutable PR #225 SHA');
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
for(const filename of ['index.html','builder.html','world-assembler.html','sculpt-lab.html','manifest.webmanifest']){
  const from=path.join(exploration,filename);
  if(fs.existsSync(from))fs.copyFileSync(from,path.join(exploreDest,filename));
}
// Delegate the native Combat transport and the derived official Showcase to
// the already tested PR #225 staging script, at the SAME exact immutable SHA.
const officialStage=path.join(source,'tools/stage_capture_v2_labs.mjs');
execFileSync(process.execPath,[officialStage,combat,exploration,trial],
  {stdio:'inherit',timeout:180000});
const delivery=JSON.parse(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json'));
if(delivery.combat.sha!==sourcePin.combat.sha||
   delivery.exploration.sha!==sourcePin.exploration.sha||
   delivery.legacyCaptureRuntime!==false)
  throw Error('Certified native delivery differs from approved pins');
const provenance={
  schema:'gensrpg-capture-v2-isolated-pages-preview-v1',
  publicPath:previewPin.publicPath,
  source:{repository:'slyen4425-cloud/Zombicide-40k',
    ref:'pr-225-immutable-commit',commit:expectedPreviewSha},
  combat:{repository:sourcePin.combat.repository,ref:'main',sha:sourcePin.combat.sha},
  exploration:{repository:sourcePin.exploration.repository,ref:'main',sha:sourcePin.exploration.sha},
  legacyCaptureRuntime:false,
  productionRootSha256:preserved['index.html'],
  productionServiceWorkerSha256:preserved['service-worker.js'],
  productionManifestSha256:preserved['manifest.webmanifest'],
  previewIndexSha256:digest(bytes(trial,'index.html')),
  deliveryManifestSha256:digest(bytes(trial,'assets/gensrpg/capture-v2/delivery-manifest.json'))
};
fs.writeFileSync(path.join(trial,'release-provenance.v1.json'),JSON.stringify(provenance,null,2)+'\n');
for(const [rel,hash] of Object.entries(preserved))
  if(digest(bytes(site,rel))!==hash)
    throw Error('Preview mutated the protected production root: '+rel);
if(fs.existsSync(path.join(trial,'assets/gensrpg/capture')))
  throw Error('Retired Capture was transported into preview');
console.log('Immutable Capture V2 staged under '+provenance.publicPath+
  ' with two official main-only Lab owners and production root protected');
