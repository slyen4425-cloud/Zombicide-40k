const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-actions-direct-167887.js'),'utf8');
const visible=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-stats-editor-actions-167888.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'assets','gensrpg','gens-dungeon-hero-art-repair-167874.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
let profiles=[{id:'dungeon',rpgUniverse:{stats:{dynamicDefinitions:[],active:[]}}}];
const ctx={console,Math,Date,JSON,setTimeout:()=>0,clearTimeout:()=>{},
 currentRpgProfile:()=>profiles[0],getActiveGameProfile:()=>profiles[0],loadGameProfiles:()=>profiles,saveGameProfiles:a=>{profiles=a},
 GensCleanRpgStats167874:{canon:id=>String(id||''),root:p=>p.rpgUniverse.stats,def:id=>profiles[0].rpgUniverse.stats.dynamicDefinitions.find(d=>d.id===id)||null},
 GensUnifiedStats167885:{renderEditor:()=>true},showToast:()=>{}};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'gens-rpg-stats-actions-direct-167887.js'});
const api=ctx.GensStatsActionsDirect167887;assert.ok(api,'direct stat action API missing');
assert.equal(api.addStat(),true,'legacy direct new stat action must still succeed');
const s=profiles[0].rpgUniverse.stats;
assert.equal(s.dynamicDefinitions.length,1,'new stat must be persisted');
assert.ok(s.active.includes('nouvelle_stat'),'new stat must become active');
assert.equal(api.addEffect('nouvelle_stat'),true,'legacy direct add effect action must still succeed');
assert.equal(s.unifiedEffects85.length,1,'new effect must be persisted');
assert.match(visible,/APP_VERSION="16\.78\.88"/,'visible editor action module must be V16.78.88');
assert.match(visible,/pointerdown/,'visible editor actions must bind pointerdown');
assert.match(visible,/insertAdjacentHTML\("beforeend",statHtml\(id\)\)/,'new stat must be inserted visibly before save');
assert.match(visible,/insertAdjacentHTML\("beforeend",effectHtml\(source,id\)\)/,'new effect must be inserted visibly before save');
assert.match(loader,/gens-rpg-stats-editor-actions-167888\.js\?v=167888/,'always-loaded bridge must load V16.78.88 visible editor actions');
assert.match(loader,/GensRpgStatsEditorActions167888/,'loader readiness must target V16.78.88 API');
assert.match(sw,/gensrpg-cache-16\.78\.88-stat-editor-visible-actions/,'service worker cache must be V16.78.88');
assert.match(sw,/gens-rpg-stats-editor-actions-167888\.js/,'service worker must cache the V16.78.88 action file');
console.log('GenSrpG V16.78.88: visible new-stat + add-effect actions and production loader OK');
