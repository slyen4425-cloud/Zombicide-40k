'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const owners=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));
const layered=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json'),'utf8');

const chainIds=[
  'captureFix131',
  'captureFix135',
  'captureFix138',
  'captureFix139',
  'gensDungeonCore01Js',
  'dungeonCore200Rebuild'
];

function blockBody(id){
  const marker=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(marker);
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

function extractAssignedFunction(src,name){
  const needles=['window.'+name+'=async function','window.'+name+' = async function','window.'+name+'=function','window.'+name+' = function'];
  let start=-1;
  for(const n of needles){start=src.indexOf(n);if(start>=0)break;}
  assert.ok(start>=0,'missing assignment '+name);
  const open=src.indexOf('{',start);
  assert.ok(open>=0,'missing body for '+name);
  let depth=0,quote=null,esc=false,line=false,block=false;
  for(let i=open;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){
      if(esc){esc=false;continue;}
      if(c==='\\'){esc=true;continue;}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue;}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return src.slice(start,i+1);
  }
  assert.fail('unterminated '+name);
}

const assignments=[];
for(const id of chainIds){
  const meta=owners.blocks?.[id];
  assert.ok(meta,'missing owner metadata '+id);
  assert.equal(meta.status,'active',id+' must remain active');
  const body=blockBody(id);
  const source=extractAssignedFunction(body,'startConfiguredGame');
  assignments.push({
    id,
    primaryDomain:meta.primaryDomain,
    crossDomains:meta.crossDomains||[],
    responsibility:meta.responsibility,
    source
  });
}

const hotspot=(layered.hotspots||[]).find(x=>x.name==='startConfiguredGame');
assert.ok(hotspot);
assert.equal(hotspot.assignmentCount,6);
assert.equal(hotspot.lastOwner,'dungeonCore200Rebuild');
assert.equal(hotspot.classification,'cross-domain-boundary-chain');
assert.equal(hotspot.domain,'shell');

assert.deepEqual(assignments.map(x=>x.id),chainIds);
assert.deepEqual(assignments.slice(0,4).map(x=>x.primaryDomain),['capture','capture','capture','capture']);
assert.deepEqual(assignments.slice(4).map(x=>x.primaryDomain),['dungeon','dungeon']);

const report=assignments.map(x=>({
  id:x.id,
  primaryDomain:x.primaryDomain,
  crossDomains:x.crossDomains,
  responsibility:x.responsibility,
  length:x.source.length,
  source:x.source.replace(/\s+/g,' ').slice(0,1800)
}));

console.log(JSON.stringify({
  scenario:'Phase 5 startConfiguredGame authority preaudit characterization',
  hotspot,
  assignments:report,
  runtimeChanged:false
},null,2));
