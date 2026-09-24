const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2],offset:m.index}));

function assignmentChain(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  const chain=[];
  for(const block of blocks){
    const hits=block.body.match(re);
    if(hits?.length)chain.push({id:block.id,count:hits.length,offset:block.offset});
  }
  return chain;
}

const expected={
  renderDungeonCombatRound:{
    assignments:30,
    last:'dungeonCore303TimelineRootFix',
    mustInclude:['dungeonCore214SingleAuthority','dungeonCore303TimelineRootFix']
  },
  captureRenderBattleLive:{
    assignments:15,
    last:'coreCombatPoolFix156',
    mustInclude:['capturePlaytestFix128','captureAbilityTruth144','coreCombatPoolFix156']
  },
  startConfiguredGame:{
    assignments:4,
    last:'gensDungeonCore01Js',
    exact:['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js']
  },
  resumeGame:{
    assignments:1,
    last:'dungeonCore310PersistenceAndTokens',
    exact:['dungeonCore310PersistenceAndTokens']
  },
  DungeonCore01:{
    assignments:2,
    last:'dungeonCore200Rebuild',
    exact:['gensDungeonCore01Js','dungeonCore200Rebuild']
  }
};

const report={};
for(const [name,cfg] of Object.entries(expected)){
  const chain=assignmentChain(name);
  const total=chain.reduce((sum,x)=>sum+x.count,0);
  assert.equal(total,cfg.assignments,name+' assignment count drifted');
  assert.equal(chain.at(-1)?.id,cfg.last,name+' last inline assignment drifted');
  if(cfg.exact)assert.deepEqual(chain.map(x=>x.id),cfg.exact,name+' assignment chain drifted');
  if(cfg.mustInclude)for(const id of cfg.mustInclude)assert.ok(chain.some(x=>x.id===id),name+' must still include '+id);
  report[name]={assignments:total,chain:chain.map(x=>x.id),last:chain.at(-1)?.id||null};
}

const render303=blocks.find(x=>x.id==='dungeonCore303TimelineRootFix')?.body||'';
assert.match(render303,/window\.__dc214RenderCombat\(\)/,'Core 3.03 must remain a wrapper over the preserved Core 2.14 renderer');

const capture156=blocks.find(x=>x.id==='coreCombatPoolFix156')?.body||'';
assert.match(capture156,/const oldCaptureRender156=window\.captureRenderBattleLive/,'Core combat pool layer must keep delegating to the previous Capture renderer');

const start200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
assert.match(start200,/const startOutside200=window\.startConfiguredGame/,'Dungeon Core 2.00 must preserve the previous shared launch chain');
assert.match(start200,/const gensDungeonStartConfiguredGame200V1=async function/,'Dungeon Core 2.00 must retain its local launch dispatcher for the Dungeon provider');
assert.doesNotMatch(start200,/window\.startConfiguredGame\s*=(?!=)/,'Dungeon Core 2.00 global launch assignment must remain retired');
assert.match(
  start200,
  /if\(isDungeonMode\?\.\(\)&&!\(typeof isCaptureContext138==="function"&&isCaptureContext138\(\)\)\)return start\(\)/,
  'Phase 2 must keep Dungeon launch interception while preserving the dedicated Capture chain'
);
assert.doesNotMatch(
  start200,
  /if\(isDungeonMode\?\.\(\)\)return start\(\)/,
  'Dungeon Core 2.00 must not steal Capture launches from the dedicated Capture owner'
);

console.log(JSON.stringify({scenario:'Phase 2 global owner inventory',report},null,2));
