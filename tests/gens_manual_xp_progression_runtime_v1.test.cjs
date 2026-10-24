const assert=require('node:assert/strict');
const path=require('node:path');
const modPath=path.join('..','assets','gensrpg','dungeon','progression-runtime-v1.js');
const P=require(modPath);

assert.equal(P.APP_VERSION,'16.78.114.11-progression-runtime-1');
assert.equal(typeof P.applyManualXpDelta,'function');
assert.equal(typeof P.install,'function');

{
  let syncs=0,levelUps=0,saves=0,renders=0,sounds=0;
  const rt={
    current:'dungeon_aldren',
    state:{xp:9,rpgLevel:1,statPoints:0,skillPoints:0},
    isDungeonHeroSheet:()=>true,
    dungeonSyncProgressionForState(id,st){
      syncs++;assert.equal(id,'dungeon_aldren');
      const level=1+Math.floor(st.xp/10);st.rpgLevel=level;st.statPoints=Math.max(0,level-1);st.skillPoints=Math.max(0,level-1);return st;
    },
    dungeonHandleLevelUp071(id,before,st){levelUps++;assert.equal(id,'dungeon_aldren');assert.equal(before,9);assert.equal(st.xp,10);return true},
    save(){saves++},render(){renders++},z40kPlayUiSound(){sounds++}
  };
  const out=P.applyManualXpDelta(rt,1);
  assert.equal(out,true);
  assert.equal(rt.state.xp,10);
  assert.equal(rt.state.rpgLevel,2);
  assert.equal(rt.state.statPoints,1,'manual threshold crossing must expose the earned characteristic point');
  assert.equal(syncs,1,'progression formula must remain owned by dungeonSyncProgressionForState');
  assert.equal(levelUps,1,'manual XP gain must use the same level-up lifecycle as combat/objective XP');
  assert.equal(saves,1,'manual XP mutation must be persisted explicitly');
  assert.equal(renders,1,'hero sheet must refresh after persisted progression');
  assert.equal(sounds,1);
}

{
  let oldCalls=0;
  const rt={
    changeXP(v){oldCalls++;return 'legacy:'+v},
    isDungeonHeroSheet:()=>false
  };
  assert.equal(P.install(rt),true);
  assert.equal(rt.changeXP(3),'legacy:3','non-Dungeon XP must delegate unchanged to the pre-existing handler');
  assert.equal(oldCalls,1);
  assert.equal(rt.changeXP.__gensRpgProgressionRuntimeV1,true);
}

console.log('GenSrpG progression runtime V1 contract OK: Dungeon manual XP reuses canonical sync/level-up/persistence; Survival delegates unchanged');
