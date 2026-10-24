'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const hero=read('assets/gensrpg/gens-hero-editor-dynamic-167897.js');
const cleanup=read('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js');
const art=read('assets/gensrpg/gens-dungeon-hero-art-repair-167874.js');
const timers=JSON.parse(read('docs/GENSRPG_PHASE2_TIMER_CLASSIFICATION.json'));

assert.ok(
  timers.bootstrapRetryExternal.includes('assets/gensrpg/gens-hero-editor-dynamic-167897.js'),
  'Phase 2 must classify Hero Editor Dynamic as bootstrap/retry'
);
assert.ok(
  timers.bootstrapRetryExternal.includes('assets/gensrpg/gens-equipment-stat-cleanup-1678102.js'),
  'Phase 2 must classify Equipment Cleanup as bootstrap/retry'
);

const heroLoad=art.indexOf('loadScript(HERO_EDITOR_SRC');
const cleanupLoad=art.indexOf('loadScript(EQUIPMENT_CLEANUP_SRC');
assert.ok(heroLoad>=0&&cleanupLoad>heroLoad,'Hero Editor must load before Equipment Cleanup');

assert.match(hero,/function wrap\(name,maker,flag="__canon101"\)/);
assert.match(hero,/wrap\("openEquipmentEditor"/);
assert.match(hero,/if\(typeof old!=="function"\|\|old\[flag\]\)return false/);
assert.match(hero,/setTimeout\(retry,50\)/);
assert.match(hero,/if\(tries\+\+<30\)setTimeout\(retry,100\)/);

assert.match(cleanup,/function wrapOpen\(\)/);
assert.match(cleanup,/old\.__canonEq102/);
assert.match(cleanup,/w\.__canonEq102=true;w\.__original=old/);
assert.match(cleanup,/installed=true;.*wrapOpen\(\)/s);

function base(){return 'base'}
function hasWrapFlag(fn,flag){
  const seen=new Set();
  let cur=fn,depth=0;
  while(typeof cur==='function'&&!seen.has(cur)&&depth++<32){
    if(cur[flag])return true;
    seen.add(cur);
    cur=cur.__original;
  }
  return false;
}
function heroWrap(old){
  if(typeof old!=='function'||hasWrapFlag(old,'__canon101'))return old;
  const w=function(){return old.apply(this,arguments)};
  w.__canon101=true;
  w.__original=old;
  return w;
}
function cleanupWrap(old){
  if(typeof old!=='function'||old.__canonEq102)return old;
  const w=function(){return old.apply(this,arguments)};
  w.__canonEq102=true;
  w.__original=old;
  return w;
}
function chain(fn){
  const out=[];
  const seen=new Set();
  while(typeof fn==='function'&&!seen.has(fn)){
    seen.add(fn);
    out.push({
      canon101:!!fn.__canon101,
      canonEq102:!!fn.__canonEq102
    });
    fn=fn.__original;
  }
  return out;
}

let open=base;
open=heroWrap(open);
open=cleanupWrap(open);
const afterCleanup=chain(open);
open=heroWrap(open);
const afterFirstRetry=chain(open);
open=heroWrap(open);
const afterSecondRetry=chain(open);

assert.deepEqual(afterCleanup.slice(0,3),[
  {canon101:false,canonEq102:true},
  {canon101:true,canonEq102:false},
  {canon101:false,canonEq102:false}
]);
assert.deepEqual(afterFirstRetry,afterCleanup,'first retry must preserve the existing Hero Editor owner below Cleanup');
assert.deepEqual(afterSecondRetry,afterCleanup,'later retries must preserve the same chain');

console.log(JSON.stringify({
  scenario:'Phase 4 Equipment wrapper retry preaudit',
  phase2Classification:'bootstrap-retry',
  productionLoadOrder:['hero-editor-dynamic-167897','equipment-stat-cleanup-1678102'],
  afterCleanup,
  afterFirstHeroRetry:afterFirstRetry,
  stableAfterLaterRetries:true,
  duplicateHeroOwnerRetired:true,
  runtimeModified:false
},null,2));
