import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ADVENTURE_RULES_V1,createAdventureSessionV1,
 normalizeAdventureHeroDisplayNameV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {writeAdventureHeroSelectionGrantV1}
 from '../assets/gensrpg/capture-v2/adventure-hero-selection-grant-v1.mjs';
const heroId='hero.user.00000000-0000-4000-8000-000000000001';
const cards=[{id:'published',name:'Publié',level:1,skills:[{state:'ready'}]}];
const game=(heroDisplayName)=>createAdventureSessionV1({
 bestiaryCards:cards,starterId:'published',heroDefinitionId:heroId,heroDisplayName,
 rules:DEFAULT_ADVENTURE_RULES_V1,
 ids:{sessionId:'session-hero-name',instanceId:'creature-1'},
 now:'2026-11-14T01:00:00.000Z'
});
test('new game owns an optional independent visible name, leaving avatar definition unchanged',()=>{
 const named=game('  Luna   Claire  ');
 assert.equal(named.hero.displayName,'Luna Claire');
 assert.equal(named.hero.definitionId,heroId);
 assert.equal(named.hero.progression,null);
 assert.equal(Object.hasOwn(game(null).hero,'displayName'),false,
  'historical sessions remain valid with no fabricated name');
});
test('hero name rejects controls, empty and excessive strings, without HTML or extra ID authority',()=>{
 for(const value of ['', '   ','x'.repeat(49), '\u0000bad','A\nB',null,42]){
  assert.throws(()=>normalizeAdventureHeroDisplayNameV1(value));
 }
 assert.equal(normalizeAdventureHeroDisplayNameV1('Héroïne 2.5D'),'Héroïne 2.5D');
});
test('name is sent only in the existing scoped same-origin hero grant',()=>{
 const session={...game('Luna'),status:'playing',world:{mapRef:'world1',position:null}};
 const written=new Map();
 const grant=writeAdventureHeroSelectionGrantV1({
  storage:{setItem(k,v){written.set(k,v)}},
  session,world:{id:'world1'},
  heroRecord:{schema:'gensrpg-exploration-user-hero-v1',version:1,id:heroId}
 });
 assert.equal(grant.heroDisplayName,'Luna');
 assert.equal(grant.heroDefinitionId,heroId);
 assert.equal(written.size,1);
 assert.equal(Object.hasOwn(grant,'assets'),false);
});
