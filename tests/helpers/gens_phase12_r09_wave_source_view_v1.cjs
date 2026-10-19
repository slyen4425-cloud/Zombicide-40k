'use strict';
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const path=require('node:path');
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const R09='4dbe3314d5048f2def404ed674498c0670c04fc1';
const R08='6eeed45a0a12085c1b107ee6c24b49040277ca54';
module.exports=function r08View(index,root=path.resolve(__dirname,'../..')){
  if(['b8ef8dcb497cad94c91094ed008136a5d9800155','f257bd9e193648dc62cd8a40d510831debfe045a','b0d0c73292e4374fc4f23e86edffad5c1b39a7b6','b5a39705baf83e9782695c14bede8b9dde6ddf52'].includes(blob(index))){
    assert.ok((index.length===2031649&&blob(index)==='b8ef8dcb497cad94c91094ed008136a5d9800155')||(index.length===1934253&&blob(index)==='f257bd9e193648dc62cd8a40d510831debfe045a')||(index.length===1863745&&blob(index)==='b0d0c73292e4374fc4f23e86edffad5c1b39a7b6')||(index.length===1820094&&blob(index)==='b5a39705baf83e9782695c14bede8b9dde6ddf52'),'only certified R10/R11 historical input');
    index=cp.execFileSync('node',[path.join(root,'tools/gensrpg_phase12_r10_capture_extract_apply.cjs'),'--restore-r09'],{cwd:root,maxBuffer:4*1024*1024});
    assert.equal(blob(index),R09,'R10 must reconstruct exact R09 for historical sentinels');
  }
  if(blob(index)!==R09)return index;
  assert.equal(index.length,2093066);
  const restored=cp.execFileSync('node',[path.join(root,'tools/gensrpg_phase12_r09_wave_extract_apply.cjs'),'--restore-r08'],{cwd:root,maxBuffer:4*1024*1024});
  assert.equal(blob(restored),R08,'R09 must reconstruct exact R08 before historical guards');
  return restored;
};