'use strict';
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
    if(hits?.length)chain.push({id:block.id,count:hits.length,body:block.body});
  }
  return chain;
}

const target='startConfiguredGame';
const chain=assignmentChain(target);
const total=chain.reduce((sum,x)=>sum+x.count,0);
const ids=chain.flatMap(x=>Array(x.count).fill(x.id));

assert.equal(total,1,'Phase 9 Capture138 retirement must leave only the Dungeon historical inline startConfiguredGame owner');
assert.deepEqual(ids,[
  'gensDungeonCore01Js'
],'Phase 9 must retire the Capture138 launch wrapper while retaining Dungeon Core01');

const capture131=blocks.find(x=>x.id==='captureFix131');
assert.ok(capture131,'captureFix131 block must remain present');
assert.doesNotMatch(capture131.body,/window\.startConfiguredGame\s*=/,
  'captureFix131 must no longer assign startConfiguredGame');

for(const id of ['gensDungeonCore01Js']){
  assert.ok(chain.some(x=>x.id===id),id+' must remain an active historical startConfiguredGame owner');
}
assert.ok(!chain.some(x=>x.id==='captureFix139'),
  'Capture139 must remain retired as a global startConfiguredGame owner after Phase 9 session-start transfer');
assert.equal(chain.at(-1)?.id,'gensDungeonCore01Js',
  'Dungeon Core01 must remain the last historical global startConfiguredGame owner after captureFix135 retirement');

const c135=blocks.find(x=>x.id==='captureFix135')?.body||'';
assert.doesNotMatch(c135,/window\.startConfiguredGame\s*=/,
  'captureFix135 must remain retired as a global startConfiguredGame owner');
const c138=blocks.find(x=>x.id==='captureFix138')?.body||'';
const c139=blocks.find(x=>x.id==='captureFix139')?.body||'';
const dc01=blocks.find(x=>x.id==='gensDungeonCore01Js')?.body||'';
const dc200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';

assert.match(c135,/target135\(/);
assert.match(c135,/render135\(/);
assert.match(c135,/captureBattleLiveBody/);
assert.match(c135,/captureCreatureDetailBody/);
assert.match(c135,/oldPlayerText135/);
assert.match(c138,/isCaptureContext138/);
assert.match(c138,/captureBattleApplyAbility/);
assert.doesNotMatch(c138,/window\.startConfiguredGame\s*=|const start138=|renderCaptureWorldHub\(\)/,
  'Capture138 must retain its targeting owner without reviving obsolete launch/Hub authority');
assert.doesNotMatch(c139,/window\.startConfiguredGame\s*=|const\s+start139\s*=|gensCaptureStartConfiguredGame139V1/,
  'Capture139 session-start wrapper/reference must remain retired');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 may only wire explicit dependencies to the Capture session-start owner');
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/,
  'Capture public entry must bind the dedicated session-start owner');
assert.match(c139,/markSessionActive:\(\)=>markSessionActive\(true\)/);
assert.match(dc01,/if\(eligible\?*\(\)?|if\(eligible\(\)\)/);
assert.match(dc200,/isDungeonMode/);
assert.match(dc200,/isCaptureContext138/);
assert.match(dc200,/startOutside200/);
assert.match(dc200,/const gensDungeonStartConfiguredGame200V1=async function/,
  'Core200 must retain its stable local Dungeon launch dispatcher');
assert.doesNotMatch(dc200,/window\.startConfiguredGame\s*=(?!=)/,
  'Core200 global startConfiguredGame assignment must remain retired');

console.log(JSON.stringify({
  scenario:'Phase 5 retire captureFix131 startConfiguredGame wrapper',
  assignments:total,
  chain:ids,
  lastOwner:chain.at(-1)?.id||null
},null,2));
