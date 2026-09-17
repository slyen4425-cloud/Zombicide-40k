const assert=require('node:assert/strict');
const path=require('node:path');
const Bridge=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

let battle=null,cleanupCalls=0;
const order=[];
const modal={style:{display:'block'},classList:{remove(){}}};
const rt={
  console,
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({id:'dungeon',gameStyle:'dungeon'}),
  GensRpgTacticalCombatV2:{createBattle(){}},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['dungeon_aldren'],
    enteredParticipants:(_rt,ids)=>ids,
    activeEnemies:()=>[{id:'enemy_1',hp:6}]
  },
  GensRpgTacticalCombatV2Ui:{
    getBattle:()=>battle,
    openCurrentEncounter(opts){order.push('open');battle={id:'battle',status:'active',opts};return battle}
  },
  GensRpgRuntimeRepair1678106:{
    closeLegacyCombat(runtime){
      order.push('cleanup');cleanupCalls++;
      const el=runtime.document.getElementById('dungeonCombatModal');
      el.classList.remove('dc200CombatOpen','open');
      el.style.display='none';
      runtime.dungeonCombatActive=false;
      return true;
    }
  },
  document:{body:{style:{}},getElementById:id=>id==='dungeonCombatModal'?modal:null},
  dispatchEvent(){},showToast(){}
};

const result=Bridge.requestCombat(rt,{enemyIds:['enemy_1'],reason:'manual',entry:'dock-layer-target'});
assert.equal(result.ok,true,'direct canonical Bridge request must still open Tactical');
assert.equal(cleanupCalls,1,'direct Bridge routing must reuse the existing V106 legacy combat cleanup exactly once');
assert.deepEqual(order,['open','cleanup'],'legacy host cleanup must happen immediately after the canonical Tactical open, matching the established V106 transition order');
assert.equal(modal.style.display,'none','legacy Dungeon combat host must be hidden before control returns to the browser');
assert.equal(rt.dungeonCombatActive,false,'legacy Dungeon combat active flag must not remain authoritative under Tactical');
console.log('GenSrpG Tactical Bridge legacy layer target OK');
