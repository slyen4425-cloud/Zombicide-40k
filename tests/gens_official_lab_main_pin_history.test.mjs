import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assertOfficialMainHistoryPin} from '../tools/verify_official_main_pin.mjs';

const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const repo='slyen4425-cloud/GenSrpg_labo_combat_dynamique';
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gens-main-history-'));
 const remote=path.join(dir,'remote.git');
 execFileSync('git',['init','--quiet','--bare','--initial-branch=main',remote]);
 const work=path.join(dir,'work');fs.mkdirSync(work);
 git(work,'init','--quiet','--initial-branch=main');
 git(work,'config','user.email','ci@example.invalid');
 git(work,'config','user.name','CI Main History');
 git(work,'remote','add','origin',remote);
 const commit=(name)=>{
  fs.writeFileSync(path.join(work,'payload.txt'),name);
  git(work,'add','payload.txt');
  git(work,'commit','--quiet','-m',name);
  return git(work,'rev-parse','HEAD');
 };
 const original=commit('approved-main-release');
 git(work,'push','--quiet','-u','origin','main');
 const current=commit('new-main-release');
 git(work,'push','--quiet','origin','main');
 git(work,'checkout','--quiet','-b','work/unapproved');
 const unapproved=commit('branch-only-private-change');
 git(work,'push','--quiet','origin','work/unapproved');
 return {dir,remote:pathToFileURL(remote).href,original,current,unapproved};
}
test('old immutable approved main release remains valid after newer official main commits',()=>{
 const f=fixture();try{
  const verified=assertOfficialMainHistoryPin({repository:repo,sha:f.original,remoteUrl:f.remote});
  assert.equal(verified.pin,f.original);assert.equal(verified.main,f.current);
  assertOfficialMainHistoryPin({repository:repo,sha:f.current,remoteUrl:f.remote});
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('dev branch-only revision and nonexistent pin are refused even if Git object exists',()=>{
 const f=fixture();try{
  assert.throws(()=>assertOfficialMainHistoryPin({repository:repo,sha:f.unapproved,remoteUrl:f.remote}),
   /not part of the official main history/i);
  assert.throws(()=>assertOfficialMainHistoryPin({repository:repo,sha:'f'.repeat(40),remoteUrl:f.remote}),
   /not part of the official main history/i);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('never trust gh-pages, work branch names or malformed SHA as an authority',()=>{
 const f=fixture();try{
  for(const sha of ['gh-pages','main',f.original.slice(0,8)])assert.throws(()=>
   assertOfficialMainHistoryPin({repository:repo,sha,remoteUrl:f.remote}),/40.*SHA/i);
  assert.throws(()=>assertOfficialMainHistoryPin({
   repository:'other/unverified',sha:f.original,remoteUrl:f.remote}),/official Lab repository/i);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('production and preview must use one common official main-history validator',()=>{
 const root=path.resolve(import.meta.dirname,'..');
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/main.yml'),'utf8');
 const stage=fs.readFileSync(path.join(root,'tools/stage_capture_v2_pages_preview.mjs'),'utf8');
 assert.match(workflow,/assertOfficialMainHistoryPin/);
 assert.match(stage,/assertOfficialMainHistoryPin/);
 assert.doesNotMatch(workflow,/COMBAT_LAB_SOURCE_V1\.sha!==combatMain/);
 assert.doesNotMatch(stage,/main!==pin\.sha/);
});
