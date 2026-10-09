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
  'gensDungeonCore01Js'
];
const retiredCapture135Id='captureFix135';
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
const retiredCapture135Meta=owners.blocks?.[retiredCapture135Id];
assert.ok(retiredCapture135Meta,'missing owner metadata '+retiredCapture135Id);
assert.equal(retiredCapture135Meta.status,'active',retiredCapture135Id+' block must remain active');
const retiredCapture135Body=blockBody(retiredCapture135Id);
assert.doesNotMatch(retiredCapture135Body,/window\.startConfiguredGame\s*=/,
  'captureFix135 must remain retired as a global startConfiguredGame owner');
assert.match(retiredCapture135Body,/target135\(/);
assert.match(retiredCapture135Body,/render135\(/);
assert.match(retiredCapture135Body,/captureBattleLiveBody/);
assert.match(retiredCapture135Body,/captureCreatureDetailBody/);
assert.match(retiredCapture135Body,/oldPlayerText135/);
const core200Meta=owners.blocks?.[core200Id];
assert.ok(core200Meta,'missing owner metadata '+core200Id);
assert.equal(core200Meta.status,'active',core200Id+' must remain active');
const core200Body=blockBody(core200Id);

assert.match(lastOwners,/^startConfiguredGame\t1\tgensDungeonCore01Js$/m,
  'Phase 9 must expose only two remaining inline global startConfiguredGame owners');

assert.deepEqual(
  ids.map(id=>owners.blocks[id].primaryDomain),
  ['dungeon'],
  'remaining inline global owners must stay module-owned'
);
assert.equal(core200Meta.primaryDomain,'dungeon','Core200 local dispatcher must remain Dungeon-owned');

// Capture 135 remains active for non-wrapper Capture responsibilities only.
assert.equal(retiredCapture135Meta.primaryDomain,'capture');
assert.doesNotMatch(retiredCapture135Body,/start135|\.apply\(this,arguments\)/);

// Capture138 remains loaded for turn, target and creature UI responsibilities, not start.
const c138=blockBody('captureFix138');
assert.match(c138,/isCaptureContext138/);
assert.match(c138,/captureBattleApplyAbility/);
assert.doesNotMatch(c138,/window\.startConfiguredGame\s*=|const start138=/);

// Capture139 wires both already-transferred Capture owners; it owns neither launch nor Shell return registration.
const capture139Body=blockBody('captureFix139');
assert.doesNotMatch(capture139Body,/window\.startConfiguredGame\s*=|const\s+start139\s*=|gensCaptureStartConfiguredGame139V1/);
assert.match(capture139Body,/GensCaptureSessionStartV1\.install\(/);
assert.match(capture139Body,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/);
assert.match(capture139Body,/GensCaptureScreenReturnV1\.install\(/);

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

// None of the three remaining historical global owners is equivalent to the retired captureFix131 pass-through.
for(const id of ids){
  assert.doesNotMatch(
    functions[id],
    /^window\.startConfiguredGame\s*=\s*async function\(\)\{\s*return await \w+\.apply\(this,arguments\);\s*\}$/,
    id+' must not be classified as a pure transit wrapper'
  );
}

// Shell remains contract-only. Capture now carries only the Phase 9 public provider boundary; Dungeon keeps its reviewed Phase 7 slice.
assert.equal(shellContract.status,'contract-only-not-loaded');
assert.ok(shellContract.owns.includes('active module/session routing'));
assert.ok(shellContract.owns.includes('global screen transitions'));
assert.ok(shellContract.consumes.includes('module public entry contracts'));
assert.ok(shellContract.forbidden.includes('module gameplay rules'));
assert.ok(shellContract.forbidden.includes('private module runtime state'));

assert.equal(captureContract.status,'partial-runtime-loaded');
assert.equal(captureContract.activatedPhase,9);
assert.equal(captureContract.publicRuntimeApi,'GensCaptureV1');
assert.ok(captureContract.owns.includes('Monster Capture public runtime entry'));
assert.ok(captureContract.owns.includes('Capture module-launch provider'));
assert.ok(captureContract.forbidden.includes('Dungeon private runtime'));

assert.equal(dungeonContract.status,'partial-runtime-loaded');
assert.equal(dungeonContract.activatedPhase,7);
assert.equal(dungeonContract.publicRuntimeApi,'GensDungeonV1');
assert.ok(dungeonContract.owns.includes('Dungeon world state'));
assert.ok(dungeonContract.owns.includes('exploration'));
assert.ok(dungeonContract.forbidden.includes('Capture runtime'));
assert.ok(dungeonContract.invariants.includes('the connected Phase 7 exploration slices are the pure generated advance planner weighted room-kind selector generated room transition descriptor weighted generated branch-type selector generated branch chance gate and generated branch scene descriptor builder'));

assert.doesNotMatch(shellEntry,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
  'Shell Phase 3 entry must remain inert during this preaudit');
assert.match(captureEntry,/GensCaptureV1/);
assert.match(captureEntry,/function startModuleSession\(\)/);
assert.doesNotMatch(captureEntry,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|setTimeout|addEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
  'Capture Phase 9 public entry must remain routing-only');
assert.match(dungeonEntry,/function planGeneratedAdvance\(/,
  'Dungeon Phase 7 entry must retain the pure generated advance planner');
assert.match(dungeonEntry,/function pickWeightedGeneratedRoomKind\(/,
  'Dungeon Phase 7 entry must expose the second pure generated room-kind selector slice');
assert.match(dungeonEntry,/root\.GensDungeonV1=Object\.freeze\(/,
  'Dungeon Phase 7 entry must publish the GensDungeonV1 public namespace');
assert.doesNotMatch(
  dungeonEntry,
  /startConfiguredGame|document\.|localStorage|sessionStorage|MutationObserver|setInterval|setTimeout|addEventListener|dispatchEvent|fetch\s*\(/,
  'Dungeon Phase 7 entry must not acquire launch routing, DOM, storage, listener, timer or network authority'
);

const classification=[
  {
    id:'captureFix135',
    role:'capture-prelaunch-state-block',
    shellAuthority:false,
    globalOwner:false,
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
    role:'capture-session-dependency-wiring-and-screen-return',
    shellAuthority:false,
    globalOwner:false,
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
  name:'Capture139 session-start owner transfer completed in Phase 9',
  kind:'historical-preaudit-closure',
  reason:'Capture139 is retired from the global launch chain; Capture138 remains a separate compatibility debt',
  runtimeChanged:true,
  indexChanged:true,
  forbidden:[
    'restore Capture139 as a global startConfiguredGame owner',
    'retire captureFix138 without a fresh dedicated audit',
    'move Capture gameplay into Shell'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 5 startConfiguredGame remaining-chain preaudit',
  assignments:1,
  chain:ids,
  lastOwner:'gensDungeonCore01Js',
  core200LocalDispatcher:true,
  noPureTransitWrapperRemains:true,
  classification,
  nextMicroLot,
  runtimeChanged:false
},null,2));
