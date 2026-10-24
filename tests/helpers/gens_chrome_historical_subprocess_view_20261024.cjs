'use strict';
/* Test-only loader for strictly historical Capture/Phase12 rollback subprocesses.
 * Normal application/runtime code never imports this module.
 * Active disk files and saved data stay untouched.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const original=fs.readFileSync.bind(fs);
const indexPath=path.resolve(__dirname,'../../index.html');
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\\0')).update(b).digest('hex');
const historical=require('./gens_chrome_hero_recursion_source_view_20261024.cjs');
const NEW='cc355585acab68958bd349ffcf8fa0de4eab9b0d';
fs.readFileSync=function(file,...args){
 const data=original(file,...args);
 if(typeof file!=='string'||path.resolve(file)!==indexPath)return data;
 const source=Buffer.isBuffer(data)?data:Buffer.from(data,'utf8');
 if(sha(source)!==NEW)return data;
 const originalVersion=historical(source);
 return Buffer.isBuffer(data)?originalVersion:originalVersion.toString('utf8');
};
