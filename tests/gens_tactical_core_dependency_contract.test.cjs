const assert=require('node:assert/strict');
const path=require('node:path');
const Bridge=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const Core=require(path.join(__dirname,'..','assets','gensrpg','core','rpg-rules.js'));

function fakeDocument(){
  const byId=new Map(),scripts=[];
  const document={
    body:{style:{}},
    createElement(tag){
      const listeners={};
      return {
        tagName:String(tag).toUpperCase(),id:'',src:'',async:true,
        addEventListener(type,fn){listeners[type]=fn},
        __fire(type){listeners[type]?.()},
      };
    },
    getElementById(id){return byId.get(id)||null},
    head:{appendChild(node){scripts.push(node);if(node.id)byId.set(node.id,node);return node}},
  };
  document.documentElement=document.head;
  return {document,scripts,byId};
}

assert.equal(Bridge.CORE_RULES_SRC,'assets/gensrpg/core/rpg-rules.js?v=1.3.0');

{
  const {document,scripts}=fakeDocument();
  const rt={document,console:{error(){}}};
  let ready=0;
  assert.equal(Bridge.ensureCoreRules(rt,()=>ready++),false,'missing Core must start one dependency load');
  assert.equal(scripts.length,1,'Core dependency must be requested once');
  assert.equal(scripts[0].id,'gensRpgCoreRulesScript');
  assert.equal(scripts[0].src,Bridge.CORE_RULES_SRC);
  assert.equal(scripts[0].async,false,'Core dependency must preserve deterministic script ordering');
  assert.equal(ready,0,'ready callback must wait for the Core API');
  rt.GensRpgCoreRules=Core;
  scripts[0].onload();
  assert.equal(ready,1,'Core onload must release queued work');
  assert.equal(Bridge.ensureCoreRules(rt),true,'already loaded Core must be reused');
  assert.equal(scripts.length,1,'already loaded Core must never create a second script');
}

{
  const {document,scripts}=fakeDocument();
  let opened=0,lastOptions=null;
  const rt={
    document,
    console:{error(){}},
    localStorage:{getItem:()=> 'adventure'},
    GensRpgTacticalCombatV2:{},
    GensRpgTacticalCombatV2Adapter:{
      participants:()=>['hero'],
      enteredParticipants:(_rt,ids)=>ids,
      activeEnemies:()=>[{id:'enemy'}],
    },
    GensRpgTacticalCombatV2Ui:{
      getBattle:()=>null,
      openCurrentEncounter(opts){opened++;lastOptions=opts;return {id:'battle'}},
    },
  };
  const pending=Bridge.openCurrent(rt,{heroIds:['hero'],enemyIds:['enemy'],reason:'contract'});
  assert.equal(pending.ok,true);
  assert.equal(pending.pending,true,'combat request must be queued while Core is loading');
  assert.equal(pending.reason,'core-rules-loading');
  assert.equal(opened,0,'Tactical battle must not build a snapshot before Core is ready');
  const coreScript=scripts.find(s=>s.id==='gensRpgCoreRulesScript');
  assert.ok(coreScript,'combat route must request the Core dependency');
  rt.GensRpgCoreRules=Core;
  coreScript.onload();
  assert.equal(opened,1,'queued combat must resume automatically once Core is ready');
  assert.deepEqual(lastOptions.heroIds,['hero']);
  assert.deepEqual(lastOptions.enemyIds,['enemy']);
  assert.equal(Bridge.status(rt).coreReady,true);
}

console.log('GenSrpG Tactical Core dependency contract OK');
