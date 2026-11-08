import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureSessionV1,SHOWCASE_ADVENTURE_RULES_V1} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {adventurePlaySheetSnapshotV1} from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';
import {publishedCapturePortraitUrlV1} from '../assets/gensrpg/capture-v2/adventure-sheet-visual-v1.mjs';
const published=[{id:'lumilo',name:'Lumilo',skills:[{state:'ready'}],
  portrait:{assetId:'lumilo.front',file:'capture/lumilo/front.webp'},
  elements:['light'],measures:[{key:'health',label:'Santé',value:60},{key:'speed',label:'Vitesse',value:18}]
}];
const registry={schema:'capture-stat-registry-v1',stats:[
  {id:'health',label:'Santé / PV',maxHpPerPoint:1}, {id:'speed',label:'Vitesse'}
]};
// Unit test doubles are intentionally injected: the production caller passes
// the certified Combat Core functions, tested again against the real _site.
const nativeHealth={
 projectCombatStatEffects:({statValues})=>Object.freeze({
  hasMaxHpProjection:true,maxHp:statValues.values.health??0
 }),
 projectCombatMaxHp:(amount,ratio)=>amount===0?0:Math.max(1,Math.ceil(amount*ratio))
};
const sheet=session=>adventurePlaySheetSnapshotV1({
 session,bestiaryCards:published,statRegistry:registry,...nativeHealth
});
const save=()=>{
 const basic=createAdventureSessionV1({
  bestiaryCards:published,starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-play-1',instanceId:'owned-1',creatorId:'creator-1'},
  now:'2026-11-05T14:00:00Z'
 });
 return {...basic,status:'playing',world:{mapRef:'world-1',position:[1,2]},
  inventory:{currency:12,items:{'item-plume':3}},
  rules:{...basic.rules,loot:{...basic.rules.loot,
   items:[{id:'item-plume',name:'Plume',saleValue:4}],drops:[]}},
  party:{active:{...basic.party.active,level:2,xp:2000,statAllocations:{health:3}}}
 };
};
test('active character sheet is only a projection of canonical current Capture session and published registry',()=>{
 const snapshot=sheet(save());
 assert.equal(snapshot.hero.level,null,'hero has no level unless creator enables it');
 assert.equal(snapshot.creature.speciesId,'lumilo');
 assert.equal(snapshot.creature.name,'Lumilo');
 assert.equal(snapshot.creature.level,2);
 assert.equal(snapshot.creature.xp,2000);
 assert.equal(snapshot.creature.availablePoints,17);
 assert.equal(snapshot.creature.portrait.file,'capture/lumilo/front.webp');
 assert.deepEqual(snapshot.creature.elements,['light']);
 assert.equal(snapshot.creature.stats[0].baseValue,60,'published Combat measure must be displayed without recalculation');
 assert.equal(snapshot.creature.stats[0].effectiveValue,16,'in-game Santé displays the official 25% HP');
 assert.deepEqual(snapshot.creature.gameHp,{
  current:16,max:16,labMax:63,percent:25,
  restoredOnNextCombat:true,savedHpExceedsMax:false
 },'a null persisted HP means full native HP, never unknown 60/63');
 assert.equal(snapshot.creature.hp,null,'the Core saved HP remains unmodified');

 assert.equal(snapshot.creature.stats[0].id,'health');
 assert.equal(snapshot.creature.stats[0].allocated,3);
 assert.equal(snapshot.inventory.currency,12);
 assert.equal(snapshot.inventory.items[0].name,'Plume');
 assert.equal(snapshot.inventory.items[0].quantity,3);
 assert.equal(snapshot.team.length,1);
 assert.equal(snapshot.team[0].instanceId,'owned-1');
 assert.equal(Object.hasOwn(snapshot,'reserve'),false,'never invent reserve party state');
});
test('unsupported or missing official stat registry fails closed',()=>{
 assert.throws(()=>adventurePlaySheetSnapshotV1({session:save(),bestiaryCards:published,statRegistry:null,...nativeHealth}),
  /registry|officiel|stat/i);
 assert.throws(()=>adventurePlaySheetSnapshotV1({session:{...save(),status:'configured'},bestiaryCards:published,statRegistry:registry,...nativeHealth}),
  /playing|partie|jeu/i);
});
test('the actual play view has one accessible sheet overlay, and no rival exploration engine',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 for(const id of ['adventure-play-sheet','adventure-open-sheet','adventure-close-sheet',
  'adventure-sheet-content','adventure-play-hud'])
  assert.ok(html.includes('id="'+id+'"'),'missing live play sheet control '+id);
 assert.match(html,/<dialog[^>]*id="adventure-play-sheet"/);
 assert.match(app,/adventurePlaySheetSnapshotV1/);
 assert.match(app,/allocateAdventureStatPointsV1/);
 assert.match(app,/refreshParty/,'must reproject the canonical party after allocation');
 assert.doesNotMatch(app,/location\.reload\(/);
});

test('published portrait URL resolves only to native immutable Capture artwork, never arbitrary resource',()=>{
 const moduleUrl='https://example.org/site/assets/gensrpg/capture-v2/adventure-app-v1.mjs';
 const valid=publishedCapturePortraitUrlV1({card:published[0],moduleUrl});
 assert.equal(valid,'https://example.org/site/vendor/exploration-lab/capture-assets/assets/library/capture/lumilo/front.webp');
 for(const file of ['../../other-module/test.png','/assets/sneaky.png','https://evil.test/a.png',
  'capture/../../../private.png','capture/sprites/animation.json']){
  assert.equal(publishedCapturePortraitUrlV1({card:{portrait:{file}},moduleUrl}),null,file);
 }
 assert.equal(publishedCapturePortraitUrlV1({card:{},moduleUrl}),null);
});
test('in-game sheet has illustrated native profile, accessible fullscreen action and full-viewport frame',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-style-v1.css',import.meta.url),'utf8');
 assert.match(html,/id="adventure-fullscreen"/,'game needs a fullscreen touch action');
 assert.match(app,/requestFullscreen\(/,'game entry must offer browser fullscreen on a real gesture');
 assert.match(app,/createUserHeroStoreV1/,'hero portrait must read the original Exploration owner, not a local duplicate');
 assert.match(html,/id="adventure-hero-choice"/,'the actual player must select from the original Explorer hero library');
 assert.match(app,/writeAdventureHeroSelectionGrantV1/,'the native Exploration engine must receive the chosen HeroDefinition');
 assert.match(app,/heroDefinitionId:\$\('adventure-hero-choice'\)\.value\|\|null/,'new saves must persist the selected official hero identity');
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(view,/data-capture-official-portrait/,'the actual published creature portrait must render');
 assert.match(css,/#adventure-play-frame\s*\{[^}]*100dvh/s,'play iframe must fill dynamic viewport height');
 assert.match(css,/\.sheet-profile/,'character and creature should have an illustrated profile layout');
 assert.doesNotMatch(app,/location\.reload\(/);
});

test('a saved AdventureSession retains a selected canonical Exploration HeroDefinition ID',()=>{
 const heroId='hero.user.12345678-1234-1234-1234-123456789abc';
 const session=createAdventureSessionV1({
  bestiaryCards:published,starterId:'lumilo',rules:SHOWCASE_ADVENTURE_RULES_V1,
  ids:{sessionId:'session-with-hero',instanceId:'creature-with-hero',creatorId:'creator-with-hero'},
  now:'2026-11-06T14:08:00Z',heroDefinitionId:heroId
 });
 assert.equal(session.hero.definitionId,heroId);
 assert.equal(session.hero.progression,null,'choosing a portrait never enables hero XP implicitly');
});

test('native Play starts in full dynamic viewport without forcibly entering browser fullscreen above Shell return',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const start=app.indexOf("$('adventure-play').addEventListener");
 const end=app.indexOf("$('adventure-resume').addEventListener",start);
 assert.ok(start>=0&&end>start,'real launch handler must be present');
 const launch=app.slice(start,end);
 assert.match(launch,/document\.body\.dataset\.adventurePlaying='true'/);
 assert.doesNotMatch(launch,/requestAdventureFullscreen\s*\(/,
  'auto fullscreen inside nested Capture iframe steals the Shell return touch target');
 assert.match(app,/adventure-fullscreen'\)\.addEventListener\('click'/,
  'browser fullscreen must remain an explicit player choice');
});

test('game-health readout follows each creator percentage and gained Santé points, never rewrites a save',()=>{
 const original=save();
 for(const [pct,expected] of [[25,16],[50,32],[100,63],[33,21]]){
  const scoped={...original,rules:{...original.rules,
   combat:{...original.rules.combat,hpMultiplier:pct/100}}};
  const snap=sheet(scoped);
  assert.equal(snap.creature.gameHp.max,expected,'incorrect in-game HP at '+pct+'%');
  assert.equal(snap.creature.stats.find(st=>st.id==='health').effectiveValue,expected);
  assert.equal(snap.creature.stats.find(st=>st.id==='health').baseValue,60);
 }
 const increased={...original,party:{...original.party,
  active:{...original.party.active,statAllocations:{health:7}}}};
 const grown=sheet(increased);
 assert.equal(grown.creature.gameHp.labMax,67);
 assert.equal(grown.creature.gameHp.max,17,'stat upgrade must be scaled by the same game policy');
 const damaged={...original,party:{...original.party,
  active:{...original.party.active,hp:10}}};
 assert.equal(sheet(damaged).creature.gameHp.current,10,'remaining battle HP is never multiplied twice');
 assert.equal(damaged.party.active.hp,10);
});
test('rendered sheet labels maximum and current PV as game values, with Lab source secondary',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(app,/projectCombatStatEffects:projectCaptureStatEffectsV1/);
 assert.match(app,/projectCombatMaxHp:projectCaptureEncounterMaxHpV1/);
 assert.match(view,/PV en jeu/);
 assert.match(view,/c\.gameHp\.max/);
 assert.match(view,/stat\.effectiveValue/);
 assert.match(view,/Base Combat avec points/);
 assert.doesNotMatch(view,/c\.hp===null\?'Non renseignés'/);
});
