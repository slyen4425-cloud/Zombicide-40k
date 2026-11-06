// One immutable visual publication source for every Capture V2 assembled gate.
// The approval manifest is taken from the already certified public GenSRPG
// release, not guessed from the moving Combat global-assets branch.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [visualArg,pinArg,siteArg]=process.argv.slice(2);
if(!visualArg||!pinArg||!siteArg)
 throw Error('Usage: stage_capture_v2_official_visuals.mjs <visual-checkout> <approved-public-pin.json> <_site>');
const visual=path.resolve(visualArg),pinFile=path.resolve(pinArg),site=path.resolve(siteArg);
const pin=JSON.parse(fs.readFileSync(pinFile,'utf8'));
const owner=pin.officialVisuals;
if(pin.schema!=='gensrpg-capture-v2-pages-source-pin-v1'||
   pin.publicPath!=='/preview/capture-v2-pr225/'||
   owner?.repository!=='slyen4425-cloud/GenSrpg_labo_combat_dynamique'||
   owner?.ref!=='global-assets'||!/^[a-f0-9]{40}$/.test(owner.sha)||
   !Number.isInteger(owner.certifiedCiRun)||owner.certifiedCiRun<=0)
 throw Error('No approved immutable Combat visual catalogue pin');
const actual=execFileSync('git',['-C',visual,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(actual!==owner.sha)
 throw Error('Visual checkout does not match approved immutable release SHA');
const rel='data/assets/catalog/global-visual-assets.v1.json';
const original=fs.readFileSync(path.join(visual,rel));
const catalog=JSON.parse(original.toString('utf8'));
if(catalog.version!==1||catalog.catalogId!=='gensrpg-global-visual-assets'||
   !Array.isArray(catalog.assets)||catalog.assets.length===0||
   new Set(catalog.assets.map(x=>x.id)).size!==catalog.assets.length)
 throw Error('Approved Combat visual catalogue missing or invalid');
const dest=path.join(site,'vendor/exploration-lab/capture-assets',rel);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,original);
if(!fs.readFileSync(dest).equals(original))
 throw Error('Capture V2 visual catalogue drift during staging');
console.log('Capture V2: immutable visual catalogue '+owner.sha+
 ' staged byte-identically ('+catalog.assets.length+' assets)');


// User-facing Capture sheet uses the front portrait of each officially
// published Combat creature. Stage exactly those immutable files, not the
// entire (large) author asset library. The Bestiary has already checked the
// publication contract; this transport must never synthesize missing art.
const bundleRel='vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json';
const bundle=JSON.parse(fs.readFileSync(path.join(site,bundleRel),'utf8'));
if(bundle.schema!=='capture-author-encounter-bundle-v1')throw Error('No official Combat Showcase for portraits');
const byId=new Map(catalog.assets.map(entry=>[entry.id,entry]));
const names=new Set();
for(const transfer of bundle.creatureTransfers??[]){
 const frontId=transfer?.draft?.presentation?.visual?.front?.assetId;
 if(typeof frontId!=='string'||!frontId)continue;
 const asset=byId.get(frontId);
 if(!asset||asset.mediaType!=='image'||
    !['sprite','portrait'].includes(asset.assetType)||
    Number(asset.resource?.frameCount??1)!==1)
  throw Error('Official Bestiary portrait missing for '+String(transfer.draft?.id));
 const file=asset.resource?.file;
 if(typeof file!=='string'||
   !/^(?:capture|core)\/[\w./-]+\.(?:png|webp|jpg|jpeg)$/i.test(file)||
   file.split('/').includes('..'))throw Error('Unsafe Combat portrait path');
 names.add(file);
}
if(!names.size)throw Error('No official creature front portraits to transport');
const patterns=['/data/assets/catalog/*',
 ...[...names].sort().map(file=>'/assets/library/'+file)];
execFileSync('git',['-C',visual,'sparse-checkout','set','--no-cone',...patterns],
 {encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
const mediaRoot=path.join(site,'vendor/exploration-lab/capture-assets/assets/library');
for(const file of [...names].sort()){
 const from=path.join(visual,'assets/library',file),to=path.join(mediaRoot,file);
 if(!fs.existsSync(from)||!fs.statSync(from).isFile())
  throw Error('Missing certified Combat front portrait: '+file);
 fs.mkdirSync(path.dirname(to),{recursive:true});
 fs.copyFileSync(from,to);
 if(!fs.readFileSync(to).equals(fs.readFileSync(from)))
  throw Error('Portrait bytes drifted during official transport: '+file);
}
console.log('Capture V2: '+names.size+' immutable front portraits physically staged from '+owner.sha);
