import {cpSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {COMBAT_LAB_SOURCE_V1} from '../assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const lab=process.argv[2] && resolve(process.argv[2]);
const media=process.argv[4]&&resolve(process.argv[4]);
const output=resolve(process.argv[3] || join(root,'_site/capture-lab-preview'));
if(!lab)throw new Error('Usage: node tools/build_capture_lab_preview.mjs <official-lab-checkout> [output]');
const actual=execFileSync('git',['-C',lab,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(actual!==COMBAT_LAB_SOURCE_V1.sha)throw new Error('Combat source SHA mismatch; build refused');
const dirty=execFileSync('git',['-C',lab,'status','--porcelain','--untracked-files=all','--',
  'src/core','src/contracts','src/adapters/input/capture'],{encoding:'utf8'}).trim();
if(dirty)throw new Error('Combat source has local modifications; build refused');
// Build transport only. No copied engine implementation is committed to GenSrpG.
const copy=(from,to)=>{mkdirSync(dirname(to),{recursive:true});cpSync(from,to,{recursive:true});};
for(const path of ['src/core','src/contracts','src/adapters/input/capture']){
  copy(join(lab,path),join(output,'vendor/combat-lab',path));
}
for(const file of ['battle-bridge-contract-v1.js','lab-ownership-port-v1.js','manual-battle-trigger-v1.js',
  'temporary-encounter-source-v1.js','temporary-zone-controller-v1.js','temporary-zone-session-v1.js',
  'temporary-zone-view-v1.js','temporary-zone-play-v1.js','combat-lab-engine-loader-v1.mjs',
  'combat-lab-provider-v1.mjs','preview/zone.mjs','preview/zone.css']){
  const path='assets/gensrpg/capture/'+file;copy(join(root,path),join(output,path));
}
for(const path of ['capture-lab-preview.html','tests/fixtures/capture-lab-1v1-export-v1.json']){
  copy(join(root,path),join(output,path));
}
writeFileSync(join(output,'vendor/combat-lab/source.json'),JSON.stringify(COMBAT_LAB_SOURCE_V1,null,2)+'\n');
if(media){
  copy(join(root,'assets/gensrpg/core/asset-resolver-v1.js'),join(output,'assets/gensrpg/core/asset-resolver-v1.js'));
  copy(join(root,'capture-lab-authored-preview.html'),join(output,'capture-lab-authored-preview.html'));
  // Isolated integration preview executes the unchanged physical Capture World
  // and Team owners; all Core+author dependencies are copied from pinned Lab.
  for(const name of [
    'capture-lab-saved-hub-preview.html',
    'assets/gensrpg/capture/preview/saved-hub-owners.js',
    'assets/gensrpg/capture/preview/saved-hub.mjs',
    'assets/gensrpg/capture/world-exploration-v1.js',
    'assets/gensrpg/capture/team-roster-v1.js',
    'assets/gensrpg/capture/saved-profile-battle-bridge-v1.mjs',
    'assets/gensrpg/capture/combat-lab-authored-source-v1.mjs',
    'assets/gensrpg/capture/capture-world-lab-wild-transaction-v1.mjs',
    'assets/gensrpg/capture/capture-lab-hub-battle-command-v1.mjs',
    'assets/gensrpg/capture/saved-profile-lab-migration-v1.mjs',
    'assets/gensrpg/capture/capture-lab-profile-readiness-v1.mjs'
  ])copy(join(root,name),join(output,name));

  execFileSync(process.execPath,[join(root,'tools/prepare_capture_lab_authored_preview.mjs'),lab,media,output],{
    stdio:'inherit'
  });
}
console.log('Capture preview built with official Combat '+actual+' at '+output);
