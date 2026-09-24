'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));
const captureContract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');

const ids=['captureFix138','captureFix139'];
const retiredCapture135Id='captureFix135';

function blockBody(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

function extractAssignedFunction(src,name){
  const needles=[
    'window.'+name+'=async function',
    'window.'+name+' = async function',
    'window.'+name+'=function',
    'window.'+name+' = function'
  ];
  let start=-1;
  for(const needle of needles){
    start=src.indexOf(needle);
    if(start>=0)break;
  }
  assert.ok(start>=0,'missing '+name+' assignment');
  const open=src.indexOf('{',start);
  assert.ok(open>=0,'missing '+name+' body');
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=open;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
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

function normalized(src){
  return src.replace(/\s+/g,' ').trim();
}

const blocks={};
const functions={};
let captureContextSource='';
for(const id of ids){
  const meta=owners.blocks?.[id];
  assert.ok(meta,'missing owner metadata '+id);
  assert.equal(meta.status,'active',id+' must remain active');
  assert.equal(meta.primaryDomain,'capture',id+' must remain Capture-owned');
  blocks[id]=blockBody(id);
  functions[id]=extractAssignedFunction(blocks[id],'startConfiguredGame');
}
const capture135Meta=owners.blocks?.[retiredCapture135Id];
assert.ok(capture135Meta,'missing owner metadata '+retiredCapture135Id);
assert.equal(capture135Meta.status,'active',retiredCapture135Id+' block must remain active');
assert.equal(capture135Meta.primaryDomain,'capture',retiredCapture135Id+' must remain Capture-owned');
blocks[retiredCapture135Id]=blockBody(retiredCapture135Id);
assert.doesNotMatch(blocks[retiredCapture135Id],/window\.startConfiguredGame\s*=/,
  'captureFix135 global startConfiguredGame owner must remain retired');
captureContextSource=extractAssignedFunction(blocks.captureFix138,'isCaptureContext138');

assert.match(lastOwners,/^startConfiguredGame\t3\tgensDungeonCore01Js$/m,
  'preaudit must run against the current three-owner global chain after captureFix135 retirement');

assert.equal(shellContract.status,'contract-only-not-loaded');
assert.ok(shellContract.consumes.includes('module public entry contracts'));
assert.ok(shellContract.forbidden.includes('module gameplay rules'));
assert.ok(shellContract.forbidden.includes('private module runtime state'));

assert.equal(captureContract.status,'contract-only-not-loaded');
assert.ok(captureContract.owns.includes('Monster Capture runtime'));
assert.ok(captureContract.forbidden.includes('Dungeon private runtime'));

assert.doesNotMatch(captureEntry,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
  'Capture Phase 3 entry must remain inert during preaudit');

assert.match(blocks.captureFix135,/target135\(/);
assert.match(blocks.captureFix135,/render135\(/);
assert.match(blocks.captureFix135,/captureBattleLiveBody/);
assert.match(blocks.captureFix135,/captureCreatureDetailBody/);
assert.match(blocks.captureFix135,/oldPlayerText135/);
assert.doesNotMatch(blocks.captureFix135,/start135|\.apply\(this,arguments\)/);

assert.match(functions.captureFix138,/isCaptureContext138/);
assert.match(functions.captureFix138,/setTimeout/);
assert.match(functions.captureFix138,/renderCaptureWorldHub/);

assert.match(functions.captureFix139,/if\(!isCaptureContext138\(\)\)return await start139\.apply/);
assert.match(functions.captureFix139,/markSessionActive/);

// Effective-chain shadowing proof.
assert.match(captureContextSource,/gensCapturePregameMode/);
assert.match(captureContextSource,/gensCapturePregameMode\(\)\)return true/);
assert.match(captureContextSource,/fam===["']creature["']/);
assert.doesNotMatch(blocks.captureFix135,/window\.startConfiguredGame\s*=/);
assert.match(functions.captureFix138,/const cap=isCaptureContext138\(\)/);
assert.match(functions.captureFix138,/if\(cap\)\{/);

const shadowingProof={
  outerOwner:'captureFix139',
  delegatesOnlyWhen:'isCaptureContext138() === false',
  capture135GlobalOwnerRetired:true,
  capture138EffectCondition:'isCaptureContext138() === true',
  capture138ConditionCoveredByOuterPredicate:true,
  consequence:[
    'Capture contexts are intercepted by captureFix139 before captureFix138',
    'delegated non-Capture contexts do not activate captureFix138 post-launch branch',
    'captureFix135 no longer participates in the global launch chain'
  ]
};

const sourceReport=[
  {
    id:'captureFix135',
    responsibility:owners.blocks.captureFix135.responsibility,
    functionSource:'global startConfiguredGame retired',
    relevantBlockLines:blocks.captureFix135.split(/\n/).map(x=>x.trim()).filter(x=>
      /target135|render135|captureBattleLiveBody|captureCreatureDetailBody|oldPlayerText135|world|trainer|starter|participant|turn|round|day/i.test(x)
    ).slice(0,80)
  },
  ...ids.map(id=>({
  id,
  responsibility:owners.blocks[id].responsibility,
  functionSource:normalized(functions[id]),
  relevantBlockLines:blocks[id].split(/\n/).map(x=>x.trim()).filter(x=>
    /startConfiguredGame|gensCapturePregameMode|saveCaptureWorldState|isCaptureContext138|renderCaptureWorldHub|markSessionActive|setTimeout|world|trainer|starter|participant|turn|round|day/i.test(x)
  ).slice(0,80)
  }))
];

const proposedPublicBoundary={
  owner:'capture',
  consumer:'shell',
  currentBestEntryOwner:'captureFix139',
  shellProvides:['module selection / routing decision only'],
  captureKeeps:[
    'pregame/private state',
    'participant/starter validation',
    'Capture world initialization',
    'Capture hub/UI transition'
  ],
  initialShape:'one async Capture-owned start entry; no private Capture state passed by Shell',
  returnContract:'preserve current observable return semantics until a dedicated result contract is proven',
  status:'descriptive only; no runtime entry connected in this lot'
};

const selectedFirstRuntimeMicroLot={
  owner:'captureFix135',
  seam:'startConfiguredGame',
  action:'retirement completed',
  targetAssignments:3,
  preservedOwners:['captureFix138','captureFix139','gensDungeonCore01Js'],
  rationale:'captureFix135 global authority is retired while its non-wrapper Capture responsibilities remain',
  requiresDedicatedRed:false,
  reAuditBeforeAnyCaptureFix138Retirement:true
};

console.log(JSON.stringify({
  scenario:'Phase 5 Capture public launch-entry preaudit',
  chainOwners:['captureFix138','captureFix139','gensDungeonCore01Js'],
  sourceReport,
  shadowingProof,
  proposedPublicBoundary,
  selectedFirstRuntimeMicroLot,
  runtimeChanged:false
},null,2));
