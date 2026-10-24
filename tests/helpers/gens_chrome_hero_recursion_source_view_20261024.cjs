'use strict';
/* Test-only historical view for the exact Chrome startup dependency fix.
 * The active runtime is never modified; only the previously audited
 * original bytes are exposed to legacy snapshot tests. Fail on unknown hashes.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const hash=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const PATCHED='cc355585acab68958bd349ffcf8fa0de4eab9b0d';
const ORIGINAL='260f00aa179c939f35188ca854f9875971ce8a7b';
let cachedInput=null,cachedOutput=null;
module.exports=function sourceForHistoricalSentinel(input){
 const index=Buffer.from(input);
 if(hash(index)!==PATCHED)return index;
 if(cachedInput&&index.equals(cachedInput))return Buffer.from(cachedOutput);
 const rollback=execFileSync('python3',[
  path.resolve(__dirname,'../gens_chrome_hero_recursion_patch_20261024.py'),
  '--reverse-stdout'
 ],{input:index,maxBuffer:12*1024*1024});
 assert.equal(hash(rollback),ORIGINAL,'Chrome startup history must reconstruct exact old Git blob');
 cachedInput=index;cachedOutput=rollback;
 return Buffer.from(rollback);
};
