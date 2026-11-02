import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FILES,plan,apply} from '../tools/sync_capture_combat_main_pin.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const next='1234567890abcdef1234567890abcdef12345678';
function scratch(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'capture-v2-main-only-'));
 for(const f of FILES){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.copyFileSync(path.join(root,f),path.join(dir,f));}
 return dir;
}
test('V2 source update moves only the certified Combat main pin, not old catalogues or Exploration',()=>{
 const dir=scratch();
 try{
  assert.deepEqual(FILES,['assets/gensrpg/capture-v2/source-pins-v1.json']);
  const original=JSON.parse(fs.readFileSync(path.join(dir,FILES[0])));
  const candidate=plan(dir,next,99101);
  assert.equal(candidate.changed,true);
  assert.equal(candidate.updates.length,1);
  assert.equal(fs.readFileSync(path.join(dir,FILES[0]),'utf8'),candidate.updates[0].before,'planning is pure');
  apply(dir,candidate);
  const result=JSON.parse(fs.readFileSync(path.join(dir,FILES[0])));
  assert.equal(result.combat.sha,next);
  assert.equal(result.combat.certifiedCiRun,99101);
  assert.deepEqual(result.exploration,original.exploration);
  assert.deepEqual(result.featuresDeferred,original.featuresDeferred);
  assert.equal(result.legacyCaptureRuntime,false);
  assert.equal(plan(dir,next,99101).changed,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('refuse invalid SHAs, missing CI proof, non-main lab or competing engine',()=>{
 const dir=scratch();
 try{
  assert.throws(()=>plan(dir,'gh-pages',12),/full git SHA/);
  assert.throws(()=>plan(dir,next,0),/CI run/);
  const file=path.join(dir,FILES[0]),base=JSON.parse(fs.readFileSync(file));
  base.exploration.ref='gh-pages';fs.writeFileSync(file,JSON.stringify(base));
  assert.throws(()=>plan(dir,next,12),/main only/);
  base.exploration.ref='main';base.legacyCaptureRuntime=true;fs.writeFileSync(file,JSON.stringify(base));
  assert.throws(()=>plan(dir,next,12),/retired/);
  base.legacyCaptureRuntime=false;base.combat.repository='other/repo';fs.writeFileSync(file,JSON.stringify(base));
  assert.throws(()=>plan(dir,next,12),/Competing/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('atomic stale-input failure leaves the verified original Capture V2 consumer untouched',()=>{
 const dir=scratch();
 try{
  const candidate=plan(dir,next,99);
  const file=path.join(dir,FILES[0]);
  const data=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,data+' ');
  assert.throws(()=>apply(dir,candidate),/Concurrent change/);
  assert.equal(fs.readFileSync(file,'utf8'),data+' ');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
