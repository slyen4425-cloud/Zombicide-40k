// Native Exploration encounter package for the existing Capture V2 Pages
// preview. This reproduces Exploration main's OWN CI integration overlay:
// Explorer owns the encounter bridge; Combat main owns every battle rule.
// Media are transported from the immutable, already certified visual pin.
// No generated gameplay, legacy Capture fallback or moving branch checkout.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const head=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
function copyFile(from,to){
 if(!fs.statSync(from).isFile()||fs.lstatSync(from).isSymbolicLink())
  throw Error('Official encounter transport file missing or symlinked: '+from);
 fs.mkdirSync(path.dirname(to),{recursive:true});
 fs.copyFileSync(from,to);
 if(digest(fs.readFileSync(from))!==digest(fs.readFileSync(to)))
  throw Error('Encounter original file changed during transport: '+from);
}
function copyTree(from,to){
 const stat=fs.lstatSync(from);
 if(stat.isSymbolicLink())throw Error('Forbidden symlink in official encounter package: '+from);
 if(stat.isDirectory()){
  fs.mkdirSync(to,{recursive:true});
  for(const entry of fs.readdirSync(from).sort())copyTree(path.join(from,entry),path.join(to,entry));
 }else if(stat.isFile())copyFile(from,to);
 else throw Error('Unsupported official encounter file: '+from);
}
function certifiedPath(value){
 if(typeof value!=='string'||!value||value.startsWith('/')||
    !/^[a-zA-Z0-9_.\/-]+$/.test(value)||value.split('/').includes('..'))
  throw Error('Invalid author-owned visual resource path: '+String(value));
 return value;
}
export function stageOfficialCaptureEncounterBridge({
 previewRoot,combatRoot,explorationRoot,visualsRoot,
 combatSha,explorationSha,visualsSha
}){
 for(const [name,dir,pin] of [
  ['combat',combatRoot,combatSha],
  ['exploration',explorationRoot,explorationSha],
  ['visuals',visualsRoot,visualsSha]
 ])if(!/^[a-f0-9]{40}$/.test(pin)||head(dir)!==pin)
   throw Error('Encounter '+name+' checkout differs from the immutable approved commit');

 const base='vendor/exploration-lab/';
 const target=path.join(previewRoot,base);
 const battle=path.join(target,'combat-preview');
 const media=path.join(target,'capture-assets');
 const bundlePath=path.join(battle,'data/capture/showcase/encounter-bundle.v1.json');
 const approvedBundle=fs.readFileSync(bundlePath);
 const officialBundle=JSON.parse(approvedBundle.toString('utf8'));
 if(officialBundle.schema!=='capture-author-encounter-bundle-v1'||
    officialBundle.authorSha!==combatSha||officialBundle.engineSha!==combatSha)
  throw Error('Derived Showcase must be the same certified Combat main');

 // Follow the canonical Exploration main .github/workflows/ci.yml layout,
 // which builds the bridge as an overlay on the real Combat repository.
 for(const folder of ['src','data','examples/dom-demo'])
  copyTree(path.join(combatRoot,folder),path.join(battle,folder));
 const audio='assets/runtime/audio-test';
 if(fs.existsSync(path.join(combatRoot,audio)))
  copyTree(path.join(combatRoot,audio),path.join(battle,audio));
 for(const name of ['exploration-encounter.html','exploration-encounter.js',
   'exploration-native-source-v1.js','party.preview.v1.json'])
  copyFile(path.join(explorationRoot,'integration/combat-bridge',name),
   path.join(battle,'examples/dom-demo',name));
 if(digest(fs.readFileSync(bundlePath))!==digest(approvedBundle))
  throw Error('Encounter packaging must not overwrite the approved derived Showcase');
 if(!fs.readFileSync(path.join(battle,'examples/dom-demo/exploration-encounter.js'),'utf8')
       .includes('mountCoop2v2Test'))
  throw Error('Exploration bridge does not delegate to Combat main');

 const catalogFrom=path.join(visualsRoot,'data/assets/catalog/global-visual-assets.v1.json');
 const catalog=JSON.parse(fs.readFileSync(catalogFrom,'utf8'));
 if(catalog.storage?.repository!=='slyen4425-cloud/GenSrpg_labo_combat_dynamique'||
    !Array.isArray(catalog.assets)||catalog.assets.length<30)
  throw Error('Missing official immutable Capture visual catalog');
 const requested=new Set();
 const sequenceDirs=new Set();
 for(const entry of catalog.assets){
  const resource=entry.resource??{};
  if(resource.file)requested.add(certifiedPath(resource.file));
  if(resource.manifest){
   const rel=certifiedPath(resource.manifest);
   requested.add(rel);
   sequenceDirs.add(path.posix.dirname(rel));
  }
 }
 // Only author-listed media are fetched. A complete checkout of the
 // global-assets branch would transport hundreds of MB of unreferenced
 // individual PNG frames and bust the GitHub Pages publication budget.
 const patterns=['/data/assets/catalog/*',
  ...[...requested].sort().map(s=>'/assets/library/'+s),
  ...[...sequenceDirs].sort().map(s=>'/assets/library/'+s+'/*')];
 execFileSync('git',['-C',visualsRoot,'sparse-checkout','set','--no-cone',...patterns],
   {encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024});
 const files=[];
 const record=(from,to,rel)=>{
  copyFile(from,to);
  files.push({path:base+rel,sha256:digest(fs.readFileSync(to))});
 };
 const catalogRel='capture-assets/data/assets/catalog/global-visual-assets.v1.json';
 record(catalogFrom,path.join(target,catalogRel),catalogRel);
 const mediaRoot=path.join(visualsRoot,'assets/library');
 const all=new Set(requested);
 for(const folder of sequenceDirs){
  const from=path.join(mediaRoot,folder);
  for(const name of fs.readdirSync(from,{withFileTypes:true})){
   if(!name.isFile())throw Error('Unexpected sequence media entry: '+name.name);
   all.add(folder+'/'+name.name);
  }
 }
 for(const rel of [...all].sort())record(path.join(mediaRoot,rel),
  path.join(media,'assets/library',rel),'capture-assets/assets/library/'+rel);
 // The native bridge files have a SOURCE-OF-TRUTH label, not their own author
 // or ruleset. Record the complete physical bridge byte graph for HTTP proof.
 const bridgeRel='combat-preview/examples/dom-demo/';
 for(const name of ['exploration-encounter.html','exploration-encounter.js',
  'exploration-native-source-v1.js','party.preview.v1.json']){
  const rel=bridgeRel+name;
  files.push({path:base+rel,sha256:digest(fs.readFileSync(path.join(target,rel)))});
 }
 for(const name of ['capture-editor-v2.html','capture-editor-v2.css','demo.css',
  'demo-assets.js']){
  const rel=bridgeRel+name;
  files.push({path:base+rel,sha256:digest(fs.readFileSync(path.join(target,rel)))});
 }
 const srcRel='combat-preview/src/ui/combat-2v2-test-ui.js';
 files.push({path:base+srcRel,sha256:digest(fs.readFileSync(path.join(target,srcRel)))});
 const bundleRel='combat-preview/data/capture/showcase/encounter-bundle.v1.json';
 files.push({path:base+bundleRel,sha256:digest(approvedBundle)});
 const result={
  schema:'gensrpg-capture-v2-native-encounter-transport-v1',
  encounterEntry:base+'combat-preview/examples/dom-demo/exploration-encounter.html',
  combat:{repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',ref:'main',sha:combatSha},
  exploration:{repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',ref:'main',sha:explorationSha},
  assets:{repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',sha:visualsSha,
    files:all.size,catalogEntries:catalog.assets.length},
  legacyCaptureRuntime:false,
  files:files.sort((a,b)=>a.path.localeCompare(b.path))
 };
 fs.writeFileSync(path.join(previewRoot,'bridge-transport-manifest.v1.json'),
  JSON.stringify(result,null,2)+'\n');
 console.log('Official native Encounter bridge staged:',result.encounterEntry,
  'media:',result.assets.files,'Combat:',combatSha,'Exploration:',explorationSha);
 return result;
}
