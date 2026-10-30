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

test('Capture combat rules must no longer be authored by the historical GenSrpg RPG editor',()=>{
 const editor=read('assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js');
 assert.doesNotMatch(editor,/p\.rpgUniverse\.captureCombat\s*=\s*\{/,
  'Old RPG universe editor is still an independent writer of Capture combat rules; transfer authoring to Lab source');
});
