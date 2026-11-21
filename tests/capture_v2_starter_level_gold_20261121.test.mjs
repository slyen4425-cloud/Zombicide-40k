import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {
 SHOWCASE_ADVENTURE_RULES_V1,DEFAULT_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1,createAdventureSessionV1,
 availableAdventureStatPointsV1,adventureStartingXpForLevelV1,
 calculateAdventureXpV1,calculateAdventureVictoryCurrencyV1,coreAdventureProgressionConfigV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const root={};root.window=root;
runInNewContext(readFileSync(new URL('../assets/gensrpg/core/progression-v1.js',import.meta.url),'utf8'),root);
const progressionCore=root.GensProgressionV1;
const cards=[{id:'crea-test',name:'Test Creature',rarity:'rare',level:1,
 skills:[{id:'skill.native',state:'ready'}]}];
function makeState(rules,starterIds=['crea-test']){
 return createAdventureSessionV1({bestiaryCards:cards,starterId:starterIds[0],starterIds,
  progressionCore,rules,now:'2026-11-21T07:00:00.000Z',
  ids:{sessionId:'session.test',instanceId:'id.1',creatorId:'host.1',
   reserveInstanceIds:starterIds.slice(1).map((_,i)=>'id.'+(i+2))}});
}
test('nouvelle partie : 20 niveaux acquis, XP Core cohérente, 380 points à repartir',()=>{
 const rules=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  starterSelection:{allowAllRarities:false,startLevel:20}});
 const state=makeState(rules,Array(6).fill('crea-test'));
 const config=coreAdventureProgressionConfigV1(state.rules.progression);
 for(const member of [state.party.active,...state.party.reserve]){
  assert.equal(member.level,20);
  assert.equal(progressionCore.levelFromXp(member.xp,config),20);
  assert.ok(member.xp>0);
  assert.equal(availableAdventureStatPointsV1(state,member.instanceId),19*20);
  assert.deepEqual(member.statAllocations,{});
 }
 assert.equal(state.party.reserve.length,5);
 assert.equal(state.status,'configured');
});
test('le niveau de départ reste 1 et ne nécessite aucune API supplémentaire pour une ancienne partie',()=>{
 const legacy=createAdventureSessionV1({bestiaryCards:cards,starterId:'crea-test',
  rules:DEFAULT_ADVENTURE_RULES_V1,now:'2026-11-21T07:00:00.000Z',
  ids:{sessionId:'legacy',instanceId:'creature1',creatorId:'host1'}});
 assert.equal(legacy.party.active.level,1);
 assert.equal(legacy.party.active.xp,0);
 assert.equal(availableAdventureStatPointsV1(legacy),0);
 assert.equal('startLevel' in (legacy.rules.starterSelection??{}),false);
 assert.equal('currencyMultiplier' in legacy.rules.loot,false);
});
test('niveau initial borné au niveau max et à une valeur entière',()=>{
 for(const n of [0,-1,100.2,1000]){
  const r={...SHOWCASE_ADVENTURE_RULES_V1,
   starterSelection:{allowAllRarities:false,startLevel:n}};
  assert.throws(()=>normalizeAdventureRulesV1(r),/startLevel|Niveau|initial/);
 }
});
test('la courbe Core reste l autorité unique pour trouver le seuil d XP initial',()=>{
 const rules=SHOWCASE_ADVENTURE_RULES_V1;
 const start=adventureStartingXpForLevelV1({
  level:20,progression:rules.progression,progressionCore
 });
 const config=coreAdventureProgressionConfigV1(rules.progression);
 assert.equal(progressionCore.levelFromXp(start-1,config),19);
 assert.equal(progressionCore.levelFromXp(start,config),20);
});
test('l XP garde son multiplicateur officiel, aucun second multiplicateur ajouté',()=>{
 const base=calculateAdventureXpV1({rules:SHOWCASE_ADVENTURE_RULES_V1,
  allyLevel:20,enemyLevel:20}).xp;
 const r=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  xp:{...SHOWCASE_ADVENTURE_RULES_V1.xp,globalMultiplier:2}});
 assert.equal(calculateAdventureXpV1({rules:r,allyLevel:20,enemyLevel:20}).xp,base*2);
});
test('or : multiplicateur indépendant x2 et anciennes règles préservées',()=>{
 const r=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  loot:{...SHOWCASE_ADVENTURE_RULES_V1.loot,currencyMultiplier:2}});
 assert.equal(r.loot.currencyMultiplier,2);
 assert.equal(normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1).loot.currencyMultiplier,undefined);
 for(const n of [-0.1,Infinity,101,'2'])
  assert.throws(()=>normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
   loot:{...SHOWCASE_ADVENTURE_RULES_V1.loot,currencyMultiplier:n}}));
 assert.equal(calculateAdventureVictoryCurrencyV1({rules:r}),0,
  'aucun gain si le paramètre de base est 0');
 const paid=normalizeAdventureRulesV1({...r,loot:{...r.loot,currencyPerVictory:150}});
 assert.equal(calculateAdventureVictoryCurrencyV1({rules:paid}),300);
 assert.equal(calculateAdventureVictoryCurrencyV1({rules:paid,trainerReward:{currency:50,items:[]}}),400,
  'les bonus de dresseur utilisent le même multiplicateur');
 assert.equal(calculateAdventureVictoryCurrencyV1({rules:SHOWCASE_ADVENTURE_RULES_V1,
  trainerReward:{currency:50,items:[]}}),50,
  'une ancienne partie sans multiplicateur reste ×1');
});
test('les réglages sont dans les volets natifs sans nouveau menu indépendant',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const start=html.indexOf('id="adventure-advanced-panel"');
 const end=html.indexOf('id="adventure-multiplayer-panel"');
 const advanced=html.slice(start,end);
 for(const id of ['adventure-starter-level','adventure-xp-global','adventure-gold-multiplier',
  'adventure-defeat-policy'])assert.ok(advanced.includes('id="'+id+'"'),id);
 assert.match(app,/progressionCore:window\.GensProgressionV1/);
 assert.match(app,/startLevel:numberFrom\(idField\.starterLevel\)/);
 assert.match(app,/currencyMultiplier:numberFrom\(idField\.goldMultiplier\)/);
});
