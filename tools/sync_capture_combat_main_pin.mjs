// Capture V2: update the ONE real Combat main consumer pin, never archived Capture V1.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const FILES=Object.freeze(['assets/gensrpg/capture-v2/source-pins-v1.json']);
const read=(dir,p)=>fs.readFileSync(path.join(dir,p),'utf8');
function ensure(ok,msg){if(!ok)throw Error(msg);}
export function plan(dir,target,run){
 ensure(/^[0-9a-f]{40}$/.test(target),'Candidate must be a full git SHA');
 ensure(Number.isSafeInteger(run)&&run>0,'Verified upstream CI run is mandatory');
 const file=FILES[0],before=read(dir,file);
 const pins=JSON.parse(before);
 const old=pins.combat?.sha;
 ensure(/^[0-9a-f]{40}$/.test(old),'Current Combat pin malformed');
 ensure(pins.combat.ref==='main'&&pins.exploration?.ref==='main','Two Labs must use main only');
 ensure(pins.legacyCaptureRuntime===false,'Historical Capture runtime must remain retired');
 ensure(pins.combat.repository==='slyen4425-cloud/GenSrpg_labo_combat_dynamique',
  'Competing Combat authority');
 if(old===target)return {changed:false,old,target,updates:[]};
 const replacement={
  ...pins,
  combat:{...pins.combat,sha:target,certifiedCiRun:run}
 };
 const after=JSON.stringify(replacement,null,2)+'\n';
 ensure(after!==before,'Missing source substitution');
 return {changed:true,old,target,run,updates:[{file,before,after}]};
}
export function apply(dir,candidate){
 if(!candidate.changed)return;
 for(const {file,before} of candidate.updates)ensure(read(dir,file)===before,'Concurrent change: '+file);
 for(const {file,after} of candidate.updates)fs.writeFileSync(path.join(dir,file),after);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const candidate=plan(process.cwd(),process.argv[2],Number(process.argv[3]));
 apply(process.cwd(),candidate);
 console.log(JSON.stringify({changed:candidate.changed,owner:'Combat main',old:candidate.old,sha:candidate.target,run:candidate.run,paths:candidate.updates.map(x=>x.file)},null,2));
}
