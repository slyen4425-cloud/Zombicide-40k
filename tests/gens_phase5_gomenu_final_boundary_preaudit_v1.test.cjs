'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const source=indexBuf.toString('utf8');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));
const captureContract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const dungeonEntry=read('assets/gensrpg/dungeon/entry-v1.js');

function gitBlob(buf){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}
function row(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}
const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  return blocks.filter(b=>re.test(b.body)).map(b=>b.id);
}

assert.equal(indexBuf.length,8170961,'preaudit must use the exact manually validated Core01-retirement runtime');
assert.equal(gitBlob(indexBuf),'0c15b1dba66ce83f2b27ed99e371885fb1d0ed75','preaudit runtime blob drifted');
assert.equal(owners.sourceIndexBlob,'0c15b1dba66ce83f2b27ed99e371885fb1d0ed75','owner manifest must target current runtime');

assert.deepEqual(row('goMenu'),{count:2,last:'dungeonCore200Rebuild'});
assert.deepEqual(chainFor('goMenu'),['captureFix139','dungeonCore200Rebuild'],
  'final goMenu boundary must contain exactly Capture 139 then Dungeon Core 2.00');

assert.equal(owners.blocks.captureFix139.primaryDomain,'capture');
assert.equal(owners.blocks.dungeonCore200Rebuild.primaryDomain,'dungeon');

const capture=blocks.find(b=>b.id==='captureFix139')?.body||'';
const dungeon=blocks.find(b=>b.id==='dungeonCore200Rebuild')?.body||'';
assert.match(capture,/const oldMenu139=window\.goMenu;/,
  'Capture 139 must still capture the prior Shell/module boundary');
assert.match(capture,/hasActiveSession\(\)&&isCaptureContext138\(\)/,
  'Capture 139 must still own active Capture return routing');
assert.match(capture,/captureEnterWorld139\(\);return;/,
  'Capture 139 return must still enter the Capture-owned world/hub path');
assert.match(dungeon,/const goOutside200=window\.goMenu;/,
  'Dungeon Core 2.00 must still capture the previous goMenu boundary');
assert.match(dungeon,/active200&&isDungeonMode\?\.\(\)/,
  'Dungeon Core 2.00 must still own active Dungeon return routing');
assert.match(dungeon,/return goOutside200\?\.apply\(this,arguments\)/,
  'Dungeon Core 2.00 must delegate outside Dungeon');

assert.ok(shellContract.owns.includes('global screen transitions'),
  'Shell contract must own global screen transitions');
assert.ok(shellContract.consumes.includes('module public entry contracts'),
  'Shell contract must consume module public entry contracts');
assert.equal(shellContract.status,'contract-only-not-loaded');
assert.equal(captureContract.status,'contract-only-not-loaded');
assert.equal(dungeonContract.status,'contract-only-not-loaded');

for(const [name,entry] of [['shell',shellEntry],['capture',captureEntry],['dungeon',dungeonEntry]]){
  assert.doesNotMatch(entry,/window\.[A-Za-z_$][\w$]*\s*=/,
    name+' Phase 3 entry must remain inert during this preaudit');
  assert.doesNotMatch(entry,/addEventListener|MutationObserver|setTimeout|setInterval/,
    name+' Phase 3 entry must not gain compatibility side effects');
}

assert.equal('publicScreenReturn' in captureContract,false,
  'Capture has no declared public screen-return contract yet');
assert.equal('publicScreenReturn' in dungeonContract,false,
  'Dungeon has no declared public screen-return contract yet');

console.log(JSON.stringify({
  scenario:'Phase 5 final goMenu boundary preaudit',
  runtime:{size:indexBuf.length,blob:gitBlob(indexBuf)},
  chain:['captureFix139','dungeonCore200Rebuild'],
  owners:{
    capture:owners.blocks.captureFix139.responsibility,
    dungeon:owners.blocks.dungeonCore200Rebuild.responsibility
  },
  shellTarget:{
    ownsGlobalScreenTransitions:true,
    consumesModulePublicEntryContracts:true
  },
  decision:{
    retireCapture139:false,
    retireDungeon200:false,
    reason:'both remaining global interceptors carry real module-owned transitions',
    missingContract:'public module screen-return entry consumed by the Shell before global goMenu authority can be consolidated'
  },
  runtimeChanged:false
},null,2));
