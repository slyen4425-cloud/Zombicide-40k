import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAdventureRulesV1,SHOWCASE_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const load=path=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+path,import.meta.url),'utf8');
test('Monster Capture has one editor for items, monster drops and merchants; preplay is just its doorway',()=>{
 const shell=load('shell-entry-v1.js'),html=load('adventure.html');
 const app=load('adventure-app-v1.mjs'),css=load('adventure-style-v1.css');
 assert.match(shell,/items:\{label:"Objets et drops",path:"assets\/gensrpg\/capture-v2\/adventure\.html\?editor=items"/);
 assert.match(html,/id="adventure-loot-preparation-summary"/);
 assert.match(html,/id="adventure-open-item-editor"/);
 assert.match(html,/id="adventure-item-authoring"/);
 assert.match(html,/id="adventure-return-preparation"/);
 assert.match(html,/id="adventure-drop-filter"/);
 assert.match(html,/id="adventure-monster-fragments-save"/);
 assert.match(css,/body:not\(\[data-adventure-item-editor="true"\]\) #adventure-item-authoring\{display:none!important\}/);
 assert.match(css,/body\[data-adventure-item-editor="true"\] #adventure-loot-preparation-summary\{display:none!important\}/);
 assert.match(app,/saveCurrentAdventureRules\(\);\s*navigateToAdventureOwner\('items'\)/);
 assert.match(app,/saveCurrentAdventureRules\(\);\s*navigateToAdventureOwner\('adventure'\)/);
 assert.match(app,/shell\.open\?\.\(destination\)/);
 assert.match(app,/store\.save\(\{\.\.\.current,rules,updatedAt:/);
 assert.match(app,/draftStore\.save\(rules\)/);
 assert.doesNotMatch(app,/window\.open\(/,'no parallel editor window');
});

test('monsters share official AdventureRules for common loot and individual fragment odds',()=>{
 const baseline=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
 const species='crea_ailevent';
 const next=normalizeAdventureRulesV1({...baseline,
  fragmentRecruitment:{...baseline.fragmentRecruitment,perSpecies:{
   ...baseline.fragmentRecruitment.perSpecies,
   [species]:{dropChancePercent:33,dropMin:2,dropMax:4}
  }},
  loot:{...baseline.loot,items:[{id:'feather',name:'Plume',saleValue:7}],
   drops:[{speciesId:species,itemId:'feather',chancePercent:38,
    minQuantity:1,maxQuantity:3}]}
 });
 assert.equal(next.fragmentRecruitment.perSpecies[species].dropChancePercent,33);
 assert.equal(next.fragmentRecruitment.perSpecies[species].dropMin,2);
 assert.equal(next.fragmentRecruitment.perSpecies[species].dropMax,4);
 assert.equal(next.fragmentRecruitment.dropChancePercent,baseline.fragmentRecruitment.dropChancePercent);
 assert.equal(next.loot.drops[0].chancePercent,38,'ordinary drop and fragments have separate rules');
 assert.equal(next.loot.items.length,1);
 const restored=normalizeAdventureRulesV1({...next,fragmentRecruitment:{
  ...next.fragmentRecruitment,perSpecies:{}}});
 assert.equal(restored.fragmentRecruitment.perSpecies[species],undefined);
 assert.equal(restored.loot.drops.length,1,'reverting a species override never removes an item drop');
 assert.equal(restored.fragmentRecruitment.dropChancePercent,baseline.fragmentRecruitment.dropChancePercent);
 const old=normalizeAdventureRulesV1({...next,fragmentRecruitment:undefined});
 assert.equal(Object.hasOwn(old,'fragmentRecruitment'),false,
  'historical games must never enable fragments by entering the editor');
});
