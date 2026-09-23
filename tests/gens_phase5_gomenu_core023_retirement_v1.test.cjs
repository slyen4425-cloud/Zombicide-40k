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
  'Core 0.23 must remain retired after cumulative Dungeon S2');
assert.equal(/^goMenu\t/m.test(lastOwners),false,
  'Phase 2 last-owner mapping must no longer contain an explicit goMenu override owner');

const core023=blocks.find(x=>x.id==='dungeonCore023StabilityFix')?.body||'';
assert.ok(core023,'Core 0.23 script must remain present for its non-goMenu responsibilities');
assert.doesNotMatch(core023,/const oldGo023\s*=\s*window\.goMenu/,
  'Core 0.23 must no longer capture the global goMenu authority');
assert.doesNotMatch(core023,/window\.goMenu\s*=/,
  'Core 0.23 must no longer replace global goMenu');

assert.match(core023,/const oldOpenHero=window\.DungeonCore01\.openHero/,
  'Core 0.23 openHero guard must remain intact');
assert.match(core023,/window\.DungeonCore01\.openHero=function/,
  'Core 0.23 must retain its openHero responsibility');
assert.match(core023,/specialDiceModal/,
  'Core 0.23 must retain the scoped special-dice cleanup attached to hero-sheet entry');
assert.match(core023,/dungeonCombatActive/,
  'Core 0.23 combat guard must remain intact');

const core200=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
assert.doesNotMatch(core200,/window\.goMenu\s*=/,
  'Dungeon S2 must not reintroduce global goMenu ownership');
assert.match(core200,/GensShellScreenReturnV1/,
  'Dungeon S2 must use the Shell screen-return contract');
assert.match(core200,/register\?\.\("dungeon"/);
assert.match(core200,/if\(!active200\|\|!isDungeonMode\?\.\(\)\)return false;/);
assert.match(core200,/return show\(\)===true/);

console.log(JSON.stringify({
  scenario:'Phase 5 retire Core 0.23 goMenu authority only',
  chain:chain.map(x=>x.id),
  core023StillPresent:true,
  core023GoMenuOwner:false,
  preserved:['openHero guard','specialDiceModal hero-entry cleanup','AI/loot responsibilities'],
  runtimeChange:'subtractive only',
  laterRetirement:'gensDungeonCore01Js -> window.goMenu'
},null,2));
