const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

function scriptBody(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=html.match(re);
  assert.ok(m,`script ${id} not found`);
  return m[1];
}

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

// Default ambush routes remain detection-owned by V113 (Core 2.09 and other callers).
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'ambush',entry:'lot4l-default-ambush'});
  assert.equal(result.ok,true);
  assert.deepEqual(opened[0].enemyIds,['e-near'],
    'ordinary ambush routing must keep V113 detection filtering');
}

// Runtime 2.00 already selected the full live enemy list for this explicit ambush action.
// The Bridge must allow that caller to preserve the requested enemy seed while still
// applying V113 selectCombatants for scope/heroes/reinforcement semantics.
{
  const {rt,opened}=makeRuntime();
  const result=Bridge.requestCombat(rt,{enemyIds:['e-near','e-far'],reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true});
  assert.equal(result.ok,true);
  assert.deepEqual(opened[0].enemyIds,['e-near','e-far'],
    'preserveEnemyIds=true must skip only the detection-pair intersection for an already-selected ambush enemy seed');
}

assert.match(bridgeSource,/options\.preserveEnemyIds===true\|\|!isV113DetectionReason\(options\.reason\)/,
  'Bridge must expose a narrow preserveEnemyIds opt-out before V113 detection preparation');

const core200=scriptBody('dungeonCore200Rebuild');
const oldAmbush="b.onclick=()=>startCombat(live.map(e=>String(e.id)),'ambush')";
const newAmbush="b.onclick=()=>window.GensRpgTacticalCombatV2Bridge.requestCombat(window,{enemyIds:live.map(e=>String(e.id)),reason:'ambush',entry:'dc200AmbushAction',preserveEnemyIds:true})";
assert.ok(!core200.includes(oldAmbush),
  'lot 4L must remove the Runtime 2.00 lexical ambush startCombat callsite');
assert.ok(core200.includes(newAmbush),
  'Runtime 2.00 ambush must call the canonical Bridge with its full live enemy seed and explicit preservation contract');
assert.equal((core200.match(/entry:'dc200AmbushAction'/g)||[]).length,1,
  'Runtime 2.00 must expose exactly one canonical ambush Bridge entry');
assert.match(core200,/if\(x\.last\?\.kind==='ambush'&&live\.length\)[\s\S]*?b\.textContent='⚔️ EMBUSCADE — COMBATTRE'[\s\S]*?entry:'dc200AmbushAction'[\s\S]*?preserveEnemyIds:true/,
  'lot 4L must preserve the Runtime 2.00 ambush event guard, label and full live-enemy source');

console.log('GenSrpG combat lot 4L target contract OK: Runtime 2.00 ambush is Bridge-backed without changing its already-selected enemy seed; ordinary ambush detection remains V113-owned');
