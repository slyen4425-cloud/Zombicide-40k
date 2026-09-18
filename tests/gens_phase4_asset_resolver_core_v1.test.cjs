const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const sourcePath=path.join(root,'assets','gensrpg','core','asset-resolver-v1.js');
const source=fs.readFileSync(sourcePath,'utf8');
delete require.cache[require.resolve(sourcePath)];
const resolver=require(sourcePath);

assert.equal(resolver.VERSION,'1.0.0');
assert.equal(resolver.clean('  x.png  '),'x.png');
assert.equal(resolver.clean(null),'');
assert.equal(resolver.first(['','  ','custom.png','later.png']),'custom.png');
assert.equal(resolver.join('assets/dungeon/creatures/','dng_skeleton.png'),'assets/dungeon/creatures/dng_skeleton.png');
assert.equal(resolver.join('assets/capture/creatures','/aquafin.png'),'assets/capture/creatures/aquafin.png');
assert.equal(resolver.join('', 'x.png'),'');
assert.equal(resolver.resolve({
  candidates:['',' custom/user.png '],
  root:'assets/dungeon/creatures/',
  file:'dng_skeleton.png',
  fallback:'fallback.svg'
}),'custom/user.png');
assert.equal(resolver.resolve({
  candidates:[],
  root:'assets/dungeon/creatures/',
  file:'dng_skeleton.png',
  fallback:'fallback.svg'
}),'assets/dungeon/creatures/dng_skeleton.png');
assert.equal(resolver.resolve({
  candidates:[],
  root:'',
  file:'',
  fallback:' fallback.svg '
}),'fallback.svg');
assert.equal(resolver.resolve({
  candidates:[],
  root:'assets/capture/creatures/',
  file:'aquafin.png'
}),'assets/capture/creatures/aquafin.png');

for(const forbidden of [
  'assets/dungeon/',
  'assets/capture/',
  'assets/survival/',
  'assets/pvp/',
  'dng_',
  'MutationObserver',
  'setTimeout(',
  'setInterval(',
  'localStorage',
  'document.'
]){
  assert.equal(source.includes(forbidden),false,'Core resolver must not own module/runtime detail: '+forbidden);
}
assert.doesNotMatch(source,/addEventListener\s*\(/);
assert.doesNotMatch(source,/fetch\s*\(/);
assert.doesNotMatch(source,/\.install\s*\(/);

console.log(JSON.stringify({
  scenario:'Phase 4 Core asset resolver V1',
  api:Object.keys(resolver).sort(),
  crossModuleFallback:false,
  domSideEffects:false,
  storageSideEffects:false
},null,2));
