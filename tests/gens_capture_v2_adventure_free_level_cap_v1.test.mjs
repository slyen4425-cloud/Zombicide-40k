import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {
 SHOWCASE_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,coreAdventureProgressionConfigV1,
 createAdventureSessionV1,availableAdventureStatPointsV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventurePlayingPartyV1} from '../assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs';
const script=readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8');
const c={};vm.runInNewContext(script,c);const core=c.GensProgressionV1;
const setup=(maxLevel,per=2000)=>normalizeAdventureRulesV1({
 ...SHOWCASE_ADVENTURE_RULES_V1,
 progression:{...SHOWCASE_ADVENTURE_RULES_V1.progression,maxLevel,
  xpBands:[{throughLevel:maxLevel,xpPerLevel:per}]},
 heroProgression:{...SHOWCASE_ADVENTURE_RULES_V1.heroProgression,maxLevel}
});
test('creator-defined 250 and 1500 level caps are accepted; 100 remains only a showcase preset',()=>{
 for(const maxLevel of [101,250,1500]){
  const rules=setup(maxLevel);
  assert.equal(rules.progression.maxLevel,maxLevel);
  assert.equal(rules.heroProgression.maxLevel,maxLevel);
  const p=coreAdventureProgressionConfigV1(rules.progression);
  assert.equal(core.levelFromXp((maxLevel-1)*2000,p),maxLevel);
  assert.equal(core.levelFromXp((maxLevel-1)*2000-1,p),maxLevel-1);
  assert.equal(core.xpIntoLevel((maxLevel-1)*2000-1,p),1999);
  assert.equal(core.levelFromXp(Number.MAX_SAFE_INTEGER,p),maxLevel);
 }
 assert.equal(SHOWCASE_ADVENTURE_RULES_V1.progression.maxLevel,100);
});
test('large free cap scales by the creator bands, not a million materialized thresholds',()=>{
 const maxLevel=1_000_000;
 const rules=setup(maxLevel,5);
 const p=coreAdventureProgressionConfigV1(rules.progression);
 assert.equal(p.xpBands[0].throughLevel,maxLevel);
 assert.ok(Object.keys(p.xpThresholds??{}).length<1000,
  'performance: no materialized threshold for each level of a huge game');
 assert.equal(core.levelFromXp(4_999_995,p),maxLevel);
 assert.equal(core.levelFromXp(4_999_994,p),maxLevel-1);
 assert.equal(core.xpIntoLevel(4_999_994,p),4);
});
test('creature stat budget follows real level 250 without a hidden 100 limit',()=>{
 const rules=setup(250);
 const card={id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]};
 const session=createAdventureSessionV1({
  bestiaryCards:[card],starterId:'lumilo',rules,
  ids:{sessionId:'session-250',instanceId:'instance-250'},
  now:'2026-11-05T02:00:00Z'
 });
 const active={...session.party.active,level:250,xp:249*2000,statAllocations:{health:20}};
 const upgraded={...session,party:{active}};
 assert.equal(availableAdventureStatPointsV1(upgraded),249*20-20);
 assert.equal(upgraded.party.active.level,250);
});
test('same-origin Adventure party grant never clamps a valid saved level to 100',()=>{
 const rules=setup(250);
 const card={id:'lumilo',name:'Lumilo',skills:[{state:'ready'}]};
 const fresh=createAdventureSessionV1({
  bestiaryCards:[card],starterId:'lumilo',rules,
  ids:{sessionId:'session-high',instanceId:'member-high'},
  now:'2026-11-05T02:00:00Z'
 });
 const session={...fresh,status:'playing',world:{mapRef:'world-1',position:null},
  party:{active:{...fresh.party.active,level:250,xp:249*2000}}};
 const writes=new Map();
 const grant=writeAdventurePlayingPartyV1({
  storage:{setItem:(k,v)=>writes.set(k,v),getItem:k=>writes.get(k)??null},
  session,world:{id:'world-1'},combatSha:'a'.repeat(40),
  publicationGrant:{schema:'gensrpg.capture.v2.published-encounters.v1',version:1,
   sessionId:session.sessionId,worldId:'world-1',combatSha:'a'.repeat(40),
   allowedCreatureIds:['lumilo']}
 });
 assert.equal(grant.active.level,250);
 assert.equal([...writes.values()].length,1);
});
test('UI accepts typed cap above 100 for creature, hero and each XP band',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 for(const id of ['adventure-level-max','adventure-hero-max-level']){
  const tag=html.match(new RegExp('<input[^>]*id="'+id+'"[^>]*>'))?.[0];
  assert.ok(tag,'missing '+id);
  assert.doesNotMatch(tag,/max="100"/,'no gameplay cap of 100 in '+id);
 }
 assert.doesNotMatch(app,/upper\.max\s*=\s*100\b/);
});
