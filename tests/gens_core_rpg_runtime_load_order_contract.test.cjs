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
assert.match(source,/after109=.*loadCoreRpgRules\(loadStats110\)/s,'V109 completion must route through Core before V110 stats');

const loaded=[];
let context=null;
const adapter={commitBattle(){return {ok:true}}};
const polish108={installWithRetries(){}};
const polish109={installWithRetries(){}};
const head={
  appendChild(script){
    loaded.push(String(script.src||''));
    if(String(script.src).includes(corePath)){
      context.GensRpgCoreRules={VERSION:'1.3.0'};
      script.onload?.();
      return script;
    }
    if(String(script.src).includes(statsPath)){
      // Stop the simulated chain here: the contract only needs to prove Core -> V110 ordering.
      context.GensRpgTacticalStats1678110={installWithRetries(){}};
      return script;
    }
    throw new Error('Unexpected script before Tactical stats: '+script.src);
  }
};
const document={
  head,
  documentElement:head,
  createElement(tag){assert.equal(tag,'script');return {async:true,src:'',onload:null,onerror:null}}
};

context={
  console,
  globalThis:null,
  GensRpgTacticalCombatV2Adapter:adapter,
  GensRpgTacticalPolish1678108:polish108,
  GensRpgTacticalPolish1678109:polish109,
  document,
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'gens-rpg-tactical-combat-v2-integration.js'});

assert.equal(loaded.length,2,'the simulated chain must reach exactly Core then Tactical stats before stopping');
assert.ok(loaded[0].includes(corePath),'Core RPG rules must be the first dynamically loaded dependency after V109');
assert.ok(context.GensRpgCoreRules,'Core API must exist before the V110 stats request is emitted');
assert.ok(loaded[1].includes(statsPath),'Tactical V110 stats must load only after Core RPG rules are ready');

console.log('GenSrpG runtime load order: V109 -> Core RPG rules -> Tactical V110 stats OK');
