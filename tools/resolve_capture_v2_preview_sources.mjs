// Only the immutable, CI-reviewed Capture V2 candidate owns its official
// Combat and Exploration source pins. The Pages publisher must NEVER maintain
// a second set of hardcoded Lab SHAs or resolve a floating branch at render.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const owned=Object.freeze({
 combat:Object.freeze({repository:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',path:'vendor/combat-lab/'}),
 exploration:Object.freeze({repository:'slyen4425-cloud/laboratoire_dynamique_exploration-',path:'vendor/exploration-lab/'})
});
const sha=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
export function resolveCaptureV2PreviewSourcesV1(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
  input.schema!=='gensrpg-capture-v2-official-main-pins-v1' ||
  input.legacyCaptureRuntime!==false)
  throw new TypeError('Untrusted official Capture V2 source manifest');
 const result={};
 for(const [name,spec] of Object.entries(owned)){
  const value=input[name];
  if(!value||typeof value!=='object'||Array.isArray(value)||
   value.repository!==spec.repository||value.path!==spec.path||
   value.ref!=='main'||!sha(value.sha)||
   !Number.isSafeInteger(value.certifiedCiRun)||value.certifiedCiRun<=0)
   throw new RangeError('Uncertified/non-main '+name+' Capture V2 source ref');
  result[name]=value.sha;
 }
 return Object.freeze(result);
}
function run(){
 if(process.argv.length!==3)
  throw new TypeError('Pass the exact selected candidate source-pins-v1.json path');
 const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 const pins=resolveCaptureV2PreviewSourcesV1(data);
 // Output values are SHA-only; no floating refs or untrusted shell content.
 process.stdout.write('combat='+pins.combat+'\nexploration='+pins.exploration+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{run()}catch(e){console.error('::error::'+e.message);process.exitCode=1}
}
