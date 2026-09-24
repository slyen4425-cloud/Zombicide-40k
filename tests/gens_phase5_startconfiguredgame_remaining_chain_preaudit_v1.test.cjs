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
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const dungeonEntry=read('assets/gensrpg/dungeon/entry-v1.js');

const ids=[
  'captureFix135',
  'captureFix138',
  'captureFix139',
  'gensDungeonCore01Js'
];
const core200Id='dungeonCore200Rebuild';

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

const functions={};
for(const id of ids){
  const meta=owners.blocks?.[id];
  assert.ok(meta,'missing owner metadata '+id);
  assert.equal(meta.status,'active',id+' must remain active');
  functions[id]=assignedFunction(blockBody(id),'startConfiguredGame');
}
const core200Meta=owners.blocks?.[core200Id];
assert.ok(core200Meta,'missing owner metadata '+core200Id);
assert.equal(core200Meta.status,'active',core200Id+' must remain active');
const core200Body=blockBody(core200Id);

assert.match(lastOwners,/^startConfiguredGame\t4\tgensDungeonCore01Js$/m,
  'cartography must expose the current four historical global owners after Core200 retirement');

assert.deepEqual(
  ids.map(id=>owners.blocks[id].primaryDomain),
  ['capture','capture','capture','dungeon'],
  'remaining historical global owners must stay module-owned'
);
assert.equal(core200Meta.primaryDomain,'dungeon','Core200 local dispatcher must remain Dungeon-owned');

// Capture 135: pre-launch Capture state work + delegation.
assert.match(functions.captureFix135,/gensCapturePregameMode/);
assert.match(functions.captureFix135,/saveCaptureWorldState/);
assert.match(functions.captureFix135,/\.apply\(this,arguments\)/);

// Capture 138: Capture-context post-launch UI work + historical delayed render.
assert.match(functions.captureFix138,/isCaptureContext138/);
assert.match(functions.captureFix138,/setTimeout/);
assert.match(functions.captureFix138,/renderCaptureWorldHub/);

// Capture 139: dedicated Capture launch path; delegates only outside Capture.
assert.match(functions.captureFix139,/if\(!isCaptureContext138\(\)\)return await start139\.apply/);
assert.match(functions.captureFix139,/markSessionActive/);

// Dungeon Core01: real Dungeon eligibility/start rule.
assert.match(functions.gensDungeonCore01Js,/eligible\(\)/);
assert.match(functions.gensDungeonCore01Js,/return start\(\)/);

// Dungeon Core 2.00: local Dungeon dispatcher, explicitly excludes Capture.
assert.match(core200Body,/const gensDungeonStartConfiguredGame200V1=async function/);
assert.match(core200Body,/isDungeonMode/);
assert.match(core200Body,/isCaptureContext138/);
assert.match(core200Body,/startOutside200/);
assert.doesNotMatch(core200Body,/window\.startConfiguredGame\s*=(?!=)/,
  'Core200 must remain retired as a global startConfiguredGame owner');

// None of the four remaining historical global owners is equivalent to the retired captureFix131 pass-through.
for(const id of ids){
  assert.doesNotMatch(
    functions[id],
    /^window\.startConfiguredGame\s*=\s*async function\(\)\{\s*return await \w+\.apply\(this,arguments\);\s*\}$/,
    id+' must not be classified as a pure transit wrapper'
  );
}

// Phase 3 target remains contract-only: Shell owns routing, modules own gameplay.
assert.equal(shellContract.status,'contract-only-not-loaded');
assert.ok(shellContract.owns.includes('active module/session routing'));
assert.ok(shellContract.owns.includes('global screen transitions'));
assert.ok(shellContract.consumes.includes('module public entry contracts'));
assert.ok(shellContract.forbidden.includes('module gameplay rules'));
assert.ok(shellContract.forbidden.includes('private module runtime state'));

assert.equal(captureContract.status,'contract-only-not-loaded');
assert.ok(captureContract.owns.includes('Monster Capture runtime'));
assert.ok(captureContract.forbidden.includes('Dungeon private runtime'));

assert.equal(dungeonContract.status,'contract-only-not-loaded');
assert.ok(dungeonContract.owns.includes('Dungeon world state'));
assert.ok(dungeonContract.forbidden.includes('Capture runtime'));

for(const [name,src] of [['shell',shellEntry],['capture',captureEntry],['dungeon',dungeonEntry]]){
  assert.doesNotMatch(src,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
    name+' Phase 3 entry must remain inert during this preaudit');
}

const classification=[
  {
    id:'captureFix135',
    role:'capture-prelaunch-state',
    shellAuthority:false,
    removableNow:false
  },
  {
    id:'captureFix138',
    role:'capture-postlaunch-ui-transition',
    shellAuthority:false,
    removableNow:false
  },
  {
    id:'captureFix139',
    role:'capture-dedicated-launch-entry',
    shellAuthority:false,
    removableNow:false
  },
  {
    id:'gensDungeonCore01Js',
    role:'dungeon-launch-entry',
    shellAuthority:false,
    removableNow:false
  },
  {
    id:'dungeonCore200Rebuild',
    role:'dungeon-local-launch-dispatcher',
    shellAuthority:false,
    globalOwner:false,
    removableNow:false
  }
];

const nextMicroLot={
  name:'Capture public launch-entry contract preaudit',
  kind:'contract/preaudit-only',
  reason:'three adjacent Capture wrappers implement one module launch lifecycle; Shell contract already requires module public entry contracts',
  runtimeChanged:false,
  indexChanged:false,
  forbidden:[
    'connect Shell entry now',
    'delete another wrapper without a dedicated RED',
    'move Capture gameplay into Shell'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 5 startConfiguredGame remaining-chain preaudit',
  assignments:4,
  chain:ids,
  lastOwner:'gensDungeonCore01Js',
  core200LocalDispatcher:true,
  noPureTransitWrapperRemains:true,
  classification,
  nextMicroLot,
  runtimeChanged:false
},null,2));
