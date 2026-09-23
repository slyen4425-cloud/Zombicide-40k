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

const phase2=lastOwnerRow('goMenu');
assert.deepEqual(phase2,{count:1,last:'dungeonCore200Rebuild'},
  'goMenu baseline must match the current cumulative Phase 5 cartography');

const chain=chainFor('goMenu');
const total=chain.reduce((n,x)=>n+x.count,0);
assert.equal(total,1,'goMenu current runtime assignment count drifted');
assert.equal(chain.at(-1)?.id,'dungeonCore200Rebuild','goMenu current last owner drifted');
assert.deepEqual(chain.map(x=>x.id),[
  'dungeonCore200Rebuild'
],'Capture S1 must leave Dungeon Core 2.00 as the sole global goMenu override');

const bodies=Object.fromEntries(chain.map(x=>[x.id,x.body]));
const retiredCore01=blocks.find(x=>x.id==='gensDungeonCore01Js')?.body||'';
const capture139=blocks.find(x=>x.id==='captureFix139')?.body||'';
assert.doesNotMatch(retiredCore01,/window\.goMenu\s*=/,
  'retired Core01 must not regain global goMenu authority');
assert.doesNotMatch(capture139,/window\.goMenu\s*=/,
  'Capture S1 must not regain global goMenu authority');
assert.match(capture139,/GensShellScreenReturnV1/,
  'Capture S1 must expose its return through the Shell public registry');
assert.match(capture139,/captureEnterWorld139\(\)/,
  'Capture S1 must keep Capture-owned world/hub rendering');
assert.match(bodies.dungeonCore200Rebuild,/const goOutside200=window\.goMenu;[\s\S]*if\(active200&&isDungeonMode\?\.\(\)\)\{[\s\S]*return show\(\)\}/,
  'Core 2.00 remains the final active-Dungeon goMenu interceptor');
assert.match(bodies.dungeonCore200Rebuild,/return goOutside200\?\.apply\(this,arguments\)/,
  'Core 2.00 must delegate non-Dungeon goMenu calls to the previous module/Shell chain');

const report=chain.map(rec=>{
  const meta=owners.blocks?.[rec.id];
  assert.ok(meta,'missing inline owner metadata for goMenu owner '+rec.id);
  const indices=[...rec.body.matchAll(/window\.goMenu\s*=/g)].map(m=>m.index);
  return {
    id:rec.id,
    assignments:rec.count,
    primaryDomain:meta.primaryDomain,
    crossDomains:meta.crossDomains||[],
    responsibility:meta.responsibility,
    capturesPrevious:/(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*window\.goMenu\b/.test(rec.body),
    directCallsPrevious:/\.apply\(this,arguments\)|\.call\(this/.test(rec.body),
    touchesSelectedFamily:/gensSelectedFamily/.test(rec.body),
    touchesSession:/markSessionActive|z40k_session_active_v1/.test(rec.body),
    touchesDungeon:/DungeonCore01|gensDungeon|dungeon/i.test(rec.body),
    touchesCapture:/capture/i.test(rec.body),
    touchesRootScreens:/gensRootHome|gensFamilyHome|gensGameHome|showAppHome|showHome|menu/.test(rec.body),
    excerpts:indices.map(i=>excerpt(rec.body,i))
  };
});

console.log(JSON.stringify({
  scenario:'Phase 5 goMenu / global screen transitions preaudit',
  sourceIndexBlob:owners.sourceIndexBlob,
  phase2Row:phase2,
  assignments:total,
  chain:report,
  runtimeChanged:true,
  captureMigratedToPublicContract:true,
  nextDecision:'migrate the remaining Dungeon owner through the same Shell contract in a separate micro-lot'
},null,2));
