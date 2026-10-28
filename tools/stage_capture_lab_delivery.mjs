// Capture release transport: byte-for-byte official Lab modules, not another engine.
// This stages only a dormant, reviewable payload. Only Capture's single owner
// may install a provider after the public Hub migration and browser gates pass.
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,existsSync,rmSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,relative,dirname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {COMBAT_LAB_SOURCE_V1} from '../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [labArg,mediaArg,outArg]=process.argv.slice(2);
if(!labArg||!mediaArg||!outArg)throw Error('Usage: stage_capture_lab_delivery.mjs <pinned-combat> <pinned-assets> <site-directory>');
const lab=resolve(labArg),media=resolve(mediaArg),site=resolve(outArg);
if(site===root||!site.startsWith(root+sep))throw Error('Delivery must be inside a disposable site directory');
const ref=JSON.parse(readFileSync(join(root,'docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'),'utf8'));
const sha=directory=>execFileSync('git',['-C',directory,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha(lab)!==COMBAT_LAB_SOURCE_V1.sha||ref.authoredSourceLabPin!==COMBAT_LAB_SOURCE_V1.sha)
 throw Error('Official Combat source pin mismatch');
if(sha(media)!==ref.authoredAssetsPin||ref.authoredAssetsRepository!==COMBAT_LAB_SOURCE_V1.repository)
 throw Error('Official Combat visual source pin mismatch');
if(ref.productionActivated!==false)throw Error('This preparatory delivery must not activate public gameplay');
const vendorDest=join(site,'vendor/combat-lab');
const dataDest=join(site,'assets/gensrpg/capture/runtime-data');
if(existsSync(vendorDest)||existsSync(dataDest))throw Error('Refusing to overwrite another Combat delivery');
const tmp=mkdtempSync(join(tmpdir(),'gensrpg-combat-official-'));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
 const path=join(dir,item.name);return item.isDirectory()?walk(path):item.isFile()?[path]:[];
});
try{
 // Reuse the already pinned/CI-tested author+runtime preview builder. It
 // validates the exact Lab and media refs and imports the official exporter.
 execFileSync(process.execPath,[join(root,'tools/build_capture_lab_preview.mjs'),lab,tmp,media],{
  cwd:root,stdio:'inherit',maxBuffer:10*1024*1024
 });
 const originalVendor=join(tmp,'vendor/combat-lab');
 const originalData=join(tmp,'assets/gensrpg/capture/preview/generated');
 const inputs=JSON.parse(readFileSync(join(originalData,'author-inputs.json'),'utf8'));
 const source=JSON.parse(readFileSync(join(originalData,'source.json'),'utf8'));
 if(source.combatSha!==COMBAT_LAB_SOURCE_V1.sha||source.assetsSha!==ref.authoredAssetsPin||
    inputs.sourceSha!==COMBAT_LAB_SOURCE_V1.sha||inputs.schema!=='gensrpg-capture-lab-author-inputs-v1'){
  throw Error('Official authored payload provenance mismatch');
 }
 const supported=inputs.creatureTransfers.map(x=>x?.draft?.id);
 if(supported.length<2||supported.some(id=>typeof id!=='string'||!id.trim())||
    new Set(supported).size!==supported.length||
    !supported.includes(source.expectedPlayer)||!supported.includes(source.expectedOpponent)){
  throw Error('Authored export has invalid/duplicate supported species');
 }
 const sourceFiles=walk(join(originalVendor,'src'));
 if(!sourceFiles.length)throw Error('Missing official Combat Core modules');
 mkdirSync(dirname(vendorDest),{recursive:true});
 cpSync(originalVendor,vendorDest,{recursive:true,errorOnExist:true});
 mkdirSync(dataDest,{recursive:true});
 for(const name of ['author-inputs.json','global-visual-assets.json','source.json','authored-export.json']){
  cpSync(join(originalData,name),join(dataDest,name),{errorOnExist:true});
 }
 const entries=[];
 for(const directory of [vendorDest,dataDest]){
  for(const path of walk(directory).sort()){
   const rel=relative(site,path).split(sep).join('/');
   if(rel.endsWith('/delivery-manifest.json'))continue;
   const b=readFileSync(path);
   entries.push({path:rel,size:b.length,sha256:sha256(b)});
  }
 }
 entries.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 if(entries.some(x=>!x.size||!/^[a-f0-9]{64}$/.test(x.sha256)))throw Error('Invalid transport bytes');
 const manifest={
  schema:'gensrpg-capture-official-delivery-v1',
  version:1,productionActivated:false,
  combatRepository:COMBAT_LAB_SOURCE_V1.repository,
  combatSha:COMBAT_LAB_SOURCE_V1.sha,
  assetsRepository:ref.authoredAssetsRepository,assetsSha:ref.authoredAssetsPin,
  supportedCreatureIds:supported,
  dataDirectory:'assets/gensrpg/capture/runtime-data/',
  vendorDirectory:'vendor/combat-lab/',
  transport:entries
 };
 writeFileSync(join(dataDest,'delivery-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({delivery:'official-pinned',combatSha:manifest.combatSha,
  assetsSha:manifest.assetsSha,supportedSpecies:supported,files:entries.length,
  productionActivated:false}));
}finally{
 rmSync(tmp,{recursive:true,force:true});
}