'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const source=read('index.html');
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

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
function lastOwnerRow(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing Phase 2 last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}

const chain=chainFor('goMenu');
assert.deepEqual(chain.map(x=>x.id),[],
  'Core 0.01 must remain retired after cumulative Dungeon S2');
assert.equal(/^goMenu\t/m.test(lastOwners),false,
  'Phase 2 last-owner mapping must no longer contain an explicit goMenu override owner');

const core01=blocks.find(x=>x.id==='gensDungeonCore01Js')?.body||'';
assert.ok(core01,'Core 0.01 script must remain present for its non-goMenu responsibilities');
assert.doesNotMatch(core01,/const oldGo\s*=\s*window\.goMenu/,
  'Core 0.01 must no longer capture the global goMenu authority');
assert.doesNotMatch(core01,/window\.goMenu\s*=/,
  'Core 0.01 must no longer replace global goMenu');

assert.match(core01,/window\.startConfiguredGame\s*=\s*async function/,
  'Core 0.01 startConfiguredGame responsibility must remain intact');
assert.match(core01,/window\.closeGameCustomization\s*=\s*function/,
  'Core 0.01 closeGameCustomization responsibility must remain intact');
assert.match(core01,/window\.DungeonCore01\s*=\s*\{/,
  'Core 0.01 historical Dungeon API block must remain intact in this micro-lot');
assert.match(core01,/let coreActive=false/,
  'Core 0.01 private state must not be removed incidentally');

const capture139=blocks.find(x=>x.id==='captureFix139')?.body||'';
assert.doesNotMatch(capture139,/window\.goMenu\s*=/,
  'Capture S1 must remain migrated off global goMenu');
assert.match(capture139,/GensShellScreenReturnV1/,
  'Capture must remain registered through the Shell screen-return contract');

const core200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
assert.doesNotMatch(core200,/window\.goMenu\s*=/,
  'Dungeon S2 must not reintroduce global goMenu ownership');
assert.match(core200,/GensShellScreenReturnV1/,
  'Dungeon S2 must use the Shell screen-return contract');
assert.match(core200,/register\?\.\("dungeon"/);
assert.match(core200,/return show\(\)===true/);

console.log(JSON.stringify({
  scenario:'Phase 5 retire Core 0.01 goMenu authority only',
  chain:chain.map(x=>x.id),
  core01StillPresent:true,
  core01GoMenuOwner:false,
  preserved:[
    'startConfiguredGame',
    'closeGameCustomization',
    'historical DungeonCore01 implementation'
  ],
  runtimeChange:'subtractive only'
},null,2));
