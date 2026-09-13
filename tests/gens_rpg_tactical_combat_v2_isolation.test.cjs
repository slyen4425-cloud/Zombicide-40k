const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','assets','gensrpg');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const engine=read('gens-rpg-tactical-combat-v2.js');
const adapter=read('gens-rpg-tactical-combat-v2-adapter.js');
const ui=read('gens-rpg-tactical-combat-v2-ui.js');
const bridge=read('gens-rpg-tactical-combat-v2-bridge.js');

const purePatterns=[
  [/\bdocument\s*\./,'document'],[/\blocalStorage\s*\./,'localStorage'],[/\bsetTimeout\s*\(/,'setTimeout'],[/\bsetInterval\s*\(/,'setInterval'],
  [/\brenderDungeonCombatRound\b/,'renderDungeonCombatRound'],[/\bdungeonTurn156\b/,'dungeonTurn156'],[/\bdc029AiWatchdog\b/,'dc029AiWatchdog']
];
for(const [pattern,label] of purePatterns)assert.ok(!pattern.test(engine),`pure tactical engine must not depend on ${label}`);
for(const forbidden of ['renderDungeonCombatRound','dungeonTurn156','dc029AiWatchdog','setInterval(','setTimeout(']){
  assert.ok(!ui.includes(forbidden),`battlefield UI must not reuse legacy combat/timer ${forbidden}`);
}
for(const forbidden of ['dungeonTurn156','dc029AiWatchdog','renderDungeonCombatRound']){
  assert.ok(!adapter.includes(forbidden),`GenSrpG adapter must not call legacy combat controller ${forbidden}`);
  assert.ok(!bridge.includes(forbidden),`experimental bridge must not call legacy combat controller ${forbidden}`);
}

const B=require(path.join(root,'gens-rpg-tactical-combat-v2-bridge.js'));
let opened=0;
const rt={
  isDungeonMode:()=>true,
  GensRpgTacticalCombatV2:{createBattle(){}},
  GensRpgTacticalCombatV2Adapter:{participants:()=>['h1','h2'],activeEnemies:()=>[{id:'e1'}]},
  GensRpgTacticalCombatV2Ui:{openCurrentEncounter:opts=>{opened++;return {id:'battle',opts}}}
};
const eligible=B.eligible(rt);assert.equal(eligible.ok,true);assert.equal(eligible.heroes,2);assert.equal(eligible.enemies,1);
const result=B.openCurrent(rt,{rngSeed:7});assert.equal(result.ok,true);assert.equal(result.battle.id,'battle');assert.equal(opened,1);
rt.GensRpgTacticalCombatV2Adapter.activeEnemies=()=>[];assert.equal(B.eligible(rt).reason,'no-enemies');

console.log('GenSrpG Tactical Combat V2 isolation OK');
