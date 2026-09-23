'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const source=read('index.html');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2],offset:m.index}));

function lastOwnerRow(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing Phase 2 last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}

function chainFor(name){
  const re=new RegExp('window\\.'+name+'\\s*=','g');
  const out=[];
  for(const block of blocks){
    const hits=[...block.body.matchAll(re)];
    if(!hits.length)continue;
    out.push({id:block.id,count:hits.length,body:block.body,offset:block.offset});
  }
  return out;
}

function excerpt(body,index,span=900){
  const from=Math.max(0,index-span);
  const to=Math.min(body.length,index+span);
  return body.slice(from,to)
    .replace(/\s+/g,' ')
    .trim();
}

assert.equal(/^goMenu\t/m.test(lastOwners),false,
  'Phase 2 last-owner table must no longer contain an explicit goMenu owner');

const chain=chainFor('goMenu');
const total=chain.reduce((n,x)=>n+x.count,0);
assert.equal(total,0,'Dungeon S2 must remove every inline global goMenu assignment');
assert.deepEqual(chain,[],'goMenu override chain must be empty after Dungeon S2');

const retiredCore01=blocks.find(x=>x.id==='gensDungeonCore01Js')?.body||'';
const capture139=blocks.find(x=>x.id==='captureFix139')?.body||'';
const dungeon200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';

assert.doesNotMatch(retiredCore01,/window\.goMenu\s*=/,
  'retired Core01 must not regain global goMenu authority');
assert.doesNotMatch(capture139,/window\.goMenu\s*=/,
  'Capture S1 must not regain global goMenu authority');
assert.doesNotMatch(dungeon200,/window\.goMenu\s*=/,
  'Dungeon S2 must not regain global goMenu authority');

assert.match(capture139,/GensShellScreenReturnV1/,
  'Capture S1 must expose its return through the Shell public registry');
assert.match(capture139,/captureEnterWorld139\(\)/,
  'Capture S1 must keep Capture-owned world/hub rendering');

assert.match(dungeon200,/GensShellScreenReturnV1/,
  'Dungeon S2 must expose its return through the Shell public registry');
assert.match(dungeon200,/register\?\.\("dungeon"/,
  'Dungeon S2 must register under the dungeon provider id');
assert.match(dungeon200,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/,
  'Dungeon S2 must preserve the historical active Dungeon guard');
assert.match(dungeon200,/return show\(\)===true/,
  'Dungeon S2 must keep show() as the owner-local transition');

const report=[
  {
    id:'captureFix139',
    primaryDomain:owners.blocks?.captureFix139?.primaryDomain,
    responsibility:owners.blocks?.captureFix139?.responsibility,
    provider:'capture'
  },
  {
    id:'dungeonCore200Rebuild',
    primaryDomain:owners.blocks?.dungeonCore200Rebuild?.primaryDomain,
    responsibility:owners.blocks?.dungeonCore200Rebuild?.responsibility,
    provider:'dungeon'
  }
];

console.log(JSON.stringify({
  scenario:'Phase 5 goMenu / global screen transitions preaudit',
  sourceIndexBlob:owners.sourceIndexBlob,
  phase2Row:null,
  assignments:total,
  chain:[],
  providers:report,
  runtimeChanged:true,
  captureMigratedToPublicContract:true,
  dungeonMigratedToPublicContract:true,
  shellNativeGoMenuSoleAuthority:true,
  nextDecision:'preserve this consolidated Shell boundary while continuing Phase 5'
},null,2));
