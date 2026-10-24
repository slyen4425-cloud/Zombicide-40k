const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const core200=(index.match(/<script[^>]*id=["']dungeonCore200Rebuild["'][^>]*>([\s\S]*?)<\/script>/i)||[])[1]||'';
assert.ok(core200,'Dungeon Core 2.00 block must exist');

const match=core200.match(/function syncEntranceState200\(x\)\{document\.body\?\.classList\?\.toggle\('dc054AtEntrance',Number\(x\?\.room\|\|0\)<=0\)\}/);
assert.ok(match,'canonical entrance visibility function must be extractable');

const classes=new Set(['dc054AtEntrance']);
const classList={
  add:name=>classes.add(name),
  remove:name=>classes.delete(name),
  toggle:(name,on)=>{if(on)classes.add(name);else classes.delete(name);return !!on},
  contains:name=>classes.has(name)
};
const sandbox={document:{body:{classList}}};
vm.runInNewContext(match[0],sandbox,{filename:'dungeon-core-200-entrance-authority.js'});

sandbox.syncEntranceState200({room:1});
assert.equal(classes.has('dc054AtEntrance'),false,'generated Dungeon room must clear stale entrance-only visibility');

sandbox.syncEntranceState200({room:0});
assert.equal(classes.has('dc054AtEntrance'),true,'Dungeon entrance must retain the entrance-only presentation');

sandbox.syncEntranceState200({room:2});
assert.equal(classes.has('dc054AtEntrance'),false,'later Dungeon rooms must remain visible without any reload');

console.log('gens_dungeon_entrance_visibility_runtime_v1: GREEN');
