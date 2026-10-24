const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..','assets','gensrpg');

const adapter={
  commitBattle(rt,battle,opts={}){
    if(opts.removeDefeatedEnemies){
      const dead=new Set((battle.actors||[]).filter(a=>a.side==='enemy'&&!a.alive).map(a=>String(a.meta?.instanceId||'')));
      rt.saveActiveEnemies?.((rt.loadActiveEnemies?.()||[]).filter(x=>!dead.has(String(x.id))));
    }
    return {heroes:2,enemies:1};
  }
};
global.GensRpgTacticalCombatV2Adapter=adapter;

let enemies=[{id:'enemy-instance-1',enemyId:'dng_skeleton',hp:0,maxHp:8}];
let granted=[];
let recorded=[];
const definitions={dng_skeleton:{id:'dng_skeleton',name:'Squelette',rule:{xp:5}}};
Object.assign(global,{
  loadActiveEnemies:()=>enemies.map(x=>({...x})),
  saveActiveEnemies:list=>{enemies=list.map(x=>({...x}))},
  activeEnemyDefinition:id=>definitions[id]||null,
  rollEnemyLoot:()=>[{itemId:'dloot_old_coin',name:'Pièce ancienne',qty:2}],
  awardDungeonDefeatXp:()=>({total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]}),
  grantEnemyLootToHeroId:(heroId,drops)=>{granted.push({heroId,drops:JSON.parse(JSON.stringify(drops))})},
  dungeonRecordCombatReward:(def,xp,drops,killerId)=>{recorded.push({def,xp,drops,killerId})},
  CHARS:{dungeon_aldren:{name:'Aldren'},dungeon_lyra:{name:'Lyra'}}
});

require(path.join(root,'gens-rpg-tactical-combat-v2-integration.js'));
const B=require(path.join(root,'gens-rpg-tactical-combat-v2-bridge.js'));

const battle={
  winner:'hero',
  actors:[
    {id:'dungeon_aldren',side:'hero',alive:true,hp:8},
    {id:'dungeon_lyra',side:'hero',alive:true,hp:9},
    {id:'enemy:enemy-instance-1',side:'enemy',alive:false,hp:0,meta:{instanceId:'enemy-instance-1',enemyId:'dng_skeleton'}}
  ],
  log:[{type:'attack',attackerId:'dungeon_aldren',targetId:'enemy:enemy-instance-1',hit:true,damage:4}]
};

const summary=adapter.commitBattle(global,battle,{removeDefeatedEnemies:true});
assert.equal(summary.rewards.length,1,'one defeated enemy must yield one committed reward row');
assert.equal(summary.rewards[0].killerId,'dungeon_aldren');
assert.deepEqual(summary.rewards[0].xp,{total:5,shares:[{id:'dungeon_aldren',xp:3},{id:'dungeon_lyra',xp:2}]});
assert.deepEqual(summary.rewards[0].drops,[{itemId:'dloot_old_coin',name:'Pièce ancienne',qty:2}]);
assert.equal(granted.length,1,'loot must be granted exactly once');
assert.equal(recorded.length,1,'existing Dungeon reward registry must still receive the outcome when available');
assert.equal(enemies.length,0,'defeated enemy must be removed only after rewards were resolved');

const visible=B.rewardSummaryHtml(global,summary).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
assert.match(visible,/Aldren\s*:\s*⭐\s*\+3 XP/);
assert.match(visible,/Lyra\s*:\s*⭐\s*\+2 XP/);
assert.match(visible,/Pièce ancienne\s*×2\s*→\s*Aldren/);

let modal=null;
global.DungeonCore01={modal(title,html){modal={title,html}}};
assert.equal(B.showOutcomeModal(global,battle,summary),true,'hero victory must reuse the Dungeon modal');
assert.ok(modal,'victory modal must actually open');
assert.match(modal.title,/Victoire/);
const modalVisible=modal.html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
assert.match(modalVisible,/Aldren\s*:\s*⭐\s*\+3 XP/);
assert.match(modalVisible,/Lyra\s*:\s*⭐\s*\+2 XP/);
assert.match(modalVisible,/Pièce ancienne\s*×2/);

const repeat=adapter.commitBattle(global,battle,{removeDefeatedEnemies:true});
assert.deepEqual(repeat.rewards,[],'same battle must never award rewards twice');
assert.equal(granted.length,1,'repeated commit must not duplicate loot');

console.log('GenSrpG V114.11 Tactical victory runtime OK: defeated enemy -> XP/drop -> commit -> Dungeon reward modal, exactly once');
