const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

let opened=null,legacy={start:0,setup:0,launch:0,direct:0};
const enemy={id:'e1',enemyId:'goblin',hp:5};
const rt={
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({gameStyle:'dungeon'}),
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['h1'],enteredParticipants:(runtime,ids)=>ids,
    activeEnemies:()=>[enemy]
  },
  GensRpgTacticalCombatV2Ui:{
    getBattle:()=>null,
    openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}
  },
  dc200StartCombat(){legacy.start++;return 'legacy-start'},
  openDungeonCombatSetup(){legacy.setup++;return 'legacy-setup'},
  launchCombat200(){legacy.launch++;return 'legacy-launch'},
  startCombat(){legacy.direct++;return 'legacy-direct'},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},
  dispatchEvent(){},showToast(){},console
};

assert.equal(Bridge.install(rt),true);
assert.equal(typeof Bridge.requestCombat,'function','Bridge must expose one explicit Tactical request contract');

opened=null;
let out=rt.dc200StartCombat(['e1'],'manual');
assert.equal(out.ok,true);assert.deepEqual(opened.enemyIds,['e1']);assert.equal(opened.entry,'dc200StartCombat');

opened=null;
out=rt.openDungeonCombatSetup();
assert.equal(out.ok,true);assert.deepEqual(opened.enemyIds,['e1']);assert.equal(opened.entry,'openDungeonCombatSetup');

opened=null;
out=rt.launchCombat200({},[{id:'e1'}]);
assert.equal(out,true);assert.deepEqual(opened.enemyIds,['e1']);assert.equal(opened.entry,'launchCombat200');

opened=null;
out=rt.startCombat(['e1'],'manual');
assert.equal(out.ok,true);assert.deepEqual(opened.enemyIds,['e1']);assert.equal(opened.entry,'dc200StartCombat','historical startCombat alias keeps the existing diagnostic entry');

opened=null;
out=rt.openTacticalCombatV2({enemyIds:['e1'],reason:'api-test'});
assert.equal(out.ok,true);assert.deepEqual(opened.enemyIds,['e1']);assert.equal(opened.entry,'openTacticalCombatV2');

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
assert.match(source,/function requestCombat\(rt=R,options=\{\}\)/,'single explicit Bridge request contract missing');
for(const name of ['startDefault','setupDefault','launchDefault']){
  const m=source.match(new RegExp('function '+name+'\\([^\\n]+\\n(?:.|\\n)*?\\n  \\}'));
  assert.ok(m,`${name} source missing`);
  assert.match(m[0],/requestCombat\(rt,/i,`${name} must delegate Dungeon routing to requestCombat`);
}
assert.match(source,/rt\.openTacticalCombatV2=\(opts=\{\}\)=>requestCombat\(rt,/,'public Tactical API must delegate to requestCombat');

console.log('GenSrpG Bridge single combat-entry contract characterized: compatibility globals -> requestCombat -> openCurrent');
