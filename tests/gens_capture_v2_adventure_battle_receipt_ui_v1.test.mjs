import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  presentAdventureCombatAwardV1,formatAdventureCombatAwardV1
} from '../assets/gensrpg/capture-v2/adventure-combat-result-ui-v1.mjs';
import {connectAdventureCombatHostV1,ADVENTURE_COMBAT_REQUEST_V1}
 from '../assets/gensrpg/capture-v2/adventure-combat-host-v1.mjs';
import {createAdventureSessionV1,DEFAULT_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const fromCore=(path,name)=>{
 const scope={};
 vm.runInNewContext(fs.readFileSync(new URL(path,import.meta.url),'utf8'),scope);
 return scope[name];
};
const progressionCore=fromCore('../assets/gensrpg/core/progression-v1.js','GensProgressionV1');
const cards=[
 {id:'real-player',name:'Créature alliée',level:1,skills:[{state:'ready'}]},
 {id:'real-wild',name:'Créature sauvage',level:2,skills:[{state:'ready'}]}
];
const sessionId='result-ui-session-1',worldId='world-1',
 playUrl='https://game.invalid/preview/capture-v2-pr225/vendor/exploration-lab/sculpt-lab.html?play=1&adventureSession='+sessionId;
function game(){
 const base=createAdventureSessionV1({
  bestiaryCards:cards,starterId:'real-player',rules:DEFAULT_ADVENTURE_RULES_V1,
  ids:{sessionId,instanceId:'owned-1'},now:'2026-11-05T16:00:00.000Z'
 });
 return {...base,status:'playing',world:{mapRef:worldId,position:null}};
}
function envelope({encounterId='enc-1',returnToken='return-1',outcome='victory'}={}){
 return {
  version:1,snapshot:{
   schema:'capture-encounter-snapshot-v1',version:1,encounterId,returnToken,
   source:'terrain-random',player:{partyRef:'adventure-party:'+sessionId},
   opponents:[{creatureId:'real-wild'}],
   rules:{rulesetId:'capture.standard.1v1'},
   context:{areaId:'zone-1',terrainFamilyId:'forest',elementId:'nature'}
  },
  returnState:{areaId:'zone-1',x:4,y:8,returnUrl:playUrl},
  result:{
   schema:'capture-combat-result-v1',version:1,encounterId,returnToken,
   outcome,partyState:{activeCreatureId:'real-player',activeInstanceId:'owned-1',hp:33.47000000000003},
   rewards:[],capture:null,worldEffects:[]
  }
 };
}
function hostFixture({failSave=false}={}){
 let current=game(),listener=null,refreshes=0,committed=[],writes=0;
 let pending=envelope();
 const frame={
  isConnected:true,contentWindow:{location:{href:playUrl}},
  addEventListener:(name,fn)=>{assert.equal(name,ADVENTURE_COMBAT_REQUEST_V1);listener=fn;}
 };
 const store={
  load:()=>current,
  save:next=>{if(failSave)throw new Error('Core Storage unavailable');
   current=next;writes++;return next;}
 };
 connectAdventureCombatHostV1({
  frame,playUrl,sessionId,worldId,store,
  locks:{request:(_key,callback)=>callback()},
  readPending:()=>pending,
  refreshParty:s=>{assert.equal(s.sessionId,sessionId);refreshes++;},
  bestiaryCards:cards,progressionCore,
  onCommitted:value=>{committed.push(value);
   assert.equal(value.session,store.load(),'visual callback must run AFTER durable commit');}
 });
 async function request(kind='commit'){
  return new Promise(resolve=>{
   listener({
    target:frame,detail:{kind,sessionId,respond:resolve},
    preventDefault(){}
   });
  });
 }
 return {request,store,setPending:p=>{pending=p},committed,counts:()=>({refreshes,writes})};
}
test('RED: UI receives only a real persisted win, no second award on duplicated native return',async()=>{
 const f=hostFixture();
 const first=await f.request();
 assert.equal(first.receipt.persisted,true);
 assert.equal(first.receipt.applied,true);
 assert.equal(f.committed.length,1);
 assert.equal(f.committed[0].award.xp,1300);
 assert.equal(f.committed[0].session.lastAward.xp,1300);
 assert.equal(f.committed[0].session.party.active.hp,33.47000000000003);
 assert.deepEqual(f.counts(),{refreshes:1,writes:1});
 const again=await f.request();
 assert.equal(again.receipt.applied,false);
 assert.equal(f.committed.length,1,'duplicate native commit may not reopen an award as new');
 assert.deepEqual(f.counts(),{refreshes:2,writes:1});
});
test('RED: refused Core write cannot trigger the overlay or acknowledge rewards',async()=>{
 const f=hostFixture({failSave:true});
 const response=await f.request();
 assert.match(response.error,/Core Storage unavailable/);
 assert.equal(f.committed.length,0);
 assert.equal(f.store.load().party.active.xp,0);
});
test('RED: game ready probe and failed/fled rewards never fabricate victory or XP',async()=>{
 const f=hostFixture();
 const ready=await f.request('ready');
 assert.equal(ready.ready,true);
 assert.equal(f.committed.length,0);
 f.setPending(envelope({outcome:'fled'}));
 const fled=await f.request();
 assert.equal(fled.receipt.persisted,true);
 assert.equal(f.committed.length,1);
 assert.equal(f.committed[0].award.outcome,'fled');
 assert.equal(f.committed[0].award.xp,0);
});
test('RED: visual-only formatter shows authentic saved XP, level, currency, drops, HP without computing rewards',()=>{
 const session=game();
 const award={
  encounterId:'enc-1',enemyId:'real-wild',outcome:'victory',xp:1300,
  levelBefore:2,levelAfter:3,currency:50,
  drops:[{itemId:'plume',quantity:2}],heroXp:0
 };
 session.lastAward=award;
 session.party={active:{...session.party.active,hp:33.47000000000003}};
 session.rules={
  ...session.rules,loot:{...session.rules.loot,
   items:[{id:'plume',name:'Plume d’Ailevent',saleValue:8}]}
 };
 const result=formatAdventureCombatAwardV1({session,award});
 assert.equal(result.heading,'Victoire !');
 assert.match(result.summary,/1 300 XP|1300 XP/);
 assert.match(result.summary,/niveau 2.*3/);
 assert.match(result.summary,/50 pièces/);
 assert.match(result.summary,/Plume d’Ailevent × 2/);
 assert.match(result.summary,/33[,.]47/);
 assert.doesNotMatch(result.summary,/Math\.random|lancer|calculer/i);
});
test('RED: DOM presentation uses only textContent; loss/flee remain readable and the overlay is dismissible',()=>{
 for(const [outcome,heading] of [['defeat','Défaite'],['fled','Fuite']]){
  const session=game();
  const award={encounterId:'enc',enemyId:'real-wild',outcome,xp:0,
    levelBefore:1,levelAfter:1,currency:0,drops:[],heroXp:0};
  session.lastAward=award;
  const view={dialog:{hidden:true},heading:{textContent:''},summary:{textContent:''}};
  presentAdventureCombatAwardV1({...view,session,award});
  assert.equal(view.dialog.hidden,false);
  assert.equal(view.heading.textContent,heading);
  assert.match(view.summary.textContent,/0 XP/);
 }
 const html=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const style=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
 const app=fs.readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 assert.match(html,/id="adventure-battle-result"/);
 assert.match(html,/role="dialog"/);
 assert.match(html,/id="adventure-battle-result-continue"/);
 assert.match(style,/#adventure-battle-result/);
 assert.match(style,/z-index/);
 assert.match(app,/onCommitted:.*presentAdventureCombatAwardV1/s);
 assert.match(app,/adventure-battle-result-continue/);
 assert.doesNotMatch(app,/award\.xp\s*=|award\.currency\s*=/);
});
