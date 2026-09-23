'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function block(id){
  const m=source.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

function goMenuAssignments(body){
  return (body.match(/window\.goMenu\s*=/g)||[]).length;
}

const core030=block('dungeonCore030HeroReturnFix');
const core200=block('dungeonCore200Rebuild');

assert.equal(goMenuAssignments(core030),1,'Core 0.30 must still own one goMenu assignment during preaudit');
assert.equal(goMenuAssignments(core200),1,'Core 2.00 must remain the final Dungeon goMenu owner');

assert.match(core030,/const prevGo=window\.goMenu;/,
  'Core 0.30 must capture the previous goMenu owner');
assert.match(core030,/if\(window\.DungeonCore01\?\.active && DungeonCore01\.eligible\?\.\(\)\)/,
  'Core 0.30 interception condition drifted');
assert.match(core030,/return prevGo\?\.apply\(this,arguments\)/,
  'Core 0.30 must delegate when its Dungeon condition is false');

assert.match(core200,/const goOutside200=window\.goMenu;/,
  'Core 2.00 must capture Core 0.30 as its previous goMenu owner');
assert.match(core200,/window\.goMenu=function\(\)\{if\(active200&&isDungeonMode\?\.\(\)\)/,
  'Core 2.00 final goMenu interception condition drifted');
assert.match(core200,/return goOutside200\?\.apply\(this,arguments\)/,
  'Core 2.00 must delegate only when its own Dungeon condition is false');
assert.match(core200,/window\.DungeonCore01=\{eligible:\(\)=>\{try\{return isDungeonMode\?\.\(\)/,
  'Core 2.00 must own final DungeonCore01.eligible');
assert.match(core200,/Object\.defineProperty\(window\.DungeonCore01,'active',\{get:\(\)=>active200\}\)/,
  'Core 2.00 must own final DungeonCore01.active getter');

const truth=[];
for(const active200 of [false,true]){
  for(const dungeonMode of [false,true]){
    const core200Intercepts=active200&&dungeonMode;
    const core200Delegates=!core200Intercepts;

    // Under final Core 2.00, Core 0.30 reads the current public DungeonCore01:
    // active -> active200 ; eligible() -> dungeonMode.
    const core030Condition=active200&&dungeonMode;
    const core030CanInterceptAfterDelegation=core200Delegates&&core030Condition;

    truth.push({
      active200,dungeonMode,
      core200Intercepts,core200Delegates,
      core030Condition,core030CanInterceptAfterDelegation
    });

    assert.equal(
      core030CanInterceptAfterDelegation,false,
      'Core 0.30 goMenu branch must be unreachable whenever Core 2.00 delegates'
    );
  }
}

const chain=[];
for(const m of source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)){
  const hits=(m[2].match(/window\.goMenu\s*=/g)||[]).length;
  if(hits)for(let i=0;i<hits;i++)chain.push(m[1]);
}
assert.deepEqual(chain,[
  'captureFix139',
  'gensDungeonCore01Js',
  'dungeonCore023StabilityFix',
  'dungeonCore030HeroReturnFix',
  'dungeonCore200Rebuild'
],'goMenu chain must match the E2E-protected baseline');

console.log(JSON.stringify({
  scenario:'Phase 5 Core 0.30 goMenu retirement preaudit',
  chain,
  proof:'Core 2.00 delegates exactly when the equivalent Core 0.30 final-runtime condition is false',
  truth,
  selectedCandidate:'dungeonCore030HeroReturnFix -> window.goMenu',
  runtimeChanged:false
},null,2));
