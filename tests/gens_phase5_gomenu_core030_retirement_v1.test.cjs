'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));

function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  const out=[];
  for(const block of blocks){
    const hits=block.body.match(re);
    if(hits?.length)out.push({id:block.id,count:hits.length,body:block.body});
  }
  return out;
}

const chain=chainFor('goMenu');
const total=chain.reduce((n,x)=>n+x.count,0);

assert.equal(total,0,
  'Phase 5 cumulative retirement must keep Core 0.30 absent after Dungeon S2');
assert.deepEqual(chain.map(x=>x.id),[],
  'Core 0.30 must remain retired after Capture S1, Core 0.23/Core 0.01 retirements and Dungeon S2');

const core030=blocks.find(x=>x.id==='dungeonCore030HeroReturnFix');
assert.ok(core030,'Core 0.30 script must remain present for its non-goMenu responsibilities');
assert.doesNotMatch(core030.body,/window\.goMenu\s*=/,
  'Core 0.30 must no longer replace global goMenu');
assert.doesNotMatch(core030.body,/const\s+prevGo\s*=\s*window\.goMenu/,
  'Core 0.30 must no longer capture the previous goMenu owner');

const core200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
assert.doesNotMatch(core200,/window\.goMenu\s*=/);
assert.doesNotMatch(core200,/const goOutside200=window\.goMenu/);
assert.match(core200,/GensShellScreenReturnV1/);
assert.match(core200,/register\?\.\("dungeon"/);
assert.match(core200,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/);
assert.match(core200,/return show\(\)===true/);

console.log(JSON.stringify({
  scenario:'Phase 5 retire Core 0.30 goMenu owner',
  expectedAssignments:0,
  expectedChain:[],
  retired:'dungeonCore030HeroReturnFix -> window.goMenu',
  laterRetirements:[
    'dungeonCore023StabilityFix -> window.goMenu',
    'gensDungeonCore01Js -> window.goMenu'
  ]
},null,2));
