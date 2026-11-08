import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1,availableAdventureStatPointsV1,
 allocateAdventureStatPointsV1,moveAdventurePartyMemberV1,chooseAdventureActiveCreatureV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';

const cards=['alpha','beta','gamma'].map(id=>({
 id,name:id,skills:[{state:'ready'}],
 measures:[{key:'health',value:140},{key:'speed',value:25}]
}));
const registry={schema:'capture-stat-registry-v1',stats:[
 {id:'health',label:'Santé'},{id:'speed',label:'Vitesse'}
]};
const now='2026-11-08T08:00:00.000Z';
function session(){
 const data=createAdventureSessionV1({bestiaryCards:cards,
  starterId:'alpha',starterIds:['alpha','beta','gamma'],
  rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'team-session',instanceId:'a1',reserveInstanceIds:['b2','c3']},
  now});
 return {...data,status:'playing',party:{
  active:{...data.party.active,level:2,hp:30},
  reserve:data.party.reserve.map((member,i)=>({...member,level:i+3,hp:i===0?23:0}))
 }};
}
const snapshot=(s,id)=>adventurePlaySheetSnapshotV1({
 session:s,bestiaryCards:cards,statRegistry:registry,selectedInstanceId:id,
 projectCombatVitals:({actor,hpMultiplier})=>({
  currentHp:actor.hp===null?35:actor.hp,maxHp:35,labMaxHp:140,
  baseMaxHp:140,hpPercent:Math.round(hpMultiplier*100)
 })
});

test('the first fighter and the reserve use the same canonical ordered team',()=>{
 const s=session(),before=JSON.stringify(s);
 assert.deepEqual([s.party.active,...s.party.reserve].map(m=>m.instanceId),['a1','b2','c3']);
 const swapped=moveAdventurePartyMemberV1({session:s,instanceId:'b2',direction:'up',now});
 assert.deepEqual([swapped.party.active,...swapped.party.reserve].map(m=>m.instanceId),
  ['b2','a1','c3']);
 assert.equal(swapped.party.active.hp,23);
 assert.equal(JSON.stringify(s),before,'no mutation of existing saved state');
 assert.equal(chooseAdventureActiveCreatureV1({session:s,instanceId:'b2',now}).party.active.instanceId,'b2');
 assert.throws(()=>moveAdventurePartyMemberV1({session:s,instanceId:'c3',direction:'up',now}),
  /KO/);
 assert.throws(()=>moveAdventurePartyMemberV1({session:s,instanceId:'unknown',direction:'up',now}),
  /absente/);
 assert.deepEqual([swapped.party.active,...swapped.party.reserve].map(m=>m.instanceId),
  JSON.parse(JSON.stringify(swapped)).party.reserve.reduce((v,m)=>v.concat(m.instanceId),
   [swapped.party.active.instanceId]),'stable order survives serialization');
});
test('the reserve has its own progression wallet, points and real sheet',()=>{
 const s=session();
 assert.equal(availableAdventureStatPointsV1(s,'a1'),20);
 assert.equal(availableAdventureStatPointsV1(s,'b2'),40);
 assert.equal(availableAdventureStatPointsV1(s,'c3'),60);
 const updated=allocateAdventureStatPointsV1({session:s,registry,statId:'health',
  points:5,instanceId:'b2',now});
 assert.equal(updated.party.active.statAllocations.health,undefined);
 assert.equal(updated.party.reserve[0].statAllocations.health,5);
 assert.equal(updated.party.reserve[1].statAllocations.health,undefined);
 assert.equal(availableAdventureStatPointsV1(updated,'b2'),35);
 const card=snapshot(updated,'b2');
 assert.equal(card.creature.instanceId,'b2');
 assert.equal(card.creature.name,'beta');
 assert.equal(card.creature.isActive,false);
 assert.equal(card.creature.availablePoints,35);
 assert.equal(card.creature.stats[0].allocated,5);
 assert.deepEqual(card.team.map(x=>x.isSelected),[false,true,false]);
 assert.equal(snapshot(updated,'a1').creature.isActive,true);
 assert.equal(snapshot(updated,'c3').creature.hp,0,'KO creature remains inspectable');
 assert.equal(s.party.reserve[0].statAllocations.health,undefined);
});
test('new games start at minimum native movement speed without rewriting old saves',()=>{
 assert.equal(normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1).navigation.moveSpeed,90);
 const old={...SHOWCASE_ADVENTURE_RULES_V1};delete old.navigation;
 assert.equal(normalizeAdventureRulesV1(old).navigation,undefined);
 assert.equal(normalizeAdventureRulesV1({...old,navigation:{moveSpeed:150}}).navigation.moveSpeed,150);
 assert.throws(()=>normalizeAdventureRulesV1({...old,navigation:{moveSpeed:89}}));
 assert.throws(()=>normalizeAdventureRulesV1({...old,navigation:{moveSpeed:95}}));
});
test('real in-game title and team event use the single Explorer runtime',()=>{
 const base=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
 const app=readFileSync(new URL('adventure-app-v1.mjs',base),'utf8');
 const html=readFileSync(new URL('adventure.html',base),'utf8');
 const view=readFileSync(new URL('adventure-play-sheet-view-v1.mjs',base),'utf8');
 for(const id of ['adventure-return-title','adventure-move-speed','adventure-play-sheet'])
  assert.match(html,new RegExp(id));
 assert.match(app,/gensrpg\.capture\.v2\.save-and-title\.v1/);
 assert.match(app,/gensrpg\.capture\.v2\.party-refresh\.v1/);
 assert.match(app,/GensCaptureV2/);
 assert.match(view,/onSelectCreature/);
 assert.match(view,/onMoveCreature/);
 assert.match(view,/onMakeActive/);
});
