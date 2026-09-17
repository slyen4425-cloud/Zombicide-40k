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
const oldAmbushCall="b.onclick=()=>startCombat(live.map(e=>String(e.id)),'ambush')";
const newAmbushCall="b.onclick=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true})";
assert.ok(!core200.includes(oldAmbushCall),
  'post-migration Runtime 2.00 ambush action must not retain a lexical startCombat callsite');
assert.ok(core200.includes(newAmbushCall),
  'Runtime 2.00 ambush must enter through the Bridge with its full live-enemy seed explicitly preserved');
assert.match(core200,/if\(x\.last\?\.kind==='ambush'&&live\.length\)[\s\S]*?b\.textContent='⚔️ EMBUSCADE — COMBATTRE'[\s\S]*?entry:'dc200AmbushAction'[\s\S]*?preserveEnemyIds:true/,
  'Runtime 2.00 ambush action must keep its event guard, full live-enemy source and label');

const startMatch=core200.match(/function startCombat\(ids,reason\)\{([\s\S]*?)\}\nfunction cleanupCombat\(/);
assert.ok(startMatch,'Runtime 2.00 startCombat body must remain available as characterized compatibility code');
const startBody=startMatch[1];
assert.match(startBody,/let chosen=liveEnemies\(\)\.filter\(e=>ids\.map\(String\)\.includes\(String\(e\.id\)\)\)/,
  'legacy startCombat still re-filters requested ids through liveEnemies for remaining compatibility/cell use');
assert.match(startBody,/const begin=\(\)=>launchCombat200\(x,chosen\)/,
  'legacy startCombat still delegates its chosen set to the Runtime 2.00 launcher');
assert.doesNotMatch(startBody,/reason==='ambush'/,
  'Runtime 2.00 startCombat must not grow a new ambush-specific compatibility branch');
assert.match(core200,/function liveEnemies\(\)[\s\S]*?!e\.dc200Bypassed[\s\S]*?!e\.dc200BypassedBy\?\.\[hero\]/,
  'Runtime 2.00 ambush enemy source must retain the bypass exclusions fixed in lot 4J');

assert.equal(Bridge.isV113DetectionReason('ambush'),true,
  'Bridge must continue classifying ordinary ambush as a V113 detection reason');
assert.equal(Bridge.isV113DetectionReason('legacy-launch'),false,
  'legacy-launch must remain outside V113 detection preparation');
assert.match(bridgeSource,/function prepareV113Detection\([\s\S]*?options\.preserveEnemyIds===true\|\|!isV113DetectionReason\(options\.reason\)[\s\S]*?detectionPairs[\s\S]*?enemyIds=enemyIds\.filter\(id=>visible\.has\(id\)\)/,
  'Bridge must expose only a narrow preserveEnemyIds opt-out before the normal V113 detection-pair intersection');
assert.match(authoritySource,/function detectionPairs\([\s\S]*?distance>vision\|\|!lineOfSightCells\(state,ec,hc\)/,
  'V113 detection pairs must remain governed by vision range and line of sight');

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
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'ambush',entry:'lot4l-characterization-default'});
  assert.equal(result.ok,true,'ordinary mock ambush Bridge route should remain openable');
  assert.deepEqual(opened[0].enemyIds,['e-near'],
    'ordinary reason=ambush Bridge routing must still remove a requested enemy absent from V113 detectionPairs');
}
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true});
  assert.equal(result.ok,true,'Runtime 2.00 preserved-seed ambush route should remain openable');
  assert.deepEqual(opened[0].enemyIds,['e-near','e-far'],
    'Runtime 2.00 preserveEnemyIds contract must keep the full already-selected live enemy seed');
}

console.log('GenSrpG combat lot 4L characterization/migration OK: ordinary ambush stays V113 detection-owned while Runtime 2.00 preserves its already-selected live enemy seed through the canonical Bridge');
