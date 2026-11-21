// Single fail-closed source-of-truth proof for an immutable, previously
// released Lab main SHA. HEAD equality is NOT required: after main advances,
// a pinned older official main release remains valid until explicitly repinned.
// A SHA originating only from gh-pages or a work branch is never accepted.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const allowed=new Set([
 'slyen4425-cloud/GenSrpg_labo_combat_dynamique',
 'slyen4425-cloud/laboratoire_dynamique_exploration-'
]);
export function assertOfficialMainHistoryPin({repository,sha,remoteUrl=null}){
 if(!allowed.has(repository))throw Error('Unknown official Lab repository: '+repository);
 if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Immutable release pin must be a full 40-character SHA');
 const url=remoteUrl??'https://github.com/'+repository+'.git';
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gensrpg-lab-main-only-'));
 try{
  execFileSync('git',['-C',tmp,'init','--quiet'],{stdio:'pipe'});
  // Fetch ONLY refs/heads/main. Older certified releases can now be
  // hundreds of commits behind main; a fixed depth=128 was a false rejection.
  // Deepen the SAME main-only ancestry progressively, never add other refs.
  // A pin absent from verified main ancestry still fails closed.
  execFileSync('git',['-C',tmp,'fetch','--quiet','--no-tags',
   '--filter=blob:none','--depth=128',url,'refs/heads/main'],
   {stdio:'pipe',timeout:120000});
  const main=execFileSync('git',['-C',tmp,'rev-parse','FETCH_HEAD'],{encoding:'utf8'}).trim();
  if(!/^[a-f0-9]{40}$/.test(main))throw Error('Invalid fetched official main SHA');
  let approved=false;
  for(const deepen of [0,512,1024,2048]){
   if(deepen){
    // No shallow boundary means the whole reachable main history was
    // already checked: a missing SHA is genuinely non-official.
    if(!fs.existsSync(path.join(tmp,'.git','shallow')))break;
    execFileSync('git',['-C',tmp,'fetch','--quiet','--no-tags',
     '--filter=blob:none','--deepen='+deepen,url,'refs/heads/main'],
     {stdio:'pipe',timeout:120000});
   }
   const proof=spawnSync('git',['-C',tmp,'merge-base','--is-ancestor',sha,main],
    {encoding:'utf8',timeout:30000});
   if(proof.error)throw proof.error;
   if(proof.status===0){approved=true;break;}
  }
  if(!approved)throw Error('Pinned '+sha+' is not part of the official main history of '+
   repository+' at '+main+' (or exceeds the bounded history); reject branch-only SHA');
  return Object.freeze({repository,pin:sha,main,ref:'refs/heads/main'});
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
