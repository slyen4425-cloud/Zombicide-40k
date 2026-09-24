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

assert.equal(total,4,'Phase 5 historical global chain must now contain four owners after Core200 global retirement');
assert.deepEqual(ids,[
  'captureFix135',
  'captureFix138',
  'captureFix139',
  'gensDungeonCore01Js'
],'Phase 5 target chain drifted after Core200 global retirement');

const capture131=blocks.find(x=>x.id==='captureFix131');
assert.ok(capture131,'captureFix131 block must remain present');
assert.doesNotMatch(capture131.body,/window\.startConfiguredGame\s*=/,
  'captureFix131 must no longer assign startConfiguredGame');

for(const id of ['captureFix135','captureFix138','captureFix139','gensDungeonCore01Js']){
  assert.ok(chain.some(x=>x.id===id),id+' must remain an active historical startConfiguredGame owner');
}
assert.equal(chain.at(-1)?.id,'gensDungeonCore01Js',
  'Dungeon Core01 must remain the last historical global startConfiguredGame owner after Core200 retirement');

const c135=blocks.find(x=>x.id==='captureFix135')?.body||'';
const c138=blocks.find(x=>x.id==='captureFix138')?.body||'';
const c139=blocks.find(x=>x.id==='captureFix139')?.body||'';
const dc01=blocks.find(x=>x.id==='gensDungeonCore01Js')?.body||'';
const dc200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';

assert.match(c135,/gensCapturePregameMode/);
assert.match(c135,/saveCaptureWorldState/);
assert.match(c138,/isCaptureContext138/);
assert.match(c138,/renderCaptureWorldHub/);
assert.match(c139,/if\(!isCaptureContext138\(\)\)return await start139\.apply/);
assert.match(c139,/markSessionActive/);
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
