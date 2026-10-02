'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const entrySrc=read('assets/gensrpg/tactical/entry-v1.js');
const integrationSrc=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');

// Target 1: bootstrap loads only the inert Bridge facade.
{
  const loaded=[];
  let bridgeInstalls=0,readyCallbacks=0;
  const sandbox={console};
  const head={appendChild(s){
    loaded.push(s.src);
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js')){
      sandbox.GensRpgTacticalCombatV2Bridge={install(){bridgeInstalls++;return true}};
      s.onload?.();return s;
    }
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2.js'))sandbox.GensRpgTacticalCombatV2={};
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js'))sandbox.GensRpgTacticalCombatV2Adapter={};
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js'))sandbox.GensRpgTacticalCombatV2Rules={};
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js'))sandbox.GensRpgTacticalCombatV2Ui={};
    if(s.src.startsWith('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js')){
      s.onload?.();
      sandbox.GensTacticalV1?.compatibilityReady?.(true);
      return s;
    }
    s.onload?.();return s;
  }};
  sandbox.document={head,documentElement:head,createElement(){return {src:'',async:true,onload:null,onerror:null}}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(entrySrc,sandbox,{filename:'tactical/entry-v1.js'});

  assert.deepEqual(loaded,[
    'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105'
  ],'bootstrap must load only the inert Bridge facade');
  assert.equal(bridgeInstalls,0,'Bridge facade must not install before a combat request');
  assert.notEqual(sandbox.__gensTacticalV2Loader105,true,'private Tactical loader guard must remain cold before first combat');
  assert.equal(typeof sandbox.GensTacticalV1?.activate,'function','public Tactical entry must expose session activation');

  sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);readyCallbacks++});
  assert.deepEqual(loaded,[
    'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js?v=16.78.105'
  ],'first activation must load the private stack once, with Bridge already resident');
  assert.equal(sandbox.__gensTacticalV2Loader105,true,'historical private-loader guard must be set only when activation begins');
  assert.equal(bridgeInstalls,1,'Bridge must install exactly once after base + compatibility readiness');
  assert.equal(readyCallbacks,1,'activation callback must fire exactly once');

  const before=loaded.length;
  sandbox.GensTacticalV1.activate(ok=>{assert.equal(ok,true);readyCallbacks++});
  assert.equal(loaded.length,before,'warm activation must be idempotent');
  assert.equal(bridgeInstalls,1,'warm activation must not reinstall Bridge');
  assert.equal(readyCallbacks,2,'warm activation callback must resolve synchronously');
}

// Target 2: a cold Bridge request is accepted and replayed after activation.
{
  const Bridge=require(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'));
  let activationCalls=0,ready=null,opened=0;
  const enemy={id:'e1',enemyId:'goblin',hp:5};
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    getActiveGameProfile:()=>({gameStyle:'dungeon'}),
    GensTacticalV1:{activate(cb){activationCalls++;ready=cb;return true}},
    showToast(){},dispatchEvent(){},console
  };
  const first=Bridge.requestCombat(rt,{enemyIds:['e1'],reason:'manual',entry:'phase8-first-cold'});
  assert.equal(first?.ok,true,'cold request must be accepted');
  assert.equal(first?.pending,true,'cold request must report activation pending');
  assert.equal(first?.reason,'tactical-activating','cold request must expose the lifecycle reason');
  assert.equal(activationCalls,1,'cold request must ask the public entry to activate');
  assert.equal(opened,0,'combat must not open before private readiness');

  rt.GensRpgTacticalCombatV2={};
  rt.GensRpgTacticalCombatV2Adapter={
    participants:()=>['h1'],enteredParticipants:(_rt,ids)=>ids,activeEnemies:()=>[enemy]
  };
  rt.GensRpgTacticalCombatV2Ui={
    getBattle:()=>null,
    openCurrentEncounter(){opened++;return {actors:[],winner:null}}
  };
  assert.equal(typeof ready,'function','cold request activation callback missing');
  ready(true);
  assert.equal(opened,1,'accepted cold request must replay exactly once after activation');
}

// Target 3: warm request remains synchronous and unchanged.
{
  const Bridge=require(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'));
  let opened=0;
  const enemy={id:'e1',enemyId:'goblin',hp:5};
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    getActiveGameProfile:()=>({gameStyle:'dungeon'}),
    GensRpgTacticalCombatV2:{},
    GensRpgTacticalCombatV2Adapter:{participants:()=>['h1'],enteredParticipants:(_rt,ids)=>ids,activeEnemies:()=>[enemy]},
    GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter(){opened++;return {actors:[],winner:null}}},
    dispatchEvent(){},showToast(){},console
  };
  const out=Bridge.requestCombat(rt,{enemyIds:['e1'],reason:'manual',entry:'phase8-warm'});
  assert.equal(out?.ok,true);
  assert.equal(out?.pending,undefined,'warm request must remain synchronous');
  assert.equal(opened,1);
}

// Target 4: compatibility-chain completion is signalled deterministically to the public entry.
assert.match(integrationSrc,/GensTacticalV1\?\.compatibilityReady\?\.\(/,
  'integration must notify the public Tactical lifecycle owner when compatibility activation completes');
assert.doesNotMatch(integrationSrc,/setInterval\s*\(/,
  'first-request activation must not introduce polling/heartbeat in integration');

console.log('Phase 8 Tactical first-request activation target satisfied');
