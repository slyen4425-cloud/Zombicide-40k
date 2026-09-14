const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const path=require('node:path');
const E=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2.js'));

assert.equal(E.APP_VERSION,'16.78.114.10');

function baseBattle(extra={}){
  return E.createBattle({
    id:'tactical-test',rngSeed:123,
    grid:{width:10,height:8,blocked:[{x:4,y:3},{x:4,y:4}]},
    actors:[
      {id:'aldren',name:'Aldren',side:'hero',x:1,y:3,hp:14,maxHp:14,movement:3,initiative:14,defense:8,armor:2,attacks:[{id:'sword',name:'Épée',range:1,hit:85,power:5},{id:'knife',name:'Dague',range:1,hit:90,power:3}]},
      {id:'lyra',name:'Lyra',side:'hero',x:1,y:5,hp:10,maxHp:10,movement:4,initiative:18,defense:10,armor:1,attacks:[{id:'bow',name:'Arc',minRange:2,maxRange:6,hit:88,power:4}]},
      {id:'skeleton',name:'Squelette',side:'enemy',x:6,y:6,hp:8,maxHp:8,movement:2,initiative:9,defense:6,armor:1,attacks:[{id:'rusty',name:'Lame rouillée',range:1,hit:70,power:4}]}
    ],...extra
  });
}

{
  const s=E.createBattle({grid:{width:4,height:4},actors:[{id:'h',side:'hero',x:0,y:0,hp:1,attacks:[{id:'a',hit:70,meta:{hitBreakdown:{kind:'rpg-d100',baseChance:55}}}]},{id:'e',side:'enemy',x:3,y:3,hp:1}]});
  assert.equal(E.actorById(s,'h').attacks[0].meta.hitBreakdown.baseChance,55,'attack calculation metadata must survive normalization');
}

{
  const s=baseBattle();
  assert.equal(E.currentActor(s).id,'lyra','initiative must select Lyra first');
  const cells=E.reachableCells(s,'lyra');
  assert.ok(cells.some(c=>c.x===3&&c.y===5&&c.cost===2));
  assert.ok(!cells.some(c=>c.x===6&&c.y===5),'movement budget must be enforced');
}

{
  const s=baseBattle();
  const p=E.shortestPath(s,'lyra',{x:3,y:3});
  assert.ok(Array.isArray(p)&&p.length>0);
  assert.ok(!p.some(c=>c.x===4&&c.y===3),'path must not cross blocked cell');
}

{
  const s=baseBattle();
  const preview=E.attackPreview(s,'lyra','skeleton','bow');
  assert.equal(preview.ok,true,'bow should have range and clear LOS from Lyra');
  assert.equal(preview.distance,6);
}

{
  const s=E.createBattle({grid:{width:8,height:6,blocked:[{x:3,y:2}]},actors:[
    {id:'archer',side:'hero',x:1,y:2,hp:10,initiative:20,attacks:[{id:'bow',range:6,hit:90,power:4}]},
    {id:'enemy',side:'enemy',x:6,y:2,hp:10,initiative:1,attacks:[{id:'claw',range:1,power:2}]}
  ]});
  const preview=E.attackPreview(s,'archer','enemy','bow');
  assert.equal(preview.ok,false);
  assert.equal(preview.reason,'line-of-sight','wall must block ranged attack');
}

{
  const s=E.createBattle({rngSeed:1,grid:{width:6,height:4},actors:[
    {id:'hero',side:'hero',x:1,y:1,hp:10,initiative:20,attacks:[{id:'blade',range:1,hit:95,power:5}]},
    {id:'enemy',side:'enemy',x:2,y:1,hp:4,armor:1,initiative:1,attacks:[{id:'claw',range:1,power:2}]}
  ]});
  const result=E.resolveAttack(s,'hero','enemy','blade',1);
  assert.equal(result.ok,true);assert.equal(result.hit,true);assert.equal(result.damage,4);assert.equal(result.targetDefeated,true);
  assert.equal(s.status,'ended');assert.equal(s.winner,'hero');
}

{
  const s=E.createBattle({rngSeed:5,grid:{width:8,height:5},actors:[
    {id:'hero',side:'hero',x:1,y:2,hp:12,initiative:5,attacks:[{id:'sword',range:1,hit:90,power:4}]},
    {id:'enemy',side:'enemy',x:6,y:2,hp:10,movement:3,initiative:20,attacks:[{id:'claw',range:1,hit:95,power:3}]}
  ]});
  assert.equal(E.currentActor(s).id,'enemy');
  const before=E.distance(E.actorById(s,'enemy'),E.actorById(s,'hero'));
  const ai=E.aiStep(s);
  assert.equal(ai.ok,true);
  const after=E.distance(E.actorById(s,'enemy'),E.actorById(s,'hero'));
  assert.ok(after<before,'AI should close distance');
  assert.equal(E.currentActor(s).id,'hero','AI must hand turn back immediately with no timer');
}

{
  const s=E.createBattle({grid:{width:7,height:5},actors:[
    {id:'h',side:'hero',x:1,y:2,hp:20,initiative:20,attacks:[{id:'bow',range:5,hit:80,power:3}]},
    {id:'e',side:'enemy',x:5,y:2,hp:20,initiative:10,attacks:[{id:'bow',range:5,hit:80,power:3}]}
  ]});
  for(let i=0;i<30&&s.status==='active';i++){
    const a=E.currentActor(s),t=s.actors.find(x=>x.alive&&x.side!==a.side);
    if(E.attackPreview(s,a.id,t.id,'bow').ok)E.resolveAttack(s,a.id,t.id,'bow',1);
    if(s.status==='active')E.endTurn(s);
  }
  assert.ok(s.log.filter(x=>x.type==='turn').length>=2);
}

{
  const t0=performance.now();
  for(let i=0;i<1000;i++){
    const s=E.createBattle({grid:{width:12,height:10,blocked:[{x:5,y:4},{x:5,y:5}]},actors:[
      {id:'h',side:'hero',x:1,y:1,hp:10,movement:4,initiative:20,attacks:[{id:'bow',range:6,hit:80,power:3}]},
      {id:'e',side:'enemy',x:9,y:8,hp:10,movement:3,initiative:10,attacks:[{id:'claw',range:1,hit:70,power:3}]}
    ]});
    E.reachableCells(s,'h');E.shortestPath(s,'h',{x:3,y:3});E.lineOfSight(s,{x:1,y:1},{x:9,y:8});
  }
  const ms=performance.now()-t0;
  assert.ok(ms<1000,`pure tactical engine benchmark too slow: ${ms.toFixed(1)}ms`);
  console.log('GenSrpG Tactical Combat V2 foundation OK', {ms:Number(ms.toFixed(1))});
}
