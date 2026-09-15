const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');

const corePath='assets/gensrpg/core/rpg-rules.js';
const statsPath='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';
assert.ok(source.includes(corePath),'integration chain must explicitly load the Core RPG rules module');
assert.ok(source.includes(statsPath),'integration chain must still load Tactical V110 stats');
assert.ok(source.indexOf(corePath)<source.indexOf(statsPath),'Core RPG loader definition must precede Tactical stats dependency in the explicit chain');
assert.match(source,/after109=.*loadCoreRpgRules\(loadStats110\)/s,'V109 completion must route through Core before V110 stats');

const loaded=[];
const R={
  console,
  GensRpgTacticalCombatV2Adapter:{commitBattle(){return {ok:true}}},
  GensRpgTacticalPolish1678108:{installWithRetries(){}},
  GensRpgTacticalPolish1678109:{installWithRetries(){}},
};

const head={
  appendChild(script){
    loaded.push(String(script.src||''));
    if(String(script.src).includes(corePath)){
      R.GensRpgCoreRules={VERSION:'1.3.0'};
      script.onload?.();
      return script;
    }
    if(String(script.src).includes(statsPath)){
      // Stop the simulated chain here: the contract only needs to prove Core -> V110 ordering.
      R.GensRpgTacticalStats1678110={installWithRetries(){}};
      return script;
    }
    throw new Error('Unexpected script before Tactical stats: '+script.src);
  }
};
R.document={
  head,
  documentElement:head,
  createElement(tag){assert.equal(tag,'script');return {async:true,src:'',onload:null,onerror:null}}
};

const context={...R,globalThis:null};
context.globalThis=context;
context.GensRpgTacticalCombatV2Adapter=R.GensRpgTacticalCombatV2Adapter;
context.GensRpgTacticalPolish1678108=R.GensRpgTacticalPolish1678108;
context.GensRpgTacticalPolish1678109=R.GensRpgTacticalPolish1678109;
context.document=R.document;
vm.createContext(context);
vm.runInContext(source,context,{filename:'gens-rpg-tactical-combat-v2-integration.js'});

assert.equal(loaded.length,2,'the simulated chain must reach exactly Core then Tactical stats before stopping');
assert.ok(loaded[0].includes(corePath),'Core RPG rules must be the first dynamically loaded dependency after V109');
assert.ok(loaded[1].includes(statsPath),'Tactical V110 stats must load only after Core RPG rules are ready');
assert.ok(context.GensRpgCoreRules,'Core API must exist before the V110 stats request is emitted');

console.log('GenSrpG runtime load order: V109 -> Core RPG rules -> Tactical V110 stats OK');
