const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const authoritySource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

const core200=scriptBody('dungeonCore200Rebuild');
const ambushCall="b.onclick=()=>startCombat(live.map(e=>String(e.id)),'ambush')";
assert.ok(core200.includes(ambushCall),
  'pre-migration Runtime 2.00 ambush action must remain a lexical startCombat callsite during characterization');
assert.match(core200,/if\(x\.last\?\.kind==='ambush'&&live\.length\)[\s\S]*?b\.textContent='⚔️ EMBUSCADE — COMBATTRE'[\s\S]*?startCombat\(live\.map\(e=>String\(e\.id\)\),'ambush'\)/,
  'Runtime 2.00 ambush action must keep its event guard, full live-enemy source and label');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'Runtime 2.00 startCombat body must be available for 4L characterization');
const startBody=startMatch[1];
assert.match(startBody,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'legacy ambush must re-filter requested ids only through liveEnemies');
assert.match(startBody,/const begin=\(\)=>launchCombat200\(x,chosen\)/,
  'legacy ambush must delegate the chosen full live set to the Runtime 2.00 launcher');
assert.doesNotMatch(startBody,/reason==='ambush'/,
  'Runtime 2.00 startCombat must not contain hidden ambush-specific participant filtering');
assert.match(core200,/function liveEnemies\(\)[\s\S]*?!e\.dc200Bypassed[\s\S]*?!e\.dc200BypassedBy\?\.\[hero\]/,
  'legacy ambush enemy source must retain the bypass exclusions fixed in lot 4J');

assert.equal(Bridge.isV113DetectionReason('ambush'),true,
  'Bridge classifies ambush as a V113 detection reason');
assert.equal(Bridge.isV113DetectionReason('legacy-launch'),false,
  'legacy-launch must remain outside V113 detection preparation');
assert.match(bridgeSource,/function prepareV113Detection\([\s\S]*?isV113DetectionReason\(options\.reason\)[\s\S]*?detectionPairs[\s\S]*?enemyIds=enemyIds\.filter\(id=>visible\.has\(id\)\)/,
  'Bridge ambush preparation must visibly intersect requested enemies with V113 detection pairs');
assert.match(authoritySource,/function detectionPairs\([\s\S]*?distance>vision\|\|!lineOfSightCells\(state,ec,hc\)/,
  'V113 detection pairs must be governed by vision range and line of sight');

function makeRuntime(){
  const enemies=[{id:'e-near',hp:5},{id:'e-far',hp:5}];
  const opened=[];
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    GensRpgTacticalCombatV2:{},
    GensRpgTacticalCombatV2Adapter:{
      participants:()=>['h1'],
      enteredParticipants:(_rt,ids)=>ids,
      activeEnemies:()=>enemies
    },
    GensRpgTacticalCombatV2Ui:{
      getBattle:()=>null,
      openCurrentEncounter:opts=>{opened.push({...opts});return {winner:null}}
    },
    GensRpgTacticalRuntimeAuthority1678113:{
      detectionPairs:()=>[{enemyId:'e-near',heroId:'h1',scope:{room:1,branchSourceId:''}}],
      selectCombatants:(_rt,opts)=>({
        heroIds:['h1'],
        enemyIds:[...(opts.enemyIds||[])],
        scope:opts.scope||{room:1,branchSourceId:''},
        sourceHeroIds:[...(opts.sourceHeroIds||['h1'])]
      })
    },
    document:{body:{style:{}}},
    dispatchEvent:()=>{}
  };
  return {rt,opened};
}

{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'ambush',entry:'lot4l-characterization'});
  assert.equal(result.ok,true,'mock ambush Bridge route should remain openable');
  assert.deepEqual(opened[0].enemyIds,['e-near'],
    'direct reason=ambush Bridge routing currently removes a requested enemy absent from V113 detectionPairs');
}
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'legacy-launch',entry:'lot4l-control'});
  assert.equal(result.ok,true,'non-detection control route should remain openable');
  assert.deepEqual(opened[0].enemyIds,['e-near','e-far'],
    'without V113 detection preparation the same requested live set must remain intact');
}

console.log('GenSrpG combat lot 4L characterization OK: Runtime 2.00 ambush requests the full live set, while direct reason=ambush Bridge routing can narrow it through V113 detection; mechanical migration is forbidden');
