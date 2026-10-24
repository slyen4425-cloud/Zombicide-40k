'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const clean=fs.readFileSync(path.join(root,'assets/gensrpg/gens-rpg-stats-clean-167874.js'),'utf8');
const editor=fs.readFileSync(path.join(root,'assets/gensrpg/gens-hero-editor-dynamic-167897.js'),'utf8');
const normSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/stats-normalization-v1.js'),'utf8');
const heroValuesSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/stats-hero-values-v1.js'),'utf8');

// Definition/editor source.
assert.match(editor,/rec\?\.dungeonStats\?\.\[id\]/,
  'hero editor base value must come from dungeonStats');
assert.match(editor,/function gameStatValues\(d\)/,
  'game sheet must expose its base/total bridge');
assert.match(editor,/base=num\(canonicalValue\(d\.id,d,rec\)/,
  'game sheet base label must come from the hero definition');
assert.match(editor,/total=num\(api\(\)\?\.value\?\.\(hero,d\.id\),base\)/,
  'game sheet total must come from the canonical runtime API');

// Runtime source.
assert.match(clean,/st\.rpgAttributes\[id\]/,
  'canonical runtime must read persistent rpgAttributes');
assert.match(clean,/return clamp\(num\(st\.rpgAttributes\[id\],heroBase\)/,
  'runtime value must currently prefer persisted rpgAttributes over heroBase');
assert.match(clean,/runtimeValues:st\?\.rpgAttributes/,
  'Core Snapshot must receive persisted rpgAttributes as runtime values');

// Hero-editor persistence changes the definition, not an already-existing runtime state.
const persist=clean.match(/function persistHeroDynamic\(id,vals,beforeIds=\[\]\)\{([\s\S]*?)\nfunction movementFallback/);
assert.ok(persist,'persistHeroDynamic must remain inspectable');
assert.match(persist[1],/dungeonStats/,'hero save must persist definition values');
assert.doesNotMatch(persist[1],/rpgAttributes/,
  'hero-definition save currently does not migrate persistent runtime attributes');

// Prove Core S4 priority with concrete values, independently of UI.
const ctx={console};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(normSrc,ctx,{filename:'stats-normalization-v1.js'});
vm.runInContext(heroValuesSrc,ctx,{filename:'stats-hero-values-v1.js'});

const resolved=ctx.GensStatsHeroValuesV1.resolve({
  definitions:[{id:'force',name:'Force',defaultValue:10,min:0,max:999}],
  definitionValues:{force:16},
  runtimeValues:{force:10},
  fallbackValues:{}
});
assert.equal(resolved.baseValues.force,10,
  'existing runtime rpgAttributes currently has priority over the edited definition');
assert.equal(resolved.details.force.source,'runtime');

console.log(JSON.stringify({
  scenario:'Stats editor -> persistent runtime -> in-game sheet preaudit',
  definitionExample:{force:16,source:'hero.dungeonStats'},
  runtimeExample:{force:10,source:'state.rpgAttributes'},
  coreResolution:{force:resolved.baseValues.force,source:resolved.details.force.source},
  sheetSemantics:'Base hero = definition; Total = canonical runtime value',
  characterizedRisk:'after an editor base change, an existing persistent runtime can keep the old absolute value and display a different Total'
},null,2));
