'use strict';
// RED acceptance gate for the user-reported real Monster Capture regressions.
// This is deliberately NOT a replacement combat engine, editor or bestiary.
// It must not pass until the Lab is the sole authoring/combat authority.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('all spawnable historical Capture species have real signed Combat Lab authored transfers',()=>{
 const lab=process.env.COMBAT_LAB_ROOT;
 const site=process.env.CAPTURE_LAB_DELIVERY_SITE;
 assert.ok(lab&&site,'Require exact pinned Lab checkout and built signed delivery; no mock catalog');
 const original=JSON.parse(fs.readFileSync(path.join(lab,'data/capture/monster-capture-creatures.v1.json'),'utf8'));
 const published=JSON.parse(fs.readFileSync(path.join(site,'assets/gensrpg/capture/runtime-data/delivery-manifest.json'),'utf8'));
 assert.equal(original.provenance.sourceOwner,'MC162_ENTITIES');
 assert.ok(original.entries.some(c=>c.id==='crea_son_1'&&Number(c.spawnChance)>0),
  'Reproduce Sonilin (crea_son_1) from the actual Lab-preserved legacy source');
 const supported=new Set(published.supportedCreatureIds);
 const missing=original.entries.filter(c=>c.category==='creature'&&Number(c.spawnChance)>0&&!supported.has(c.id));
 assert.deepEqual(missing.map(c=>c.id),[],
  'World can encounter unsupported species; the Lab AUTHOR must publish valid transfers, not hide World encounters. Missing: '+missing.map(c=>c.id).join(', '));
});

test('real trainer battle must not call the historical Capture combat Core',()=>{
 const owner=read('assets/gensrpg/capture/legacy-monolith-functions-v1.js');
 const begin=owner.indexOf('function captureOpenTrainerBattle(){');
 const end=owner.indexOf('function captureLaunchTrainerBattle(',begin);
 assert.ok(begin>=0&&end>begin,'Canonical trainer handler must remain owned and discoverable');
 assert.doesNotMatch(owner.slice(begin,end),/captureStartBattleAutomatic\s*\(/,
  'Trainer still opens legacy combat rather than using the single Lab session');
 const patch=read('assets/gensrpg/capture/legacy-patches/capture-fix134-v1.js');
 assert.doesNotMatch(patch,/window\.captureOpenTrainerBattle\s*=\s*function/,
  'Legacy fix134 installs a second trainer handler; remove authority at original source, not by re-override');
});

test('official Combat Lab provider owns the creature editor contract, not an unimplemented stub',()=>{
 const provider=read('assets/gensrpg/capture/capture-native-lab-provider-v1.mjs');
 assert.doesNotMatch(provider,/openCreatureEditor\s*\(\)\s*\{\s*throw\s+new\s+Error/,
  'The real Lab editor is not connected; do not hide the old Capture editor instead');
});

test('combat RULES must be authored in Lab, but Capture World may retain economy/healing and team options',()=>{
 const editor=read('assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js');
 const begin=editor.indexOf('p.rpgUniverse.captureCombat={');
 const stop=editor.indexOf('p.rpgUniverse.trainerCombat=',begin);
 assert.ok(begin>=0 && stop>begin,'Inspect actual RPG editor write authority');
 const writer=editor.slice(begin,stop);
 // Do not outlaw all Capture world configuration: healing, trainer rewards
 // and saved-profile slots have a separate owner from combat rules.
 assert.doesNotMatch(writer,/\b(?:recallCost|autoReplaceKo|itemsAllowed|allowBattleOverride|defendAllowed|initiativeMode|victoryMode|itemSlots|itemsPerTurn)\s*:/,
  'Legacy RPG editor still writes combat-engine rules; Lab must own these definitions');
});

test('World emits a typed trainer NPC from its original location and consumes once',()=>{
 const vm=require('node:vm'),store=new Map(),math=Object.create(Math);math.random=()=>0.88;
 const ctx={Math:math,crypto:{randomUUID:()=> 'c4f3-7b2a'},activeGameProfileId:()=> 'profile-7',
  localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))}};
 vm.createContext(ctx);vm.runInContext(read('assets/gensrpg/capture/world-exploration-v1.js'),ctx);
 ctx.captureProfileLocations=()=>[{id:'route',name:'Route'}];
 ctx.captureRollLocation=()=>({creature:{id:'crea_voltik',name:'Voltige'}});
 ctx.captureTrainerDifficulty134=()=>3;
 ctx.renderCaptureWorldHub=()=>{};ctx.renderCaptureEncounterPage=()=>{};ctx.renderCaptureExploreResult=()=>{};
 ctx.captureGenerateEncounter();
 const e=ctx.captureWorldState().last;
 assert.equal(e.type,'friendly_trainer');assert.equal(e.trainerId,'npc-c4f37b2a');
 assert.equal(e.trainerDifficulty,3);assert.equal(e.captureAllowed,false);
 assert.deepEqual(Array.from(e.creatureIds),['crea_voltik']);
 ctx.saveCaptureWorldState({...ctx.captureWorldState(),last:{...e,encounterId:'signed-npc-7'}});
 ctx.captureConsumeTrainerEncounter('victory');
 assert.equal(ctx.captureWorldState().last.type,'resolved');
});

test('trainer World button enters the same native Lab scene and has no global override',()=>{
 const owner=read('assets/gensrpg/capture/legacy-monolith-functions-v1.js');
 const a=owner.indexOf('function captureOpenTrainerBattle(){'),b=owner.indexOf('function captureLaunchTrainerBattle(',a);
 assert.match(owner.slice(a,b),/startCaptureOfficialTrainerEntryV1/);
 const entry=read('assets/gensrpg/capture/capture-official-wild-entry-v1.mjs');
 assert.match(entry,/export async function startCaptureOfficialTrainerEntryV1/);
 assert.match(entry,/controller\.startTrainerBattle\(\)/);
 const composition=read('assets/gensrpg/capture/capture-official-hub-composition-v1.mjs');
 assert.match(composition,/createCaptureWorldLabTrainerTransactionV1/);
 // A list of accepted difficulty labels is not a combat policy. The native
 // Lab author must sign an executable versioned four-level policy; never
 // allow a UI-only difficulty selector to make a trainer battle pass.
 assert.ok(composition.includes('settings.trainerDifficultyPolicy'), 'Lab authored policy must be read');
 assert.ok(composition.includes('capture-trainer-difficulty-policy-v1'), 'Require signed versioned policy schema');
 assert.ok(composition.includes('policy.levels[encounter.trainerDifficulty-1]'), 'Require actual selected difficulty level');
 assert.ok(!composition.includes('manifest.trainerDifficultyLevels'), 'Labels alone must not authorize trainer battle');
});
