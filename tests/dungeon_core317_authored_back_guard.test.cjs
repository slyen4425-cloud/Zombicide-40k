const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-core-317.js'),'utf8');
assert.match(src,/authoredRuntime167839/,'Core 3.17 must recognize authored World Builder runtime');
assert.match(src,/if\(x\?\.last\?\.authoredRuntime167839\)\{if\(existing\)existing\.remove\(\);return\}/,'numeric back-room button must be removed in authored worlds');
assert.match(src,/if\(x\?\.last\?\.authoredRuntime167839\)return false/,'numeric goBackRoom must refuse authored worlds');
console.log('Dungeon Core 3.17 authored back guard: OK');
