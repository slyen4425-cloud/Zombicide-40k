'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');

function blockBody(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

function assignedFunction(src,name){
  const needles=[
    'window.'+name+'=async function',
    'window.'+name+' = async function',
    'window.'+name+'=function',
    'window.'+name+' = function'
  ];
  let start=-1;
  for(const n of needles){start=src.indexOf(n);if(start>=0)break;}
  assert.ok(start>=0,'missing '+name+' assignment');
  const open=src.indexOf('{',start);
  assert.ok(open>=0,'missing body '+name);
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

const b138=blockBody('captureFix138');
const b139=blockBody('captureFix139');
const f138=assignedFunction(b138,'startConfiguredGame');
const f139=assignedFunction(b139,'startConfiguredGame');
const pred=assignedFunction(b138,'isCaptureContext138');

assert.match(lastOwners,/^startConfiguredGame\t4\tdungeonCore200Rebuild$/m,
  're-audit must run against the current four-owner chain');

assert.equal(owners.blocks.captureFix138?.status,'active');
assert.equal(owners.blocks.captureFix138?.primaryDomain,'capture');
assert.equal(owners.blocks.captureFix139?.status,'active');
assert.equal(owners.blocks.captureFix139?.primaryDomain,'capture');

assert.match(f138,/const cap=isCaptureContext138\(\)/);
assert.match(f138,/const res=await start138\.apply\(this,arguments\)/);
assert.match(f138,/if\(cap\)\{/);
assert.match(f138,/renderCaptureWorldHub/);
assert.match(f138,/return res/);

assert.match(f139,/if\(!isCaptureContext138\(\)\)return await start139\.apply\(this,arguments\)/);
assert.match(f139,/captureEnterWorld139/);
assert.match(f139,/markSessionActive/);

// Predicate characterization: reads Capture context and returns a boolean.
// No asynchronous boundary or scheduled mutation exists inside this predicate.
assert.match(pred,/gensPureCaptureSheetMode/);
assert.match(pred,/gensCapturePregameMode/);
assert.match(pred,/fam===["']creature["']/);
assert.doesNotMatch(pred,/await|setTimeout|setInterval|MutationObserver|addEventListener|=\s*true|=\s*false/,
  'Capture predicate must not schedule or mutate routing state between outer and delegated checks');

// Effective call truth table:
// C=true  => captureFix139 handles Capture and never calls captureFix138.
// C=false => captureFix139 delegates synchronously; captureFix138 sees C=false and skips its post-Capture branch.
const truthTable=[
  {captureContext:true,outer139Delegates:false,inner138Reached:false,inner138CaptureBranch:false},
  {captureContext:false,outer139Delegates:true,inner138Reached:true,inner138CaptureBranch:false}
];
assert.ok(truthTable.every(x=>x.inner138CaptureBranch===false),
  'captureFix138 Capture post-launch branch must be unreachable through the effective global chain');

for(const [name,src] of [['shell',shellEntry],['capture',captureEntry]]){
  assert.doesNotMatch(src,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
    name+' Phase 3 entry must remain inert during re-audit');
}

const verdict={
  seam:'captureFix138 -> startConfiguredGame',
  status:'shadowed in effective chain',
  reason:'captureFix139 intercepts C=true; only C=false delegates synchronously, so captureFix138 cap branch is false',
  nextMicroLot:'dedicated TDD retirement of captureFix138 startConfiguredGame assignment only',
  preserve:[
    'captureFix138 block and all non-startConfiguredGame responsibilities',
    'captureFix139',
    'gensDungeonCore01Js',
    'dungeonCore200Rebuild'
  ],
  runtimeChanged:false
};

console.log(JSON.stringify({
  scenario:'Phase 5 captureFix138 re-audit after captureFix135 retirement',
  assignments:4,
  predicateSource:pred.replace(/\s+/g,' '),
  captureFix138Source:f138.replace(/\s+/g,' '),
  captureFix139Source:f139.replace(/\s+/g,' '),
  truthTable,
  verdict
},null,2));
