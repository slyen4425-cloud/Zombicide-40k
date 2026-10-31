// Only Combat main may change the immutable author/engine pin.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const FILES=Object.freeze([
'assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs',
'docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json',
'tests/gens_capture_kitsune_author_12_gate_v1.test.cjs',
'tests/gens_capture_combat_main_only_guard_20261030.test.cjs',
'tests/gens_capture_lab_pages_site_v1.test.cjs',
'tests/gens_capture_lab_pages_pipeline_v1.test.cjs',
'tests/gens_capture_lab_delivery_v1.test.cjs',
'tests/gens_capture_lab_runtime_v1.test.cjs',
'tests/gens_capture_official_hub_composition_v1.test.cjs',
'tests/gens_capture_lab_authored_source_v1.test.cjs',
'tests/gens_capture_saved_profile_bridge_v1.test.cjs',
'tests/gens_phase9_capture_exit_gate_evidence_v1.test.cjs',
'tests/gens_capture_world_lab_wild_transaction_v1.test.cjs'
]);
const read=(root,p)=>fs.readFileSync(path.join(root,p),'utf8');
function ensure(ok,msg){if(!ok)throw Error(msg)}
export function plan(root,target,run){
 ensure(/^[a-f0-9]{40}$/.test(target),'Candidate must be a full git SHA');
 ensure(Number.isSafeInteger(run)&&run>0,'Verified upstream CI run is mandatory');
 const manifest=JSON.parse(read(root,FILES[1]));
 const old=manifest.authoredSourceLabPin;
 ensure(/^[a-f0-9]{40}$/.test(old),'Current pin malformed');
 ensure(old===manifest.originalWildBattleButton?.officialSourceSha,'Two competing Combat source pins');
 ensure(manifest.productionActivated===false,'Capture opt-in policy must be preserved');
 const loader=read(root,FILES[0]);
 ensure(loader.includes("sha: '"+old+"'"),'Engine/source manifest mismatch');
 const existing=/ciRun:\s*(\d+)/.exec(loader);
 ensure(existing,'Official Combat CI evidence missing');
 if(old===target)return {changed:false,old,target,updates:[]};
 const updates=FILES.map(file=>{
  const before=read(root,file);
  ensure(before.includes(old),'Static source drift: '+file);
  let after=before.replaceAll(old,target);
  if(file===FILES[0])after=after.replace('ciRun: '+existing[1],'ciRun: '+run);
  if(file===FILES[1]){
   const parsed=JSON.parse(after);
   ensure(parsed.authoredSourceLabPin===target&&parsed.originalWildBattleButton.officialSourceSha===target,'Manifest provenance divergence');
  }
  ensure(before!==after,'Missing source substitution: '+file);
  return {file,before,after};
 });
 return {changed:true,old,target,run,updates};
}
export function apply(root,plan){
 if(!plan.changed)return;
 for(const {file,before} of plan.updates)ensure(read(root,file)===before,'Concurrent change: '+file);
 for(const {file,after} of plan.updates)fs.writeFileSync(path.join(root,file),after);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const p=plan(process.cwd(),process.argv[2],Number(process.argv[3]));
 apply(process.cwd(),p);
 console.log(JSON.stringify({changed:p.changed,owner:'Combat main',old:p.old,sha:p.target,run:p.run,paths:p.updates.map(x=>x.file)},null,2));
}
