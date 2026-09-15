const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const loaderPath='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const loader=fs.readFileSync(path.join(root,loaderPath),'utf8');

const core='assets/gensrpg/core/rpg-rules.js';
const firstTactical='assets/gensrpg/gens-rpg-tactical-combat-v2.js';

const count=(text,needle)=>text.split(needle).length-1;

assert.equal(count(index,loaderPath),1,'index.html must load the central GenSrpG runtime loader exactly once');
assert.equal(count(loader,core),1,'Core RPG rules must be present exactly once in the central loader');
assert.equal(count(loader,firstTactical),1,'first Tactical module must be present exactly once in the central loader');
assert.ok(loader.indexOf(core)<loader.indexOf(firstTactical),'Core RPG rules must load before every Tactical module');

const filesBlock=loader.slice(loader.indexOf('const files=['),loader.indexOf('];',loader.indexOf('const files=['))+2);
assert.ok(filesBlock.includes(core),'Core RPG rules must belong to the sequential files loader');
assert.ok(filesBlock.includes(firstTactical),'Tactical runtime must belong to the same sequential files loader');
assert.match(loader,/s\.async=false/,'central loader must preserve sequential non-async script insertion');
assert.match(loader,/s\.onload=\(\)=>load\(i\+1\)/,'next module must load only after the previous one completes');

console.log('GenSrpG Core RPG browser loader order contract OK');
