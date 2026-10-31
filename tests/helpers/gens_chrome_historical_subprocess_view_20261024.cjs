'use strict';
/* Test-only loader for strictly historical Capture/Phase12 rollback subprocesses.
 * Normal application/runtime code never imports this module.
 * Active disk files and saved data stay untouched.
 */
const fs=require('node:fs'),path=require('node:path');
const original=fs.readFileSync.bind(fs);
// The same read-only historical projector is used by nested rollback tools
// and by isolated temp-directory tests. Only a certified index.html blob is
// eligible; unrelated files and unknown bytes remain untouched.
const historical=require('./gens_chrome_hero_recursion_source_view_20261024.cjs');
fs.readFileSync=function(file,...args){
 const data=original(file,...args);
 if(typeof file!=='string'||path.basename(path.resolve(file))!=='index.html')return data;
 const source=Buffer.isBuffer(data)?data:Buffer.from(data,'utf8');
 if(!historical.accepts(source))return data;
 const originalVersion=historical(source);
 return Buffer.isBuffer(data)?originalVersion:originalVersion.toString('utf8');
};
