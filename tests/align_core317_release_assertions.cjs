const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'dungeon_runtime_regression.test.cjs');
let src=fs.readFileSync(file,'utf8');
const old='assert.match(html, /GenSrpG V16\\.78\\.10/);';
const next='assert.match(html, /GenSrpG V16\\.78\\.11/);';
if(!src.includes(next)){
  if(!src.includes(old))throw new Error('Legacy release assertion target not found');
  src=src.replace(old,next);
  fs.writeFileSync(file,src);
  console.log('Release assertion aligned to V16.78.11');
}else console.log('Release assertion already aligned');
