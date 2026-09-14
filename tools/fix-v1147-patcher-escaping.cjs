const fs=require('node:fs');
const p='tools/apply-v1147-single-authority.cjs';
let s=fs.readFileSync(p,'utf8');
const before=(s.match(/\\\\\$\{/g)||[]).length;
if(!before) throw new Error('No doubled template escapes found');
s=s.replace(/\\\\\$\{/g,'\\${');
fs.writeFileSync(p,s);
console.log('Fixed doubled nested-template escapes:',before);
