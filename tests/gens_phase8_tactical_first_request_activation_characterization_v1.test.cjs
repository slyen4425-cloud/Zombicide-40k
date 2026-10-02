'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

// Current public entry: characterize eager six-file activation before the migration.
{
  const src=read('assets/gensrpg/tactical/entry-v1.js');
  const loaded=[];
  let bridgeInstalls=0;
  const head={appendChild(s){loaded.push(s.src);if(typeof s.onload==='function')s.onload();return s}};
  const document={head,documentElement:head,createElement(){return {src:'',async:true,onload:null,onerror:null}}};
  const sandbox={
    console,document,
    GensRpgTacticalCombatV2Bridge:{install(){bridgeInstalls++;return true}}
  };
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src,sandbox,{filename:'tactical/entry-v1.js'});

  assert.deepEqual(loaded,[
    'assets/gensrpg/gens-rpg-tactical-combat-v2.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js?v=16.78.105',
    'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js?v=16.78.105'
  ],'current entry must characterize eager loading of the full private stack');
  assert.equal(bridgeInstalls,1,'current entry must eagerly install Bridge after composition');
}

// Cold Bridge request today cannot activate the private stack itself.
{
  const Bridge=require(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'));
  let activationCalls=0;
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    getActiveGameProfile:()=>({gameStyle:'dungeon'}),
    GensTacticalV1:{activate(){activationCalls++;return true}},
    showToast(){},console
  };
  const out=Bridge.requestCombat(rt,{enemyIds:['e1'],reason:'manual',entry:'phase8-cold-characterization'});
  assert.equal(out?.ok,false,'current cold request must be blocked before the migration');
  assert.equal(out?.reason,'modules-missing','current cold request must characterize missing private modules');
  assert.equal(activationCalls,0,'current Bridge must not yet ask the public entry to activate');
}

// Warm/runtime-ready requests must remain synchronous before and after the migration.
{
  const Bridge=require(path.join(root,'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'));
  let opened=0;
  const enemy={id:'e1',enemyId:'goblin',hp:5};
  const rt={
    localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
    getActiveGameProfile:()=>({gameStyle:'dungeon'}),
    GensRpgTacticalCombatV2:{},
    GensRpgTacticalCombatV2Adapter:{
      participants:()=>['h1'],enteredParticipants:(_rt,ids)=>ids,activeEnemies:()=>[enemy]
    },
    GensRpgTacticalCombatV2Ui:{
      getBattle:()=>null,
      openCurrentEncounter(){opened++;return {actors:[],winner:null}}
    },
    dispatchEvent(){},showToast(){},console
  };
  const out=Bridge.requestCombat(rt,{enemyIds:['e1'],reason:'manual',entry:'phase8-warm-characterization'});
  assert.equal(out?.ok,true,'warm Bridge request must remain synchronous');
  assert.equal(out?.pending,undefined,'warm request must not become pending');
  assert.equal(opened,1,'warm request must open exactly one encounter');
}

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical first-request activation characterization',
  current:{
    bootstrapLoadsFullPrivateStack:true,
    bridgeInstalledAtBootstrap:true,
    coldRequest:'modules-missing',
    warmRequest:'synchronous-ok'
  },
  target:{
    bootstrap:'Bridge facade only',
    firstColdRequest:'accepted-pending-then-replayed-once',
    warmRequest:'synchronous-ok'
  },
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
