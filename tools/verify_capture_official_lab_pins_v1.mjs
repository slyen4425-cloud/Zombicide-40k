// Immutable, certified Lab main commits remain valid while independent Labs evolve.
// Security: verify current main still descends from the certified commit; never
// consume a moving HEAD or silently replace an approved version.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const EXPECTED_LAB_REPOS=Object.freeze({
 combat:'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
 exploration:'slyen4425-cloud/laboratoire_dynamique_exploration-'
});
const SHA=/^[0-9a-f]{40}$/;
export async function verifyCaptureOfficialLabPinsV1({pins,headFor,compare}){
 if(pins?.schema!=='gensrpg-capture-v2-official-main-pins-v1'||
    pins.legacyCaptureRuntime!==false)
  throw new Error('Unapproved Capture source ownership or legacy runtime');
 const accepted={};
 for(const name of ['combat','exploration']){
  const entry=pins[name];
  if(entry?.repository!==EXPECTED_LAB_REPOS[name]||
     entry.ref!=='main'||!SHA.test(entry.sha)||
     !Number.isSafeInteger(entry.certifiedCiRun)||entry.certifiedCiRun<=0)
   throw new Error('Invalid immutable certified '+name+' Lab main pin');
  const head=await headFor(name,entry.repository);
  if(!SHA.test(head))throw new Error('Unverifiable '+name+' main HEAD');
  if(head!==entry.sha){
   const proof=await compare(name,entry.repository,entry.sha,head);
   if(proof?.status!=='ahead'||proof.behind_by!==0||
      proof.merge_base_commit?.sha!==entry.sha||!Number.isSafeInteger(proof.ahead_by)||
      proof.ahead_by<1)
    throw new Error(name+' approved pin no longer belongs to the official main lineage');
  }
  accepted[name]=entry.sha;
 }
 return Object.freeze(accepted);
}
export function officialLabMainHeadV1(_name,repo){
 return execFileSync('git',['ls-remote','https://github.com/'+repo+'.git','refs/heads/main'],{
  encoding:'utf8',timeout:30000
 }).trim().split(/\s+/)[0];
}
export async function officialLabMainComparisonV1(_name,repo,pin,head){
 const uri='https://api.github.com/repos/'+repo+'/compare/'+pin+'...'+head;
 const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 if(process.env.GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_TOKEN;
 const response=await fetch(uri,{headers});
 if(!response.ok)throw new Error('Cannot certify Lab main ancestry '+repo+': HTTP '+response.status);
 return response.json();
}
const calledDirectly=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(calledDirectly){
 const pins=JSON.parse(readFileSync(new URL('../assets/gensrpg/capture-v2/source-pins-v1.json',import.meta.url),'utf8'));
 const accepted=await verifyCaptureOfficialLabPinsV1({
  pins,headFor:officialLabMainHeadV1,compare:officialLabMainComparisonV1
 });
 for(const [name,sha] of Object.entries(accepted))console.log(name+'='+sha);
}
