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
  // Fetch only the history reachable from refs/heads/main, NOT gh-pages or
  // any development branch. 128 commits covers a bounded release window;
  // an older unprovable release fails closed and must be recertified.
  execFileSync('git',['-C',tmp,'fetch','--quiet','--no-tags',
   '--filter=blob:none','--depth=128',url,'refs/heads/main'],
   {stdio:'pipe',timeout:120000});
  const main=execFileSync('git',['-C',tmp,'rev-parse','FETCH_HEAD'],{encoding:'utf8'}).trim();
  if(!/^[a-f0-9]{40}$/.test(main))throw Error('Invalid fetched official main SHA');
  const proof=spawnSync('git',['-C',tmp,'merge-base','--is-ancestor',sha,main],
   {encoding:'utf8',timeout:30000});
  if(proof.status!==0)throw Error('Pinned '+sha+' is not part of the official main history of '+
   repository+' at '+main+' (or exceeds the bounded history); reject branch-only SHA');
  return Object.freeze({repository,pin:sha,main,ref:'refs/heads/main'});
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
