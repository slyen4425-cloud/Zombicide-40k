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
