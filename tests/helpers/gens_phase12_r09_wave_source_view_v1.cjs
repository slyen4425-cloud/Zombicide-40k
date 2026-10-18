'use strict';
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const path=require('node:path');
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const R09='4dbe3314d5048f2def404ed674498c0670c04fc1';
const R08='6eeed45a0a12085c1b107ee6c24b49040277ca54';
module.exports=function r08View(index,root=path.resolve(__dirname,'../..')){
  if(blob(index)!==R09)return index;
  assert.equal(index.length,2093066);
  const restored=cp.execFileSync('node',[path.join(root,'tools/gensrpg_phase12_r09_wave_extract_apply.cjs'),'--restore-r08'],{cwd:root,maxBuffer:4*1024*1024});
  assert.equal(blob(restored),R08,'R09 must reconstruct exact R08 before historical guards');
  return restored;
};