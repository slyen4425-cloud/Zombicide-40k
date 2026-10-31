import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FILES,plan,apply} from '../tools/sync_capture_combat_main_pin.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newSha='1234567890abcdef1234567890abcdef12345678';
function scratch(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'capture-main-only-'));
 for(const file of FILES){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(dir,file))}
 return dir;
}
test('RED/GREEN: repin all author, engine and test sources together, no implicit content promotion',()=>{
 const dir=scratch();
 try{
  const old=JSON.parse(fs.readFileSync(path.join(dir,FILES[1]))).authoredSourceLabPin;
  const p=plan(dir,newSha,99101);
  assert.equal(p.changed,true);assert.equal(p.updates.length,FILES.length);
  for(const u of p.updates)assert.equal(fs.readFileSync(path.join(dir,u.file),'utf8'),u.before,'planning is pure');
  apply(dir,p);
  const m=JSON.parse(fs.readFileSync(path.join(dir,FILES[1])));
  assert.equal(m.authoredSourceLabPin,newSha);
  assert.equal(m.originalWildBattleButton.officialSourceSha,newSha);
  assert.equal(m.authoredAssetsPin,JSON.parse(fs.readFileSync(path.join(root,FILES[1]))).authoredAssetsPin,'source-only repin must preserve the exact original authored visual SHA');
  for(const f of FILES){const s=fs.readFileSync(path.join(dir,f),'utf8');assert.ok(s.includes(newSha));assert.ok(!s.includes(old))}
  assert.equal(plan(dir,newSha,99101).changed,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('reject invalid SHA and incomplete CI proof before changing any file',()=>{
 const dir=scratch();
 try{
  assert.throws(()=>plan(dir,'gh-pages',12),/full git SHA/);
  assert.throws(()=>plan(dir,newSha,0),/CI run/);
  const file=path.join(dir,FILES[1]),m=JSON.parse(fs.readFileSync(file));
  m.originalWildBattleButton.officialSourceSha='0'.repeat(40);
  fs.writeFileSync(file,JSON.stringify(m));
  assert.throws(()=>plan(dir,newSha,12),/competing/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('a changed gate aborts the whole repin, leaving the release manifest intact',()=>{
 const dir=scratch();
 try{
  const m=fs.readFileSync(path.join(dir,FILES[1]),'utf8');
  const old=JSON.parse(m).authoredSourceLabPin,filename=path.join(dir,FILES.at(-1));
  fs.writeFileSync(filename,fs.readFileSync(filename,'utf8').replaceAll(old,'0'.repeat(40)));
  assert.throws(()=>plan(dir,newSha,99),/Static source drift/);
  assert.equal(fs.readFileSync(path.join(dir,FILES[1]),'utf8'),m);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
