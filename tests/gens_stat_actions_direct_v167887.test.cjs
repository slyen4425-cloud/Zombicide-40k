const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const visible=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-editor-actions-167888.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
let profiles=[{id:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[],active:[],unifiedEffects85:[]}}}];
let renders=0;
const ctx={console,Math,Date,JSON,setTimeout:()=>0,clearTimeout:()=>{},
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=a},
 GensCleanRpgStats167874:{canon:id=>String(id||''),root:p=>p.rpgUniverse.stats,def:id=>profiles[0].rpgUniverse.stats.dynamicDefinitions.find(d=>d.id===id)||null},
 GensUnifiedStats167885:{renderEditor:()=>{renders++;return true}},showToast:()=>{}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(visible,ctx,{filename:'gens-rpg-stats-editor-actions-167888.js'});
const api=ctx.GensRpgStatsEditorActions167888;assert.ok(api,'V16.78.89 stat editor API missing');
assert.equal(api.APP_VERSION,'16.78.89');
assert.equal(api.addStat(),true,'new stat must persist on a normal action');
const s=profiles[0].rpgUniverse.stats;
assert.equal(s.dynamicDefinitions.length,1,'new stat must exist in profile data immediately');
assert.equal(s.dynamicDefinitions[0].id,'nouvelle_stat');
assert.ok(s.active.includes('nouvelle_stat'),'new stat must be active immediately');
assert.ok(renders>=1,'canonical editor must rerender after creating a stat');
assert.equal(api.addEffect('nouvelle_stat'),true,'effect must persist on the new stat');
assert.equal(s.unifiedEffects85.length,1,'new effect must exist in profile data immediately');
assert.equal(s.unifiedEffects85[0].source,'nouvelle_stat');
assert.ok(renders>=2,'canonical editor must rerender after adding an effect');
assert.doesNotMatch(visible,/addEventListener\("(?:pointerdown|touchstart|mousedown)"/,'V16.78.89 must not bind long-press/down events');
assert.match(visible,/addEventListener\("pointerup"/,'V16.78.89 must bind normal pointer release');
assert.doesNotMatch(visible,/insertAdjacentHTML/,'V16.78.89 must not create temporary DOM-only stat drafts');
assert.match(visible,/syncVisibleStatFields/,'current stat form values must be synchronized before structural rerender');
assert.match(loader,/gens-rpg-stats-editor-actions-167888\.js\?v=167889/,'production loader must force V16.78.89 stat actions');
assert.match(sw,/gensrpg-cache-16\.78\.89-stat-persistence/,'service worker cache must be V16.78.89');
console.log('GenSrpG V16.78.89: persistent canonical new-stat + add-effect actions OK');
