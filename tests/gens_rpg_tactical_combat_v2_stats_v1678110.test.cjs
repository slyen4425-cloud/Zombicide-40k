const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'));
assert.equal(P.APP_VERSION,'16.78.110');
assert.equal(P.SNAPSHOT_VERSION,'16.78.110');

function runtime(){
  let snapshotCalls=0;
  const state={rpgAttributes:{force:15,agilite:12,intelligence:9,esprit:8,endurance:14,tactique:4},rightHand:0,inventory:[{itemId:'sword'}],mana:7,elementResistances:{fire:25}};
  const values={force:15,agilite:12,intelligence:9,esprit:8,endurance:14,tactique:4,defense:6,armor:2,initiative:13,movement:4};
  const defs=Object.keys(values).map(id=>({id,name:id[0].toUpperCase()+id.slice(1),icon:'•',defaultValue:0}));
  const derived={physicalDamageBonus:2,magicDamageBonus:3,maxMana:10,crit:18,dodge:11,initiative:13,magicResistance:3};
  const rt={current:'',state:null,CHARS:{hero:{name:'Hero',dungeonStats:{...values}}},loadState:()=>state,
    GensCleanRpgStats167874:{
      coreSnapshot(id){
        snapshotCalls++;
        return {
          version:'1.0.0',heroId:id,
          canonical:defs.map(d=>({id:d.id,name:d.name,icon:d.icon,value:values[d.id]})),
          values:{...values},
          derived:{...derived}
        };
      }
    },
    effectiveMaxWounds:()=>20,dungeonHeroMoveValue083:()=>4,dungeonDerivedInitiative:()=>13,dungeonDerivedDefense:()=>6,dungeonArmorScore:()=>2,
    loadDungeonRpgRules:()=>({critMultiplier:2})};
  return {rt,state,getSnapshotCalls:()=>snapshotCalls};
}

{
  const {rt,getSnapshotCalls}=runtime();P.resetMetrics();
  const actor={id:'hero',side:'hero',hp:17,maxHp:20,movement:3,initiative:10,defense:1,armor:0,dodge:0,meta:{heroId:'hero'}};
  const snap=P.buildHeroSnapshot(rt,'hero',actor);
  assert.equal(snap.values.force,15);assert.equal(snap.values.tactique,4);
  assert.equal(snap.derived.crit,18);assert.equal(snap.derived.magicResistance,3);assert.equal(snap.derived.maxMana,10);assert.equal(snap.derived.mana,7);
  assert.equal(snap.resistances.fire,25);
  assert.equal(P.metrics.snapshotsBuilt,1);assert.equal(P.metrics.canonicalReads,snap.canonical.length);assert.equal(getSnapshotCalls(),1);
}

{
  const {rt,getSnapshotCalls}=runtime();P.resetMetrics();
  const battle={actors:[{id:'hero',side:'hero',hp:17,maxHp:20,movement:3,initiative:10,defense:1,armor:0,dodge:0,movementLeft:2,meta:{heroId:'hero'}}],meta:{}};
  P.decorateBattle(rt,battle,{force:true});const first=getSnapshotCalls();
  assert.equal(first,1);assert.equal(battle.actors[0].movement,4);assert.equal(battle.actors[0].movementLeft,2);assert.equal(battle.actors[0].defense,6);assert.equal(battle.meta.statsSnapshotVersion,'16.78.110');
  for(let i=0;i<200;i++)P.decorateBattle(rt,battle);
  assert.equal(getSnapshotCalls(),first,'repeated tactical renders/previews must reuse the in-memory snapshot');
  const beforeRows=getSnapshotCalls();for(let i=0;i<200;i++)P.detailRows(battle.actors[0]);assert.equal(getSnapshotCalls(),beforeRows,'detail rendering must be snapshot-only');
  P.markHeroDirty('hero');P.decorateBattle(rt,battle);assert.equal(getSnapshotCalls(),first*2,'an explicit hero mutation must rebuild exactly one hero snapshot');
}

{
  const actors=[
    {id:'mage',side:'hero',x:0,y:0,hp:20,maxHp:20,actionsLeft:1,alive:true,attacks:[{id:'spell',power:10,damageType:'magic'},{id:'fire',power:10,damageType:'fire'},{id:'sword',power:10,damageType:'physical'}],meta:{rpgStats:{derived:{crit:0},rules:{criticalMultiplier:2}}}},
    {id:'target',side:'enemy',x:1,y:0,hp:30,maxHp:30,armor:2,alive:true,meta:{rpgStats:{derived:{magicResistance:3},resistances:{fire:25}}}}
  ];
  const E={
    actorById:(s,id)=>s.actors.find(a=>a.id===String(id)),currentActor:s=>s.actors.find(a=>a.id===s.order[s.turnIndex]),
    attackPreview(s,aid,tid,attackId){const a=this.actorById(s,aid),t=this.actorById(s,tid),atk=a.attacks.find(x=>x.id===attackId);return {ok:true,attack:atk,distance:1,los:{cover:0},hitChance:95,damage:Math.max(0,atk.power-(atk.damageType==='physical'?t.armor:2)),armor:t.armor}},
    resolveAttack(){throw new Error('legacy resolve must be replaced')},refreshOutcome(){},endTurn(){},distance:(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),reachableCells:()=>[],moveActor(){},coverAt:()=>0
  };
  const rt={GensRpgTacticalCombatV2:E};assert.equal(P.hookRules(rt),true);
  const state={status:'active',actors,order:['mage','target'],turnIndex:0,log:[],rngSeed:123};
  let p=E.attackPreview(state,'mage','target','spell');assert.equal(p.damage,7);assert.equal(p.resistance,3);assert.equal(p.damageType,'magic');
  p=E.attackPreview(state,'mage','target','fire');assert.equal(p.damage,8);assert.equal(p.resistance,25);assert.equal(p.resistanceKind,'percent');
  p=E.attackPreview(state,'mage','target','sword');assert.equal(p.damage,8,'physical damage must keep the established armor result');
  actors[0].meta.rpgStats.derived.crit=100;actors[0].actionsLeft=1;const r=E.resolveAttack(state,'mage','target','spell',1);assert.equal(r.hit,true);assert.equal(r.crit,true);assert.equal(r.damage,14);assert.equal(actors[1].hp,16);
}

const source=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-stats-1678110.js'),'utf8');
const integration=fs.readFileSync(path.join(__dirname,'..','assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8');
assert.equal((source.match(/api\.coreSnapshot\(/g)||[]).length,1,'Core snapshot adapter must only be called by the snapshot builder');
for(const removed of ['dungeonPhysicalDamageBonus','dungeonMagicDamageBonus','dungeonMaxMana','dungeonCriticalChance','dungeonDodgeChance','dungeonMagicResistance'])assert.equal(source.includes(removed),false,'V110 must not reread '+removed);
assert.match(source,/data-v110-attack/);assert.match(source,/data-v110-end/);assert.match(source,/data-v110-ability/);
assert.match(source,/gtv2109QuickAttack\{display:none!important\}/);
assert.match(integration,/gens-rpg-tactical-combat-v2-stats-1678110\.js\?v=16\.78\.110/,'V110 stats layer must be loaded after V109');
assert.match(sw,/gensrpg-cache-16\.78\.110-full-stat-tactical/,'PWA cache must change for V110');
assert.match(sw,/gens-rpg-tactical-combat-v2-stats-1678110\.js/,'V110 stats layer must be precached');
console.log('V16.78.110 cached canonical tactical stats + fixed action dock: OK');
